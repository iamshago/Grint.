import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Reorder, useDragControls } from 'framer-motion'
import { Plus, GripVertical, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import {
  addProgramItem,
  countProgramsUsingUserWorkout,
  createUserWorkout,
  fetchUserWorkout,
  replaceWorkoutExercises,
  updateUserWorkout,
  fetchExerciseCatalog,
  type DraftExercise,
} from '@/lib/myPrograms'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import DarkLayout from '@/components/layout/DarkLayout'
import StickyPageHeader from '@/components/layout/StickyPageHeader'
import EditableExerciseRow from '@/components/features/EditableExerciseRow'
import ExercisePickerSheet from '@/components/features/ExercisePickerSheet'
import { SLOT_ORDER, SLOT_LABELS } from '@/types'
import type { Exercise, SlotType, WorkoutCategory } from '@/types'

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

/** Création / édition d'une séance perso — 4 slots guides + exos libres. Route light. */
export default function MyWorkoutEdit() {
  const navigate = useNavigate()
  const { id: programId, workoutId } = useParams()
  const isEdit = Boolean(workoutId)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<WorkoutCategory>('upper')
  const [slots, setSlots] = useState<SlotMap>(EMPTY_SLOTS)
  const [freeExos, setFreeExos] = useState<DraftExercise[]>([])
  const [catalog, setCatalog] = useState<Exercise[]>([])

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [blockError, setBlockError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  // Nombre de programmes qui lient cette séance (édition) → prévient l'effet cascade.
  const [usedInCount, setUsedInCount] = useState(0)

  const [picker, setPicker] = useState<PickerTarget | null>(null)

  const accent = CATEGORY_ACCENT[category] || '#ffee8c'

  // Timer de navigation différée après le toast soft — annulé si on démonte avant.
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current)
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
        if (!workout) return navigate(`/my-programs/${programId}`, { replace: true })
        if (!active) return
        setName(workout.name)
        setCategory(workout.category)
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
        try {
          const n = await countProgramsUsingUserWorkout(workoutId as string)
          if (active) setUsedInCount(n)
        } catch {
          /* compteur non bloquant */
        }
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
  }, [isEdit, workoutId, programId, navigate])

  const filledSlots = useMemo(
    () => SLOT_ORDER.filter((s) => slots[s]).length,
    [slots],
  )
  const totalExos = filledSlots + freeExos.length

  function patchSlot(slot: SlotType, patch: Partial<DraftExercise>) {
    setSlots((prev) => {
      const current = prev[slot]
      if (!current) return prev
      return { ...prev, [slot]: { ...current, ...patch } }
    })
  }

  function patchFree(index: number, patch: Partial<DraftExercise>) {
    setFreeExos((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function handleSelect(exercise: Exercise) {
    if (!picker) return
    if (picker.kind === 'slot') {
      setSlots((prev) => {
        const prevDraft = prev[picker.slot]
        return {
          ...prev,
          [picker.slot]: {
            ...(prevDraft ?? makeDraft(exercise, picker.slot)),
            exercise_id: exercise.id,
            exercise,
            slot_type: picker.slot,
          },
        }
      })
    } else if (picker.kind === 'free-add') {
      setFreeExos((prev) => [...prev, makeDraft(exercise, null)])
    } else {
      const idx = picker.index
      setFreeExos((prev) =>
        prev.map((d, i) =>
          i === idx ? { ...d, exercise_id: exercise.id, exercise } : d,
        ),
      )
    }
    if (blockError) setBlockError('')
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

      let targetWorkoutId = workoutId as string
      let createdNew = false
      if (isEdit) {
        await updateUserWorkout(targetWorkoutId, { name: name.trim(), category })
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const workout = await createUserWorkout({
          user_id: user.id,
          name: name.trim(),
          category,
        })
        targetWorkoutId = workout.id
        createdNew = true
      }

      await replaceWorkoutExercises(targetWorkoutId, ordered)

      // Nouvelle séance → la lier au programme courant (table de liaison).
      if (createdNew) {
        await addProgramItem(programId as string, { source: 'user', refId: targetWorkoutId })
      }

      const emptySlots = SLOT_ORDER.length - filledSlots
      if (emptySlots > 0) {
        setToast(
          `Ta séance pourrait être plus équilibrée — tu as laissé ${emptySlots} slot${emptySlots > 1 ? 's' : ''} vide${emptySlots > 1 ? 's' : ''}`,
        )
        navTimerRef.current = setTimeout(() => navigate(`/my-programs/${programId}`), 1600)
      } else {
        navigate(`/my-programs/${programId}`)
      }
    } catch (err) {
      console.error(err)
      setBlockError("Échec de l'enregistrement. Réessaie.")
      setSaving(false)
    }
  }

  const pickerTitle =
    picker?.kind === 'slot' ? `Exercice — ${SLOT_LABELS[picker.slot]}` : 'Ajouter un exercice'

  return (
    <DarkLayout noSafeAreaTop className="pb-tabbar">
      {/* Toast soft (non bloquant) */}
      {toast && (
        <div className="fixed toast-top-safe left-0 right-0 z-[300] flex justify-center px-4 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border border-[#3d4149] bg-[#1c1c1e]/95 backdrop-blur-md max-w-[360px]">
            <span className="text-sm font-semibold text-bg-1 text-center">{toast}</span>
          </div>
        </div>
      )}

      <StickyPageHeader
        variant="dark"
        title={isEdit ? 'Modifier la séance' : 'Nouvelle séance'}
        onBack={() => navigate(`/my-programs/${programId}`)}
      />

      {loading ? (
        <div className="px-4 flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#1c1c1e] rounded-12 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-6 pb-32">
          {/* Effet cascade : cette séance est liée à plusieurs programmes */}
          {isEdit && usedInCount > 0 && (
            <div
              className="rounded-12 px-4 py-3"
              style={{ backgroundColor: `${accent}1A`, border: `1px solid ${accent}66` }}
            >
              <p className="font-sans text-sm" style={{ color: accent }}>
                Utilisée dans {usedInCount} programme{usedInCount > 1 ? 's' : ''}.
                {usedInCount > 1 && ' Tes modifications s’appliqueront partout.'}
              </p>
            </div>
          )}

          {/* Nom + catégorie */}
          <div className="flex flex-col gap-3">
            <input
              id="workout-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (blockError) setBlockError('')
              }}
              placeholder="Nom de la séance"
              aria-label="Nom de la séance"
              className="w-full bg-tx-1 rounded-12 px-4 py-4 font-serif font-bold text-xl text-bg-1 placeholder-tx-3 placeholder:font-sans placeholder:font-normal placeholder:text-base focus:outline-none focus:ring-2 focus:ring-pr-1/30"
            />
            <div className="flex gap-2" role="group" aria-label="Catégorie de la séance">
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = category === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    aria-pressed={isActive}
                    className="flex-1 py-3 rounded-full font-sans font-semibold text-xs transition-colors cursor-pointer"
                    style={
                      isActive
                        ? { backgroundColor: accent, color: '#1b1d1f' }
                        : { backgroundColor: '#3d4149', color: '#f1f4fb' }
                    }
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Slots recommandés — structure suggérée, pas obligatoire. */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-serif font-bold text-lg text-bg-1 tracking-tight">
                Structure recommandée
              </h2>
              <p className="font-sans text-sm text-tx-3">
                Optionnel — des repères pour équilibrer ta séance. Mets ce que tu veux, ou laisse vide.
              </p>
            </div>
            {SLOT_ORDER.map((slot) => {
              const draft = slots[slot]
              if (draft) {
                return (
                  <EditableExerciseRow
                    key={slot}
                    draft={draft}
                    accent={accent}
                    label={SLOT_LABELS[slot]}
                    recommended
                    onChange={(patch) => patchSlot(slot, patch)}
                    onRemove={() => setSlots((p) => ({ ...p, [slot]: null }))}
                    onReplace={() => setPicker({ kind: 'slot', slot })}
                  />
                )
              }
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setPicker({ kind: 'slot', slot })}
                  className="w-full flex items-center justify-between gap-3 rounded-12 border border-dashed bg-tx-1 px-4 py-4 text-left cursor-pointer active:scale-[0.99] transition-transform"
                  style={{ borderColor: `${accent}80` }}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span
                      className="inline-flex self-start items-center px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: `${accent}40`, color: accent }}
                    >
                      Recommandé
                    </span>
                    <span className="font-sans font-semibold text-base text-bg-1">
                      {SLOT_LABELS[slot]}
                    </span>
                  </div>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accent}40` }}
                  >
                    <Plus size={16} style={{ color: accent }} />
                  </span>
                </button>
              )
            })}
          </div>

          {/* Exos libres */}
          <div className="flex flex-col gap-3">
            <h2 className="font-serif font-bold text-lg text-bg-1 tracking-tight">
              Autres exercices
            </h2>
            {freeExos.length > 0 && (
              <Reorder.Group
                axis="y"
                values={freeExos}
                onReorder={setFreeExos}
                className="flex flex-col gap-3 list-none"
              >
                {freeExos.map((draft, index) => (
                  <FreeExerciseItem
                    key={draft.uid}
                    draft={draft}
                    accent={accent}
                    onChange={(patch) => patchFree(index, patch)}
                    onRemove={() => setFreeExos((p) => p.filter((_, i) => i !== index))}
                    onReplace={() => setPicker({ kind: 'free-replace', index })}
                  />
                ))}
              </Reorder.Group>
            )}
            <button
              type="button"
              onClick={() => setPicker({ kind: 'free-add' })}
              className="w-full flex items-center justify-center gap-2 rounded-12 border-2 border-dashed border-[#3d4149] px-4 py-4 font-sans font-semibold text-sm text-tx-3 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <Plus size={16} />
              Ajouter un exercice
            </button>
          </div>
        </div>
      )}

      {/* CTA bas + message bloquant inline */}
      {!loading && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[110] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(12,12,12,0) 0%, #0c0c0c 36%)',
          }}
        >
          <div className="px-6 pt-8 pointer-events-auto cta-bottom-safe flex flex-col gap-2">
            {blockError && (
              <p className="font-sans text-sm text-[#e62d2d] text-center" role="alert">
                {blockError}
              </p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 font-sans font-semibold text-base p-4 rounded-12 cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-60"
              style={{
                backgroundColor: accent,
                color: '#1b1d1f',
                boxShadow: `0px 0px 20px 0px ${accent}4D`,
              }}
            >
              <Check size={16} />
              {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
            </button>
          </div>
        </div>
      )}

      <ExercisePickerSheet
        open={Boolean(picker)}
        onClose={() => setPicker(null)}
        catalog={catalog}
        onSelect={handleSelect}
        title={pickerTitle}
      />
    </DarkLayout>
  )
}

/** Item d'exo libre réordonnable (drag handle). */
function FreeExerciseItem({
  draft,
  accent,
  onChange,
  onRemove,
  onReplace,
}: {
  draft: DraftExercise
  accent: string
  onChange: (patch: Partial<DraftExercise>) => void
  onRemove: () => void
  onReplace: () => void
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={draft} dragListener={false} dragControls={controls}>
      <EditableExerciseRow
        draft={draft}
        accent={accent}
        onChange={onChange}
        onRemove={onRemove}
        onReplace={onReplace}
        dragHandle={
          <button
            type="button"
            aria-label="Réordonner l'exercice"
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing touch-none text-tx-3 shrink-0 -ml-1"
          >
            <GripVertical size={18} />
          </button>
        }
      />
    </Reorder.Item>
  )
}
