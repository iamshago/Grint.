import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import ExercisePickerSheet, { TENSION_SHORT } from '@/components/features/ExercisePickerSheet'
import ImagePickerSheet from '@/components/features/ImagePickerSheet'
import HeroSeance from './HeroSeance'
import LigneEmplacement from './LigneEmplacement'
import { IconeCoche, IconeHaltere, IconeImagePlus, IconeRetour } from './icones'
import { SLOT_ORDER, SLOT_LABELS } from '@/types'
import type { Exercise, SlotType, WorkoutCategory } from '@/types'
import './creer-seance.css'

// Le rose (BBL) est réservé à la séance « BBL » du catalogue (easter egg) :
// l'utilisateur ne peut pas créer une séance rose, seulement haut / bas du corps.
const CATEGORY_OPTIONS: { value: WorkoutCategory; label: string }[] = [
  { value: 'upper', label: 'Haut du corps' },
  { value: 'lower', label: 'Bas du corps' },
]

function makeDraft(exercise: Exercise, slot: SlotType | null): DraftExercise {
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

type PickerTarget =
  | { kind: 'slot'; slot: SlotType }
  | { kind: 'free-add' }
  | { kind: 'free-replace'; index: number }

type SlotMap = Record<SlotType, DraftExercise | null>
const EMPTY_SLOTS: SlotMap = {
  contraction: null,
  stretch: null,
  unilateral: null,
  isolation: null,
}

const SERIF = "'PT Serif', Georgia, serif"
const sousTitre = (d: DraftExercise) => `${d.sets} séries • ${d.reps} réps`

interface WorkoutEditorProps {
  /** Programme parent (la nouvelle séance y est liée). Absent = séance orpheline. */
  programId?: string
  /** Séance à modifier. Absent = nouvelle séance. */
  workoutId?: string
  /**
   * Dans la feuille qui monte de « Programmer » (planche F1) : la page est décalée de 46 px
   * sous le bord de la feuille, comme sur la planche, et se ferme par la poignée (pas de retour).
   */
  embedded?: boolean
  /** Quitter sans enregistrer (retour, ou séance introuvable). */
  onExit: () => void
  /** Après l'enregistrement. */
  onSaved: () => void
}

/**
 * Création / édition d'une séance perso — planches F3 (vide) et F4 (remplie) du canevas :
 * on crée la séance dans la page qu'elle deviendra (aperçu d'une séance). 4 emplacements
 * guides ; chacun ouvre la feuille d'exercices, le type de l'emplacement en premier.
 */
export default function WorkoutEditor({ programId, workoutId, embedded = false, onExit, onSaved }: WorkoutEditorProps) {
  const isEdit = Boolean(workoutId)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<WorkoutCategory>('upper')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [slots, setSlots] = useState<SlotMap>(EMPTY_SLOTS)
  const [freeExos, setFreeExos] = useState<DraftExercise[]>([])
  const [catalog, setCatalog] = useState<Exercise[]>([])

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [blockError, setBlockError] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const [picker, setPicker] = useState<PickerTarget | null>(null)
  // Dernier exercice placé : sa ligne rejoue l'entrée « pop ».
  const [dernier, setDernier] = useState<{ cle: string; tick: number } | null>(null)

  const accent = CATEGORY_ACCENT[category] || '#ffee8c'
  // Jaune de la charte (boutons, icône) — rose pour une séance BBL (easter egg).
  const jaune = category === 'bbl' ? CATEGORY_ACCENT.bbl : '#ffee8c'

  // Timer de sortie différée après le toast soft — annulé si on démonte avant.
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const placeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current)
    if (placeTimerRef.current) clearTimeout(placeTimerRef.current)
  }, [])

  // Catalogue
  useEffect(() => {
    fetchExerciseCatalog()
      .then(setCatalog)
      .catch((e) => console.error(e))
  }, [])

  // Chargement (édition)
  useEffect(() => {
    if (!isEdit) return
    let active = true
    async function load() {
      try {
        const workout = await fetchUserWorkout(workoutId as string)
        if (!workout) return onExit()
        if (!active) return
        setName(workout.name)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, workoutId, programId])

  const filledSlots = useMemo(
    () => SLOT_ORDER.filter((s) => slots[s]).length,
    [slots],
  )
  const totalExos = filledSlots + freeExos.length

  /** Place l'exercice choisi ; renvoie la clé de la ligne remplie. */
  function handleSelect(target: PickerTarget, exercise: Exercise): string {
    let cle: string
    if (target.kind === 'slot') {
      cle = target.slot
      setSlots((prev) => {
        const prevDraft = prev[target.slot]
        return {
          ...prev,
          [target.slot]: {
            ...(prevDraft ?? makeDraft(exercise, target.slot)),
            exercise_id: exercise.id,
            exercise,
            slot_type: target.slot,
          },
        }
      })
    } else if (target.kind === 'free-add') {
      const draft = makeDraft(exercise, null)
      cle = draft.uid
      setFreeExos((prev) => [...prev, draft])
    } else {
      const idx = target.index
      cle = freeExos[idx]?.uid ?? String(idx)
      setFreeExos((prev) =>
        prev.map((d, i) =>
          i === idx ? { ...d, exercise_id: exercise.id, exercise } : d,
        ),
      )
    }
    if (blockError) setBlockError('')
    return cle
  }

  async function handleSave() {
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

      const ordered: DraftExercise[] = [
        ...SLOT_ORDER.filter((s) => slots[s]).map((s) => ({
          ...(slots[s] as DraftExercise),
          slot_type: s,
        })),
        ...freeExos.map((d) => ({ ...d, slot_type: null })),
      ]

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

  // La feuille garde son titre et son tri pendant qu'elle redescend.
  const pickerVu = useRef<PickerTarget | null>(null)
  if (picker) pickerVu.current = picker
  const feuille = picker ?? pickerVu.current
  const pickerTitle =
    feuille?.kind === 'slot' ? `Exercice — ${SLOT_LABELS[feuille.slot]}` : 'Ajouter un exercice'

  // Comme la planche : l'exercice se place dans sa ligne pendant que la feuille redescend.
  function choisirExercice(exercise: Exercise) {
    const cible = picker
    if (!cible) return
    placeTimerRef.current = setTimeout(() => {
      const cle = handleSelect(cible, exercise)
      setDernier((d) => ({ cle, tick: (d?.tick ?? 0) + 1 }))
    }, 220)
  }

  // Lignes : les 4 emplacements guides, puis les exercices libres d'une séance existante.
  let numero = 0
  const lignes = [
    ...SLOT_ORDER.map((slot) => {
      const draft = slots[slot]
      if (draft) numero += 1
      return {
        cle: slot,
        numero: draft ? numero : undefined,
        titre: draft ? draft.exercise?.name ?? 'Exercice' : TENSION_SHORT[slot],
        sous: draft ? sousTitre(draft) : 'Recommandé',
        slot: draft ? TENSION_SHORT[slot] : undefined,
        ouvrir: () => setPicker({ kind: 'slot', slot }),
      }
    }),
    ...freeExos.map((draft, index) => {
      numero += 1
      return {
        cle: draft.uid,
        numero,
        titre: draft.exercise?.name ?? 'Exercice',
        sous: sousTitre(draft),
        slot: undefined,
        ouvrir: () => setPicker({ kind: 'free-replace', index } as PickerTarget),
      }
    }),
  ]

  // Racine : page plein écran, ou dans la feuille de Programmer décalée de 46 px vers le haut (F1).
  const racine: CSSProperties = embedded
    ? { position: 'absolute', left: 0, right: 0, top: -46, bottom: 0, zIndex: 0 }
    : { position: 'fixed', inset: 0, zIndex: 60 }
  const hautBoutons = embedded ? 54 : 'calc(env(safe-area-inset-top, 0px) + 8px)'
  const boutonRond: CSSProperties = { boxSizing: 'border-box', position: 'absolute', top: hautBoutons, zIndex: 110, margin: 0, border: 0, padding: 12, background: '#ffffff', borderRadius: 24, color: '#1b1d1f' }

  return (
    <div style={{ ...racine, overflow: 'hidden', background: '#f1f4fb', fontFamily: 'Figtree, Inter, system-ui, sans-serif', lineHeight: 1.5, color: '#1b1d1f' }}>
      {/* Toast soft (non bloquant) */}
      {toast && (
        <div className="fixed toast-top-safe left-0 right-0 z-[300] flex justify-center px-4 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border border-[#3d4149] bg-[#1c1c1e]/95 backdrop-blur-md max-w-[360px]">
            <span className="text-sm font-semibold text-bg-1 text-center">{toast}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 308, background: '#e3e7ef' }} />
      ) : (
        <HeroSeance image={imageUrl} onOuvrir={() => setImagePickerOpen(true)} couleur={jaune} />
      )}

      {!embedded && (
        <button type="button" onClick={onExit} aria-label="Retour" className="f3-touche" style={{ ...boutonRond, left: 16 }}>
          <IconeRetour taille={16} />
        </button>
      )}
      {imageUrl && !loading && (
        <button type="button" className="f3-touche" onClick={() => setImagePickerOpen(true)} aria-label="Changer l'image" style={{ ...boutonRond, right: 16 }}>
          <IconeImagePlus taille={16} />
        </button>
      )}

      <div className="f3-defile" style={{ position: 'absolute', inset: 0, overflowY: 'auto', pointerEvents: 'none' }}>
        <div style={{ height: 258, flexShrink: 0 }} />
        <div style={{ boxSizing: 'border-box', position: 'relative', minHeight: 'calc(100% - 258px)', background: '#f1f4fb', borderRadius: '24px 24px 0 0', boxShadow: '0px 0px 13px 0px rgba(0,0,0,0.1)', padding: '12px 16px 120px', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 40, height: 4, borderRadius: 9999, background: '#dde0e7' }} />
          </div>
          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }} role="group" aria-label="Catégorie de la séance">
                    {CATEGORY_OPTIONS.map((opt) => {
                      const actif = category === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className="f3-touche"
                          onClick={() => setCategory(opt.value)}
                          aria-pressed={actif}
                          style={{ boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 8, border: `1px solid ${actif ? '#1b1d1f' : '#3d4149'}`, background: actif ? '#1b1d1f' : '#dde0e7', fontFamily: 'inherit' }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', textTransform: 'uppercase', color: actif ? CATEGORY_ACCENT[opt.value] : '#3d4149' }}>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  <label htmlFor="nomSeance" style={{ display: 'block' }}>
                    <input
                      id="nomSeance"
                      className="f3-nom"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (blockError) setBlockError('')
                      }}
                      placeholder="Nom de la séance"
                      aria-label="Nom de la séance"
                      style={{ boxSizing: 'border-box', width: '100%', margin: 0, padding: 0, border: 0, background: 'transparent', fontFamily: SERIF, fontWeight: 700, fontSize: 32, lineHeight: '48px', letterSpacing: '-0.96px', color: '#1b1d1f', caretColor: '#1b1d1f' }}
                    />
                  </label>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: '24px', color: '#1b1d1f' }}>Prépare-toi à tout donner sur cette séance.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ boxSizing: 'border-box', width: 32, height: 32, borderRadius: 24, background: '#1b1d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                      <IconeHaltere taille={16} trait={jaune} style={{ flexShrink: 0 }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#989da6' }}>EXERCICES</p>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#1b1d1f' }}>{totalExos}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ boxSizing: 'border-box', width: 32, height: 32, borderRadius: 24, background: '#1b1d1f', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 3, padding: 8 }}>
                      {SLOT_ORDER.map((s) => (
                        <i key={s} style={{ borderRadius: '50%', background: slots[s] ? accent : '#3d4149' }} />
                      ))}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#989da6' }}>STRUCTURE</p>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#1b1d1f' }}>{filledSlots} / 4</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ margin: 0, fontFamily: SERIF, fontWeight: 700, fontSize: 24, lineHeight: '32px', letterSpacing: '-0.72px', color: '#1b1d1f' }}>Exercices</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lignes.map((l) => {
                    const pop = dernier?.cle === l.cle
                    return (
                      <LigneEmplacement
                        key={pop ? `${l.cle}-${dernier.tick}` : l.cle}
                        numero={l.numero}
                        titre={l.titre}
                        sous={l.sous}
                        slot={l.slot}
                        pop={pop}
                        onClick={l.ouvrir}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!loading && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 110, pointerEvents: 'none', backgroundImage: 'linear-gradient(to bottom, rgba(241,244,251,0) 0%, #f1f4fb 32%)' }}>
          <div style={{ boxSizing: 'border-box', padding: '32px 24px 0', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', pointerEvents: 'auto' }}>
            {blockError && (
              <p role="alert" style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 14, lineHeight: '20px', color: '#e62d2d' }}>{blockError}</p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ boxSizing: 'border-box', width: '100%', margin: 0, border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, borderRadius: 12, background: '#1b1d1f', color: jaune, boxShadow: '0px 0px 40px 0px rgba(31,32,33,0.4)', fontFamily: 'Figtree, Inter, system-ui, sans-serif', fontWeight: 600, fontSize: 16, lineHeight: '24px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              <IconeCoche taille={16} epaisseur={2.5} />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer la séance'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Feuille d'images : celle de l'app, avec « Ta photo » en premier */}
      <ImagePickerSheet
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        category={category}
        onSelect={setImageUrl}
      />

      {/* Feuille d'exercices : ouverte par chaque emplacement, son type en premier */}
      <ExercisePickerSheet
        open={Boolean(picker)}
        onClose={() => setPicker(null)}
        catalog={catalog}
        onSelect={choisirExercice}
        title={pickerTitle}
        slot={feuille?.kind === 'slot' ? feuille.slot : undefined}
      />
    </div>
  )
}
