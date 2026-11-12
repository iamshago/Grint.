import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  addProgramItem,
  createUserWorkout,
  fetchUserWorkout,
  replaceWorkoutExercises,
  updateUserWorkout,
  fetchExerciseCatalog,
  CATEGORY_FALLBACK_IMAGE,
  type DraftExercise,
} from '@/lib/myPrograms'
import { SLOT_ORDER } from '@/types'
import type { Exercise, SlotType, WorkoutCategory } from '@/types'

/**
 * Logique de l'éditeur de séance perso, sans interface : l'état de la séance (nom, catégorie,
 * image, 4 emplacements guides + exercices libres avec séries / réps / repos), les actions
 * (placer, régler, retirer, ajouter, réordonner) et l'enregistrement par myPrograms.ts,
 * tels que l'ancien éditeur (MyWorkoutEdit) les faisait.
 *
 * Utilisée par WorkoutEditor : création (planches F3 / F4) et modification (planche F5, réglages
 * dépliables branchés sur `regler`, `retirer`, `placer`, `reordonnerLibres`).
 */

/** Un exercice de la séance : un emplacement guide, ou un exercice libre (repéré par son uid). */
export type CibleExercice = { kind: 'slot'; slot: SlotType } | { kind: 'free'; uid: string }

/** Où placer l'exercice choisi dans la feuille d'exercices. */
export type CiblePlacement =
  | { kind: 'slot'; slot: SlotType }
  | { kind: 'free-add' }
  | { kind: 'free-replace'; uid: string }

export type SlotMap = Record<SlotType, DraftExercise | null>
const EMPTY_SLOTS: SlotMap = { contraction: null, stretch: null, unilateral: null, isolation: null }

/** Bornes des réglages (planche F5-Modifier-seance : séries 1-10, réps 1-30, repos 0-300 s par 15 s). */
export const BORNES = {
  sets: { min: 1, max: 10, pas: 1 },
  reps: { min: 1, max: 30, pas: 1 },
  rest_seconds: { min: 0, max: 300, pas: 15 },
} as const

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Valeurs par défaut d'un exercice ajouté (celles de l'ancien éditeur). */
export function makeDraft(exercise: Exercise, slot: SlotType | null): DraftExercise {
  return {
    uid: crypto.randomUUID(),
    exercise_id: exercise.id,
    exercise,
    sets: 3,
    reps: '10',
    rest_seconds: 90,
    slot_type: slot,
    order_index: 0,
  }
}

/** Un réglage : séries, réps (nombre) ou repos (s). Les valeurs sont bornées comme avant. */
export type Reglage = { sets?: number; reps?: number; rest_seconds?: number }

interface Options {
  programId?: string
  workoutId?: string
  /** Séance introuvable (édition). */
  onExit: () => void
  /** Après l'enregistrement. */
  onSaved: () => void
}

