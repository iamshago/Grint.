import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Reorder, useDragControls } from 'framer-motion'
import { Plus, GripVertical, ChevronRight, X, Dumbbell } from 'lucide-react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import {
  fetchUserProgram,
  reorderUserWorkouts,
  softDeleteUserProgram,
  softDeleteUserWorkout,
} from '@/lib/myPrograms'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import DarkLayout from '@/components/layout/DarkLayout'
import StickyPageHeader from '@/components/layout/StickyPageHeader'
import ActionSheet from '@/components/ui/ActionSheet'
import Button from '@/components/ui/Button'
import type { UserProgram, UserWorkout } from '@/types'

const CATEGORY_LABEL: Record<string, string> = {
  upper: 'Haut du corps',
  lower: 'Bas du corps',
  bbl: 'BBL',
}

const WEEKDAYS = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 0 },
]

/** Détail d'un programme perso — liste des séances (réordonnables), planification. */
export default function MyProgramDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [program, setProgram] = useState<UserProgram | null>(null)
  const [workouts, setWorkouts] = useState<UserWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [programMenu, setProgramMenu] = useState(false)
  const [confirmDeleteProgram, setConfirmDeleteProgram] = useState(false)

  // Séance ciblée par l'action sheet / la modale de planification
  const [actionWorkout, setActionWorkout] = useState<UserWorkout | null>(null)
  const [planWorkout, setPlanWorkout] = useState<UserWorkout | null>(null)
  const [confirmDeleteWorkout, setConfirmDeleteWorkout] = useState<UserWorkout | null>(null)

  const orderRef = useRef<UserWorkout[]>([])
  orderRef.current = workouts

  // Met à jour la ref de façon synchrone pour que commitOrder (onDragEnd) lise
  // toujours le dernier ordre, sans dépendre du flush de setWorkouts.
  const handleReorder = useCallback((next: UserWorkout[]) => {
    orderRef.current = next
    setWorkouts(next)
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchUserProgram(id as string)
      if (!data) return navigate('/my-programs', { replace: true })
      setProgram(data)
      setWorkouts(data.user_workouts ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  const commitOrder = useCallback(() => {
    reorderUserWorkouts(orderRef.current.map((w) => w.id)).catch((e) => console.error(e))
  }, [])

  async function handleDeleteProgram() {
    setConfirmDeleteProgram(false)
    await softDeleteUserProgram(id as string)
    navigate('/my-programs', { replace: true })
  }

  async function handleDeleteWorkout(workout: UserWorkout) {
    setConfirmDeleteWorkout(null)
    await softDeleteUserWorkout(workout.id)
    setWorkouts((prev) => prev.filter((w) => w.id !== workout.id))
  }

  return (
    <DarkLayout noSafeAreaTop className="pb-tabbar">
      <StickyPageHeader
        variant="dark"
        title={program?.name ?? 'Mon programme'}
        subtitle={program?.focus ?? undefined}
        onBack={() => navigate('/my-programs')}
        onMenu={() => setProgramMenu(true)}
      />

      <div className="px-4 pt-2 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate(`/my-programs/${id}/workouts/new`)}
          className="w-full flex items-center justify-center gap-3 bg-pr-1 text-tx-1 font-sans font-semibold text-base p-4 rounded-12 cursor-pointer active:scale-[0.98] transition-transform shadow-[0px_0px_20px_0px_rgba(255,238,140,0.3)]"
        >
          <Plus size={18} />
          <span>Ajouter une séance</span>
        </button>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-[72px] bg-[#1c1c1e] rounded-16 animate-pulse" />
            ))}
          </div>
        ) : workouts.length === 0 ? null : (
          <Reorder.Group
            axis="y"
            values={workouts}
            onReorder={handleReorder}
            className="flex flex-col gap-3 list-none"
          >
            {workouts.map((workout) => (
              <WorkoutReorderRow
                key={workout.id}
                workout={workout}
                onCommit={commitOrder}
                onOpen={() => setActionWorkout(workout)}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Menu programme */}
      <ActionSheet
        open={programMenu}
        onClose={() => setProgramMenu(false)}
        ariaLabel="Actions du programme"
        actions={[
          {
            label: 'Modifier le programme',
            onClick: () => {
              setProgramMenu(false)
              navigate(`/my-programs/${id}/edit`)
            },
          },
          {
            label: 'Supprimer le programme',
            variant: 'destructive',
            onClick: () => {
              setProgramMenu(false)
              setConfirmDeleteProgram(true)
            },
          },
          { label: 'Annuler', variant: 'cancel', onClick: () => setProgramMenu(false) },
        ]}
      />

      {/* Actions d'une séance */}
      <ActionSheet
        open={Boolean(actionWorkout)}
        onClose={() => setActionWorkout(null)}
        ariaLabel="Actions de la séance"
        actions={[
          {
            label: 'Modifier la séance',
            onClick: () => {
              const w = actionWorkout
              setActionWorkout(null)
              if (w) navigate(`/my-programs/${id}/workouts/${w.id}/edit`)
            },
          },
          {
            label: 'Planifier dans la semaine',
            onClick: () => {
              setPlanWorkout(actionWorkout)
              setActionWorkout(null)
            },
          },
          {
            label: 'Supprimer la séance',
            variant: 'destructive',
            onClick: () => {
              setConfirmDeleteWorkout(actionWorkout)
              setActionWorkout(null)
            },
          },
          { label: 'Annuler', variant: 'cancel', onClick: () => setActionWorkout(null) },
        ]}
      />

      {/* Confirmation suppression programme */}
      <ActionSheet
        open={confirmDeleteProgram}
        onClose={() => setConfirmDeleteProgram(false)}
        ariaLabel="Confirmer la suppression du programme"
        header={
          <div className="text-center pb-2">
            <p className="font-serif font-bold text-lg text-tx-1">Supprimer ce programme ?</p>
            <p className="font-sans text-sm text-tx-3 mt-1">
              Les séances de ce programme seront aussi supprimées.
            </p>
          </div>
        }
        actions={[
          { label: 'Supprimer', onClick: handleDeleteProgram, variant: 'destructive' },
          { label: 'Annuler', onClick: () => setConfirmDeleteProgram(false), variant: 'cancel' },
        ]}
      />

      {/* Confirmation suppression séance */}
      <ActionSheet
        open={Boolean(confirmDeleteWorkout)}
        onClose={() => setConfirmDeleteWorkout(null)}
        ariaLabel="Confirmer la suppression de la séance"
        header={
          <div className="text-center pb-2">
            <p className="font-serif font-bold text-lg text-tx-1">Supprimer cette séance ?</p>
          </div>
        }
        actions={[
          {
            label: 'Supprimer',
            variant: 'destructive',
            onClick: () => confirmDeleteWorkout && handleDeleteWorkout(confirmDeleteWorkout),
          },
          { label: 'Annuler', variant: 'cancel', onClick: () => setConfirmDeleteWorkout(null) },
        ]}
      />

      {/* Modale de planification */}
      {planWorkout && (
        <PlanModal workout={planWorkout} onClose={() => setPlanWorkout(null)} />
      )}
    </DarkLayout>
  )
}

/** Ligne séance réordonnable par drag handle (framer-motion Reorder). */
function WorkoutReorderRow({
  workout,
  onCommit,
  onOpen,
}: {
  workout: UserWorkout
  onCommit: () => void
  onOpen: () => void
}) {
  const controls = useDragControls()
  const accent = CATEGORY_ACCENT[workout.category] || '#ffee8c'
  const exoCount = workout.user_workout_exercises?.length ?? 0

  return (
    <Reorder.Item
      value={workout}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onCommit}
      className="bg-tx-1 rounded-16 flex items-center"
    >
      <button
        type="button"
        aria-label="Réordonner la séance"
        onPointerDown={(e) => controls.start(e)}
        className="pl-3 pr-1 py-5 cursor-grab active:cursor-grabbing touch-none text-tx-3"
      >
        <GripVertical size={18} />
      </button>

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Actions pour ${workout.name}`}
        className="flex-1 min-w-0 flex items-center gap-3 py-3 pr-4 text-left cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-semibold text-base text-bg-1 truncate">
            {workout.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold uppercase"
              style={{ backgroundColor: `${accent}40`, color: accent }}
            >
              {CATEGORY_LABEL[workout.category]}
            </span>
            <span className="flex items-center gap-1 font-sans text-xs text-tx-3">
              <Dumbbell size={12} />
              {exoCount} exo{exoCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-tx-3 shrink-0" />
      </button>
    </Reorder.Item>
  )
}

/** Modale de sélection de jours pour planifier une séance perso. */
function PlanModal({ workout, onClose }: { workout: UserWorkout; onClose: () => void }) {
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSave() {
    if (selectedDays.length === 0) return
    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const rows = selectedDays.map((d) => ({
        user_id: user.id,
        day_of_week: d,
        source: 'user' as const,
        user_workout_id: workout.id,
        workout_id: null,
      }))
      const { error } = await supabase
        .from('workout_plan')
        .upsert(rows, { onConflict: 'user_id, day_of_week' })
      if (error) throw error
      setDone(true)
      setTimeout(onClose, 900)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-16 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif font-bold text-xl text-tx-1">Planifier</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="bg-surface rounded-full p-2 active:scale-95 transition-transform"
          >
            <X size={18} className="text-tx-1" />
          </button>
        </div>
        <p className="font-sans text-sm text-tx-3 mb-4">
          Sélectionne un ou plusieurs jours pour{' '}
          <span className="font-bold text-tx-1">{workout.name}</span> :
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {WEEKDAYS.map((day) => {
            const isSelected = selectedDays.includes(day.value)
            return (
              <button
                key={day.value}
                type="button"
                onClick={() =>
                  setSelectedDays((prev) =>
                    isSelected ? prev.filter((d) => d !== day.value) : [...prev, day.value],
                  )
                }
                className={`py-3 rounded-12 text-xs font-sans font-bold uppercase transition-colors cursor-pointer ${
                  isSelected ? 'bg-tx-1 text-pr-1' : 'bg-surface text-tx-2'
                } ${day.label === 'Dimanche' ? 'col-span-2' : ''}`}
              >
                {day.label}
              </button>
            )
          })}
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSave}
          disabled={saving || selectedDays.length === 0}
        >
          {done
            ? 'Planifiée !'
            : saving
              ? 'Enregistrement...'
              : `Valider (${selectedDays.length})`}
        </Button>
      </div>
    </div>,
    document.body,
  )
}
