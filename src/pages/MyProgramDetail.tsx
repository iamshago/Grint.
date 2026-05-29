import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Reorder, useDragControls } from 'framer-motion'
import { Plus, GripVertical, ChevronRight, X, Dumbbell } from 'lucide-react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import {
  addProgramItem,
  fetchUserProgram,
  removeProgramItem,
  reorderProgramItems,
  softDeleteUserProgram,
  type ProgramItem,
} from '@/lib/myPrograms'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import DarkLayout from '@/components/layout/DarkLayout'
import StickyPageHeader from '@/components/layout/StickyPageHeader'
import ActionSheet from '@/components/ui/ActionSheet'
import Button from '@/components/ui/Button'
import SeancePicker from '@/components/features/SeancePicker'
import type { UserProgram } from '@/types'

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

/** Détail d'un programme perso — séances liées (catalogue + perso), réordonnables, planification. */
export default function MyProgramDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [program, setProgram] = useState<UserProgram | null>(null)
  const [items, setItems] = useState<ProgramItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [programMenu, setProgramMenu] = useState(false)
  const [confirmDeleteProgram, setConfirmDeleteProgram] = useState(false)

  const [addChoice, setAddChoice] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [actionItem, setActionItem] = useState<ProgramItem | null>(null)
  const [planItem, setPlanItem] = useState<ProgramItem | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<ProgramItem | null>(null)

  const orderRef = useRef<ProgramItem[]>([])
  orderRef.current = items

  const handleReorder = useCallback((next: ProgramItem[]) => {
    orderRef.current = next
    setItems(next)
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      const data = await fetchUserProgram(id as string)
      if (!data) return navigate('/my-programs', { replace: true })
      setProgram(data)
      setItems(data.items)
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
    reorderProgramItems(orderRef.current.map((it) => it.linkId)).catch((e) => console.error(e))
  }, [])

  async function handleDeleteProgram() {
    setConfirmDeleteProgram(false)
    await softDeleteUserProgram(id as string)
    navigate('/my-programs', { replace: true })
  }

  async function handleAddExisting(ref: { source: 'catalog' | 'user'; id: string }) {
    try {
      await addProgramItem(id as string, { source: ref.source, refId: ref.id })
      await load()
    } catch (e) {
      console.error(e)
    }
  }

  async function handleRemove(item: ProgramItem) {
    setConfirmRemove(null)
    try {
      await removeProgramItem(item.linkId)
      setItems((prev) => prev.filter((it) => it.linkId !== item.linkId))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <DarkLayout noSafeAreaTop hideTabBar className="pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
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
          onClick={() => setAddChoice(true)}
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
        ) : items.length === 0 ? null : (
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={handleReorder}
            className="flex flex-col gap-3 list-none"
          >
            {items.map((item) => (
              <ItemRow
                key={item.linkId}
                item={item}
                onCommit={commitOrder}
                onOpen={() => setActionItem(item)}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Choix : séance existante ou nouvelle */}
      <ActionSheet
        open={addChoice}
        onClose={() => setAddChoice(false)}
        ariaLabel="Ajouter une séance"
        actions={[
          {
            label: 'Choisir une séance existante',
            onClick: () => {
              setAddChoice(false)
              setShowPicker(true)
            },
          },
          {
            label: 'Créer une nouvelle séance',
            onClick: () => {
              setAddChoice(false)
              navigate(`/my-programs/${id}/workouts/new`)
            },
          },
          { label: 'Annuler', variant: 'cancel', onClick: () => setAddChoice(false) },
        ]}
      />

      {/* Sélecteur de séance existante */}
      {userId && (
        <SeancePicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          userId={userId}
          onSelect={handleAddExisting}
        />
      )}

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
        open={Boolean(actionItem)}
        onClose={() => setActionItem(null)}
        ariaLabel="Actions de la séance"
        actions={[
          ...(actionItem?.editable
            ? [
                {
                  label: 'Modifier la séance',
                  onClick: () => {
                    const it = actionItem
                    setActionItem(null)
                    if (it) navigate(`/my-programs/${id}/workouts/${it.refId}/edit`)
                  },
                },
              ]
            : []),
          {
            label: 'Planifier dans la semaine',
            onClick: () => {
              setPlanItem(actionItem)
              setActionItem(null)
            },
          },
          {
            label: 'Retirer du programme',
            variant: 'destructive',
            onClick: () => {
              setConfirmRemove(actionItem)
              setActionItem(null)
            },
          },
          { label: 'Annuler', variant: 'cancel', onClick: () => setActionItem(null) },
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
              Les séances perso restent disponibles dans tes autres programmes.
            </p>
          </div>
        }
        actions={[
          { label: 'Supprimer', onClick: handleDeleteProgram, variant: 'destructive' },
          { label: 'Annuler', onClick: () => setConfirmDeleteProgram(false), variant: 'cancel' },
        ]}
      />

      {/* Confirmation retrait séance */}
      <ActionSheet
        open={Boolean(confirmRemove)}
        onClose={() => setConfirmRemove(null)}
        ariaLabel="Confirmer le retrait de la séance"
        header={
          <div className="text-center pb-2">
            <p className="font-serif font-bold text-lg text-tx-1">Retirer cette séance ?</p>
            <p className="font-sans text-sm text-tx-3 mt-1">
              Elle est juste retirée de ce programme, pas supprimée.
            </p>
          </div>
        }
        actions={[
          {
            label: 'Retirer',
            variant: 'destructive',
            onClick: () => confirmRemove && handleRemove(confirmRemove),
          },
          { label: 'Annuler', variant: 'cancel', onClick: () => setConfirmRemove(null) },
        ]}
      />

      {/* Modale de planification */}
      {planItem && userId && (
        <PlanModal item={planItem} userId={userId} onClose={() => setPlanItem(null)} />
      )}
    </DarkLayout>
  )
}

/** Ligne séance réordonnable (catalogue ou perso). */
function ItemRow({
  item,
  onCommit,
  onOpen,
}: {
  item: ProgramItem
  onCommit: () => void
  onOpen: () => void
}) {
  const controls = useDragControls()
  const accent = CATEGORY_ACCENT[item.category] || '#ffee8c'

  return (
    <Reorder.Item
      value={item}
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
        aria-label={`Actions pour ${item.name}`}
        className="flex-1 min-w-0 flex items-center gap-3 py-3 pr-4 text-left cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-semibold text-base text-bg-1 truncate">{item.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold uppercase"
              style={{ backgroundColor: `${accent}40`, color: accent }}
            >
              {CATEGORY_LABEL[item.category]}
            </span>
            <span className="font-sans text-[11px] text-tx-3">
              {item.source === 'catalog' ? 'Catalogue' : 'Perso'}
            </span>
            <span className="flex items-center gap-1 font-sans text-xs text-tx-3">
              <Dumbbell size={12} />
              {item.exerciseCount} exo{item.exerciseCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-tx-3 shrink-0" />
      </button>
    </Reorder.Item>
  )
}

/** Modale de sélection de jours pour planifier une séance (catalogue ou perso). */
function PlanModal({
  item,
  userId,
  onClose,
}: {
  item: ProgramItem
  userId: string
  onClose: () => void
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSave() {
    if (selectedDays.length === 0) return
    try {
      setSaving(true)
      const rows = selectedDays.map((d) => ({
        user_id: userId,
        day_of_week: d,
        source: item.source,
        workout_id: item.source === 'catalog' ? item.refId : null,
        user_workout_id: item.source === 'user' ? item.refId : null,
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
          <span className="font-bold text-tx-1">{item.name}</span> :
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
          {done ? 'Planifiée !' : saving ? 'Enregistrement...' : `Valider (${selectedDays.length})`}
        </Button>
      </div>
    </div>,
    document.body,
  )
}
