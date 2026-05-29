import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Calendar, Dumbbell, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { fetchUserProgram, fetchUserWorkout, type ProgramItem } from '@/lib/myPrograms'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import StickyPageHeader from '@/components/layout/StickyPageHeader'
import ExerciseRow from '@/components/features/ExerciseRow'
import WorkoutCard from '@/components/features/WorkoutCard'
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

interface PreviewExo {
  name: string
  sets: number
  reps: string
  videoUrl: string | null
}

interface UserProgramPreviewProps {
  programId: string
  onClose: () => void
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

/**
 * Aperçu « consultation » d'un programme perso depuis le carrousel Programmes —
 * miroir du détail catalogue (light) : liste des séances (catalogue + perso) →
 * exos → « Planifier cette séance ». L'exécution se lance depuis l'Accueil.
 */
export default function UserProgramPreview({ programId, onClose, onToast }: UserProgramPreviewProps) {
  const [program, setProgram] = useState<(UserProgram & { items: ProgramItem[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<{ item: ProgramItem; exos: PreviewExo[] } | null>(null)
  const [planItem, setPlanItem] = useState<ProgramItem | null>(null)

  // Verrou du scroll du body tant que la modale est ouverte : sinon la page
  // précédente (le carrousel) reste scrollable/visible derrière en overscroll iOS.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchUserProgram(programId)
      .then((p) => {
        if (!active) return
        setProgram(p)
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [programId])

  async function openItem(item: ProgramItem) {
    try {
      let exos: PreviewExo[] = []
      if (item.source === 'user') {
        const uw = await fetchUserWorkout(item.refId)
        exos = (uw?.user_workout_exercises ?? []).map((e) => ({
          name: e.exercise?.name ?? 'Exercice',
          sets: e.sets,
          reps: e.reps,
          videoUrl: e.exercise?.video_url ?? null,
        }))
      } else {
        const { data } = await supabase
          .from('workouts')
          .select('workout_exercises(sets, reps, order_index, exercise:exercises(name, video_url))')
          .eq('id', item.refId)
          .maybeSingle()
        exos = ((data as any)?.workout_exercises ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((e: any) => ({
            name: e.exercise?.name ?? 'Exercice',
            sets: e.sets,
            reps: e.reps,
            videoUrl: e.exercise?.video_url ?? null,
          }))
      }
      setDetail({ item, exos })
    } catch (e) {
      console.error(e)
      onToast('Impossible de charger la séance.', 'error')
    }
  }

  const items = program?.items ?? []

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-bg-1 flex flex-col">
      <StickyPageHeader
        variant="light"
        title={program?.name ?? 'Mon programme'}
        subtitle={program?.focus ?? undefined}
        onBack={onClose}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar overscroll-none">
        <div
          className="px-4 flex flex-col gap-6"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}
        >
          <div className="flex flex-col gap-3 pt-2">
            <h3 className="font-serif font-bold text-2xl text-tx-1 tracking-[-0.72px]">
              Séances du programme
            </h3>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-[168px] bg-surface rounded-16 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-surface rounded-16 p-10 text-center">
                <p className="font-sans text-tx-3 text-sm">Ce programme n'a pas encore de séance.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((it) => (
                  <WorkoutCard
                    key={it.linkId}
                    title={it.name}
                    category={it.category}
                    exerciseCount={it.exerciseCount}
                    imageUrl={it.imageUrl ?? program?.image_url ?? undefined}
                    onPlay={() => openItem(it)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detail && (
        <WorkoutDetail
          item={detail.item}
          exos={detail.exos}
          coverUrl={detail.item.imageUrl ?? program?.image_url ?? null}
          onToast={onToast}
          onClose={() => setDetail(null)}
          onPlan={() => setPlanItem(detail.item)}
        />
      )}

      {planItem && (
        <PlanModal
          item={planItem}
          onClose={() => setPlanItem(null)}
          onDone={() => {
            setPlanItem(null)
            setDetail(null)
            onToast('Séance planifiée avec succès !', 'success')
          }}
        />
      )}
    </div>,
    document.body,
  )
}

/** Détail d'une séance (catalogue ou perso) — miroir light du détail catalogue. */
function WorkoutDetail({
  item,
  exos,
  coverUrl,
  onToast,
  onClose,
  onPlan,
}: {
  item: ProgramItem
  exos: PreviewExo[]
  coverUrl: string | null
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void
  onClose: () => void
  onPlan: () => void
}) {
  const accent = CATEGORY_ACCENT[item.category] || '#ffee8c'
  const [video, setVideo] = useState<{ url: string; title: string } | null>(null)

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-bg-1 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[308px]">
        {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
      </div>

      <button
        onClick={onClose}
        className="fixed left-4 z-[110] bg-white rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform fixed-top-button"
        aria-label="Retour"
      >
        <ArrowLeft size={16} className="text-tx-1" />
      </button>

      <div className="h-full overflow-y-auto no-scrollbar overscroll-none">
        <div className="h-[258px] shrink-0" />
        <div
          className="relative bg-bg-1 rounded-t-[24px] shadow-[0px_0px_13px_0px_rgba(0,0,0,0.1)] px-4 pt-3"
          style={{ paddingBottom: '120px' }}
        >
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-bg-2" />
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {/* Tag neutre gris, identique au badge difficulté du catalogue
                 *  (pas de distinction couleur haut/bas du corps). */}
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg border border-tx-2 bg-bg-2 self-start">
                  <span className="font-sans font-semibold text-xs text-tx-2 uppercase">
                    {CATEGORY_LABEL[item.category]}
                  </span>
                </div>
                <h2 className="font-serif font-bold text-[32px] text-tx-1 tracking-[-0.96px]">
                  {item.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[24px] bg-tx-1 flex items-center justify-center p-2">
                  <Dumbbell size={16} style={{ color: accent }} />
                </div>
                <div>
                  <p className="font-sans font-semibold text-xs text-tx-3">EXERCICES</p>
                  <p className="font-sans font-semibold text-base text-tx-1">{exos.length}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-serif font-bold text-2xl text-tx-1 tracking-[-0.72px]">Exercices</h3>
              <div className="flex flex-col gap-2">
                {exos.map((exo, index) => (
                  <ExerciseRow
                    key={index}
                    index={index + 1}
                    name={exo.name}
                    sets={exo.sets}
                    reps={exo.reps}
                    variant="light"
                    accent={accent}
                    onPlay={() =>
                      exo.videoUrl && exo.videoUrl.length > 5
                        ? setVideo({ url: exo.videoUrl, title: exo.name })
                        : onToast(`Vidéo bientôt disponible pour ${exo.name}`, 'info')
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-[110] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(to bottom, rgba(241,244,251,0) 0%, #f1f4fb 32%)' }}
      >
        <div className="px-6 pt-8 pointer-events-auto cta-bottom-safe">
          <button
            onClick={onPlan}
            className="w-full flex items-center justify-center gap-3 bg-tx-1 font-sans font-semibold text-base p-4 rounded-12 shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] cursor-pointer active:scale-[0.98] transition-transform"
            style={{ color: accent }}
          >
            <Calendar size={16} />
            <span>Planifier cette séance</span>
          </button>
        </div>
      </div>

      {/* Vidéo de l'exercice (raccordée comme dans le Workout Player) */}
      {video && (
        <div className="fixed inset-0 z-[10001] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setVideo(null)}
            aria-label="Fermer la vidéo"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            className="absolute right-6 w-10 h-10 rounded-full bg-tx-1 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X size={18} className="text-bg-1" />
          </button>
          <h3 className="font-serif font-bold text-xl text-bg-1 mb-6 text-center px-8">
            {video.title}
          </h3>
          <video
            src={video.url}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            className="w-full max-w-sm rounded-16 overflow-hidden"
          />
        </div>
      )}
    </div>,
    document.body,
  )
}

/** Sélecteur de jours — planifie la séance (catalogue ou perso) dans workout_plan. */
function PlanModal({
  item,
  onClose,
  onDone,
}: {
  item: ProgramItem
  onClose: () => void
  onDone: () => void
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

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
        source: item.source,
        workout_id: item.source === 'catalog' ? item.refId : null,
        user_workout_id: item.source === 'user' ? item.refId : null,
      }))
      const { error } = await supabase
        .from('workout_plan')
        .upsert(rows, { onConflict: 'user_id, day_of_week' })
      if (error) throw error
      onDone()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || selectedDays.length === 0}
          className="w-full bg-tx-1 text-pr-1 font-sans font-semibold text-base p-4 rounded-12 cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : `Valider (${selectedDays.length})`}
        </button>
      </div>
    </div>,
    document.body,
  )
}