export function useEditeurSeance({ programId, workoutId, onExit, onSaved }: Options) {
  const isEdit = Boolean(workoutId)

  const [name, setNameState] = useState('')
  const [category, setCategory] = useState<WorkoutCategory>('upper')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [slots, setSlots] = useState<SlotMap>(EMPTY_SLOTS)
  const [freeExos, setFreeExos] = useState<DraftExercise[]>([])
  const [catalog, setCatalog] = useState<Exercise[]>([])

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [blockError, setBlockError] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  // Sortie différée après le toast soft — annulée si on démonte avant.
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }, [])

  // Catalogue
  useEffect(() => {
    fetchExerciseCatalog()
      .then(setCatalog)
      .catch((e) => console.error(e))
  }, [])

  // Chargement (édition)
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit
  useEffect(() => {
    if (!isEdit) return
    let active = true
    async function load() {
      try {
        const workout = await fetchUserWorkout(workoutId as string)
        if (!workout) return onExitRef.current()
        if (!active) return
        setNameState(workout.name)
        setCategory(workout.category)
        setImageUrl(workout.image_url ?? null)
        const nextSlots: SlotMap = { ...EMPTY_SLOTS }
        const free: DraftExercise[] = []
        for (const e of workout.user_workout_exercises ?? []) {
          const draft: DraftExercise = {
            uid: crypto.randomUUID(),
            id: e.id,
            exercise_id: e.exercise_id,
            exercise: e.exercise,
            sets: e.sets,
            reps: e.reps,
            rest_seconds: e.rest_seconds,
            slot_type: e.slot_type,
            order_index: e.order_index,
          }
          if (e.slot_type && SLOT_ORDER.includes(e.slot_type)) nextSlots[e.slot_type] = draft
          else free.push(draft)
        }
        setSlots(nextSlots)
        setFreeExos(free)
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [isEdit, workoutId, programId])

  const filledSlots = useMemo(() => SLOT_ORDER.filter((s) => slots[s]).length, [slots])
  const totalExos = filledSlots + freeExos.length

  /** Exercices dans l'ordre d'enregistrement : emplacements remplis, puis libres. */
  const ordered: DraftExercise[] = useMemo(
    () => [
      ...SLOT_ORDER.filter((s) => slots[s]).map((s) => ({ ...(slots[s] as DraftExercise), slot_type: s })),
      ...freeExos.map((d) => ({ ...d, slot_type: null })),
    ],
    [slots, freeExos],
  )

  const clearError = useCallback(() => setBlockError(''), [])

  const setName = useCallback((v: string) => {
    setNameState(v)
    setBlockError('')
  }, [])

  const draftDe = useCallback(
    (cible: CibleExercice | null): DraftExercise | null => {
      if (!cible) return null
      if (cible.kind === 'slot') return slots[cible.slot]
      return freeExos.find((d) => d.uid === cible.uid) ?? null
    },
    [slots, freeExos],
  )

  /** Place l'exercice choisi ; renvoie la clé de la ligne remplie (slot ou uid). */
  const placer = useCallback((cible: CiblePlacement, exercise: Exercise): string => {
    let cle: string
    if (cible.kind === 'slot') {
      cle = cible.slot
      setSlots((prev) => {
        const prevDraft = prev[cible.slot]
        return {
          ...prev,
          [cible.slot]: {
            ...(prevDraft ?? makeDraft(exercise, cible.slot)),
            exercise_id: exercise.id,
            exercise,
            slot_type: cible.slot,
          },
        }
      })
    } else if (cible.kind === 'free-add') {
      const draft = makeDraft(exercise, null)
      cle = draft.uid
      setFreeExos((prev) => [...prev, draft])
    } else {
      cle = cible.uid
      setFreeExos((prev) => prev.map((d) => (d.uid === cible.uid ? { ...d, exercise_id: exercise.id, exercise } : d)))
    }
    setBlockError('')
    return cle
  }, [])

  /** Ajoute un exercice libre après les emplacements ; renvoie son uid. */
  const ajouterLibre = useCallback((exercise: Exercise) => placer({ kind: 'free-add' }, exercise), [placer])

  /** Règle séries / réps / repos (bornés comme sur la planche F5). */
  const regler = useCallback((cible: CibleExercice, r: Reglage) => {
    const patch: Partial<DraftExercise> = {}
    if (r.sets != null) patch.sets = clamp(r.sets, BORNES.sets.min, BORNES.sets.max)
    if (r.reps != null) patch.reps = String(clamp(r.reps, BORNES.reps.min, BORNES.reps.max))
    if (r.rest_seconds != null) patch.rest_seconds = clamp(r.rest_seconds, BORNES.rest_seconds.min, BORNES.rest_seconds.max)
    if (cible.kind === 'slot') {
      setSlots((prev) => {
        const current = prev[cible.slot]
        return current ? { ...prev, [cible.slot]: { ...current, ...patch } } : prev
      })
    } else {
      setFreeExos((prev) => prev.map((d) => (d.uid === cible.uid ? { ...d, ...patch } : d)))
    }
  }, [])

  /** Retire l'exercice (l'emplacement redevient vide ; un exercice libre disparaît). */
  const retirer = useCallback((cible: CibleExercice) => {
    if (cible.kind === 'slot') setSlots((p) => ({ ...p, [cible.slot]: null }))
    else setFreeExos((p) => p.filter((d) => d.uid !== cible.uid))
  }, [])

  /** Nouvel ordre des exercices libres (ex. glisser-déposer : Reorder de framer-motion). */
  const reordonnerLibres = useCallback((liste: DraftExercise[]) => setFreeExos(liste), [])

  /** Décale un exercice libre d'un cran (-1 = vers le haut, +1 = vers le bas). */
  const deplacerLibre = useCallback((uid: string, delta: -1 | 1) => {
    setFreeExos((prev) => {
      const i = prev.findIndex((d) => d.uid === uid)
      const j = i + delta
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = prev.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [])

  /** Message court en haut de l'écran (3,5 s). */
  const montrerToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3500)
  }, [])

  async function enregistrer() {
    if (!name.trim()) {
      setBlockError('Donne un nom à ta séance')
      return
    }
    if (totalExos === 0) {
      setBlockError('Ajoute au moins un exercice')
      return
    }
    try {
      setSaving(true)
      setBlockError('')

      // Aucune image choisie → repli par catégorie (temporaire, cf. brief).
      const finalImageUrl = imageUrl ?? CATEGORY_FALLBACK_IMAGE[category]

      let targetWorkoutId = workoutId as string
      let createdNew = false
      if (isEdit) {
        await updateUserWorkout(targetWorkoutId, {
          name: name.trim(),
          category,
          image_url: finalImageUrl,
        })
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const workout = await createUserWorkout({
          user_id: user.id,
          name: name.trim(),
          category,
          image_url: finalImageUrl,
        })
        targetWorkoutId = workout.id
        createdNew = true
      }

      await replaceWorkoutExercises(targetWorkoutId, ordered)

      // Nouvelle séance dans un programme → créer le lien (table de liaison).
      // Séance orpheline (pas de programId) → aucun lien, elle vit seule.
      if (createdNew && programId) {
        await addProgramItem(programId, { source: 'user', refId: targetWorkoutId })
      }

      const emptySlots = SLOT_ORDER.length - filledSlots
      if (emptySlots > 0) {
        setToast(
          `Ta séance pourrait être plus équilibrée — tu as laissé ${emptySlots} slot${emptySlots > 1 ? 's' : ''} vide${emptySlots > 1 ? 's' : ''}`,
        )
        navTimerRef.current = setTimeout(() => onSaved(), 1600)
      } else {
        onSaved()
      }
    } catch (err) {
      console.error(err)
      setBlockError("Échec de l'enregistrement. Réessaie.")
      setSaving(false)
    }
  }

  return {
    isEdit,
    // état
    name, category, imageUrl, slots, freeExos, catalog, loading, saving, blockError, toast,
    filledSlots, totalExos, ordered,
    // champs
    setName, setCategory, setImageUrl, clearError,
    // exercices
    draftDe, placer, ajouterLibre, regler, retirer, reordonnerLibres, deplacerLibre,
    // divers
    montrerToast, enregistrer,
  }
}

export type EditeurSeance = ReturnType<typeof useEditeurSeance>
