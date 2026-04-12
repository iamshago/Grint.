// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Play, Pause, Check, SkipForward, Timer, ChevronLeft, X, List, ArrowRight } from 'lucide-react'
import ExerciseRow from '@/components/features/ExerciseRow'

/** Couleur d'accent par catégorie */
const CATEGORY_ACCENT: Record<string, string> = {
  upper: '#ffee8c',
  lower: '#507fff',
  bbl: '#ff63b3',
}

export default function WorkoutSession() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  const isCircuitMode =
    workout?.title?.toLowerCase().includes('abdos') ||
    workout?.title?.toLowerCase().includes('circuit')
  const isBBL = workout?.title?.toUpperCase().includes('BBL')
  const category = workout?.category || 'upper'
  const accentColor = CATEGORY_ACCENT[category] || '#ffee8c'

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: wData, error: wError } = await supabase
          .from('workouts')
          .select(`*, workout_exercises(*, exercise:exercises(*))`)
          .eq('id', id)
          .single()

        if (wError) throw wError
        setWorkout(wData)

        const sortedExos = (wData.workout_exercises || []).sort(
          (a, b) => a.order_index - b.order_index,
        )
        setExercises(sortedExos)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const finishWorkout = async (finalLogs = []) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        console.log('Mode démo : séance terminée (non sauvegardée)')
        return navigate('/home')
      }

      const userId = session.user.id
      const now = new Date().toISOString()
      const estimatedCalories = workout.duration_min * 7

      const completedPayload = {
        workout_id: workout.id,
        duration_min: workout.duration_min,
        calories: estimatedCalories,
        user_id: userId,
        completed_at: now,
      }

      let progressPayload = []
      if (finalLogs.length > 0) {
        progressPayload = finalLogs.map((log) => ({
          user_id: userId,
          exercise_id: log.exercise_id,
          weight_used: log.weight_used,
          reps_done: log.reps_done,
          created_at: now,
        }))
      } else if (isCircuitMode && exercises.length > 0) {
        progressPayload = [
          {
            user_id: userId,
            exercise_id: exercises[0].exercise_id,
            weight_used: 0,
            reps_done: 1,
            notes: 'Circuit validé',
            created_at: now,
          },
        ]
      }

      if (!navigator.onLine) throw new Error('Offline')

      await supabase.from('completed_workouts').insert(completedPayload)
      if (progressPayload.length > 0) {
        await supabase.from('user_progress').insert(progressPayload)
      }

      navigate('/')
    } catch (err) {
      console.log('Réseau indisponible, sauvegarde locale...')
      const offlineQueue = JSON.parse(localStorage.getItem('offline_workouts') || '[]')

      const sessionRes = await supabase.auth.getSession()
      const fallbackUserId = sessionRes.data.session?.user?.id
      if (!fallbackUserId) return navigate('/')

      const now = new Date().toISOString()
      const compPayload = {
        workout_id: workout.id,
        duration_min: workout.duration_min,
        calories: workout.duration_min * 7,
        user_id: fallbackUserId,
        completed_at: now,
      }

      let progPayload = []
      if (finalLogs.length > 0) {
        progPayload = finalLogs.map((log) => ({
          user_id: fallbackUserId,
          exercise_id: log.exercise_id,
          weight_used: log.weight_used,
          reps_done: log.reps_done,
          created_at: now,
        }))
      }

      offlineQueue.push({ completedPayload: compPayload, progressPayload: progPayload })
      localStorage.setItem('offline_workouts', JSON.stringify(offlineQueue))

      navigate('/')
    }
  }

  if (loading)
    return (
      <div className="h-[100dvh] bg-dark-900 text-white flex items-center justify-center">
        Chargement...
      </div>
    )
  if (!workout)
    return (
      <div className="h-[100dvh] bg-dark-900 text-white flex items-center justify-center">
        Séance introuvable.
      </div>
    )

  return (
    <div className="h-[100dvh] overflow-hidden bg-dark-900 text-white font-sans flex flex-col safe-area-top">
      {isCircuitMode ? (
        <>
          <div className="p-4 pt-2 flex items-center gap-4 bg-dark-900 shrink-0 border-b border-dark-800">
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform shrink-0"
            >
              <X size={16} className="text-bg-1" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black italic uppercase tracking-tighter truncate">
                {workout.title}
              </h1>
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col relative">
            <CircuitTimerView exercises={exercises} onFinish={finishWorkout} isBBL={isBBL} />
          </div>
        </>
      ) : (
        <ExerciseSelectionHub
          workout={workout}
          exercises={exercises}
          accentColor={accentColor}
          onFinish={finishWorkout}
          onClose={() => setShowQuitConfirm(true)}
        />
      )}

      {/* Modale confirmation annulation */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-dark-800 rounded-[20px] p-6 w-full max-w-[320px] flex flex-col items-center gap-5 border border-dark-700">
            <p className="font-serif font-bold text-xl text-bg-1 text-center">
              Annuler ta séance ?
            </p>
            <p className="font-sans text-sm text-tx-3 text-center">
              Ta progression ne sera pas sauvegardée.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-3 rounded-[12px] border border-dark-700 font-sans font-semibold text-sm text-bg-1 active:scale-95 transition-transform"
                aria-label="Non, continuer"
              >
                Non
              </button>
              <button
                onClick={() => navigate('/home')}
                className="flex-1 py-3 rounded-[12px] bg-[#e62d2d] font-sans font-semibold text-sm text-white active:scale-95 transition-transform"
                aria-label="Oui, annuler la séance"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Hub de sélection d'exercice — Figma node 312:752
// ═══════════════════════════════════════════════════

const ExerciseSelectionHub = ({ workout, exercises, accentColor, onFinish, onClose }) => {
  // État de chaque exercice : index dans exercises[] → 'pending' | 'selected' | 'active' | 'completed'
  const [exoStates, setExoStates] = useState<Record<number, string>>({})
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  // Vue active : 'list' | 'input' | 'rest' | 'recap'
  const [view, setView] = useState<'list' | 'input' | 'rest' | 'recap'>('list')
  // Vue précédente (pour revenir du récap)
  const [prevView, setPrevView] = useState<'list' | 'input' | 'rest'>('list')
  // Exercice en cours de saisie
  const [activeExoIndex, setActiveExoIndex] = useState<number | null>(null)
  const [currentSet, setCurrentSet] = useState(1)
  // Logs de la session
  const [sessionLogs, setSessionLogs] = useState<Record<string, any>>({})
  // PR historiques
  const [historicalPRs, setHistoricalPRs] = useState<Record<string, number>>({})
  const [historyLoaded, setHistoryLoaded] = useState(false)
  // Saisie
  const [weight, setWeight] = useState(0)
  const [reps, setReps] = useState(10)
  // Timer repos
  const [restTimeLeft, setRestTimeLeft] = useState(0)
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null)
  // Vidéo
  const [videoModal, setVideoModal] = useState({ isOpen: false, url: null, title: '' })

  const isBBL = workout?.title?.toUpperCase().includes('BBL')

  // Dernier poids utilisé par exercice dans la session en cours
  const [sessionWeights, setSessionWeights] = useState<Record<string, number>>({})

  // Récupérer le dernier poids historique par exercice (le plus récent, pas le max)
  useEffect(() => {
    async function fetchHistory() {
      if (exercises.length === 0) return
      const exIds = exercises.map((e) => e.exercise?.id).filter(Boolean)
      if (exIds.length === 0) {
        setHistoryLoaded(true)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setHistoryLoaded(true)
        return
      }

      // Récupérer les entrées les plus récentes par exercice (ORDER BY created_at DESC)
      const { data } = await supabase
        .from('user_progress')
        .select('exercise_id, weight_used, created_at')
        .eq('user_id', user.id)
        .in('exercise_id', exIds)
        .order('created_at', { ascending: false })

      if (data) {
        const hist: Record<string, number> = {}
        data.forEach((log) => {
          // On garde seulement la première occurrence (la plus récente) par exercice
          if (hist[log.exercise_id] === undefined) {
            hist[log.exercise_id] = Number(log.weight_used) || 0
          }
        })
        setHistoricalPRs(hist)
      }
      setHistoryLoaded(true)
    }
    fetchHistory()
  }, [exercises])

  // Timer repos
  useEffect(() => {
    let interval = null
    if (view === 'rest' && targetEndTime) {
      interval = setInterval(() => {
        const remaining = Math.round((targetEndTime - Date.now()) / 1000)
        if (remaining <= 0) {
          setRestTimeLeft(0)
          setTargetEndTime(null)
          // Retour à l'input pour la série suivante
          advanceToNextSet()
        } else {
          setRestTimeLeft(remaining)
        }
      }, 500)
    }
    return () => clearInterval(interval)
  }, [view, targetEndTime])

  const completedCount = Object.values(exoStates).filter((s) => s === 'completed').length
  const allCompleted = completedCount === exercises.length && exercises.length > 0

  // Sélectionner un exercice sur la liste
  const handleSelectExercise = (idx: number) => {
    if (exoStates[idx] === 'completed') return
    setSelectedIndex(idx === selectedIndex ? null : idx)
  }

  // Lancer l'exercice sélectionné
  const handleStartExercise = () => {
    if (selectedIndex === null) return
    setActiveExoIndex(selectedIndex)
    setCurrentSet(1)
    setView('input')

    // Initialiser poids : session en cours > dernier poids historique > 0
    const exo = exercises[selectedIndex]
    const exId = exo.exercise?.id
    const sessionW = exId ? sessionWeights[exId] : undefined
    const histW = exId ? historicalPRs[exId] : undefined
    setWeight(sessionW ?? histW ?? 0)

    const targetMin = parseInt((exo.reps || '10').split('-')[0]) || 10
    setReps(targetMin)

    setExoStates((prev) => ({ ...prev, [selectedIndex]: 'active' }))
  }

  // Valider une série
  const validateSet = () => {
    if (activeExoIndex === null) return
    const exo = exercises[activeExoIndex]
    const key = `${activeExoIndex}-${currentSet}`
    const exId = exo.exercise?.id

    setSessionLogs((prev) => ({
      ...prev,
      [key]: { exercise_id: exId, weight_used: weight, reps_done: reps },
    }))

    // Mémoriser le dernier poids pour cet exercice dans la session
    if (exId) {
      setSessionWeights((prev) => ({ ...prev, [exId]: weight }))
    }

    if (currentSet < exo.sets) {
      // Aller au repos
      setRestTimeLeft(exo.rest_seconds || 90)
      setTargetEndTime(Date.now() + (exo.rest_seconds || 90) * 1000)
      setView('rest')
    } else {
      // Exercice terminé → retour à la liste
      setExoStates((prev) => ({ ...prev, [activeExoIndex]: 'completed' }))
      setSelectedIndex(null)
      setActiveExoIndex(null)
      setView('list')
    }
  }

  // Après le repos, passer à la série suivante
  const advanceToNextSet = () => {
    if (activeExoIndex === null) return
    const nextSet = currentSet + 1
    setCurrentSet(nextSet)

    // Copier le poids de la série précédente
    const prevKey = `${activeExoIndex}-${currentSet}`
    if (sessionLogs[prevKey]) {
      setWeight(sessionLogs[prevKey].weight_used)
      setReps(sessionLogs[prevKey].reps_done)
    }

    setView('input')
  }

  // Passer le repos
  const skipRest = () => {
    setTargetEndTime(null)
    setRestTimeLeft(0)
    advanceToNextSet()
  }

  // Terminer la séance
  const handleFinishWorkout = () => {
    onFinish(Object.values(sessionLogs))
  }

  // Ouvrir vidéo
  const handleOpenVideo = (exo) => {
    const url = exo.exercise?.video_url
    const name = exo.exercise?.name
    if (url && url.length > 5) {
      setVideoModal({ isOpen: true, url, title: name })
    }
  }

  // ─── VUE LISTE (Hub) ───────────────────────────────────
  if (view === 'list') {
    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-2 pb-4 flex items-center shrink-0">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform"
            aria-label="Fermer"
          >
            <X size={16} className="text-bg-1" />
          </button>
          <h1 className="flex-1 text-center font-serif font-bold text-xl text-bg-1 tracking-[-0.6px]">
            {workout.title}
          </h1>
          <button
            onClick={() => { setPrevView(view as 'list' | 'input' | 'rest'); setView('recap') }}
            className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform"
            aria-label="Récapitulatif"
          >
            <List size={16} className="text-bg-1" />
          </button>
        </div>

        {/* Liste scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-40">
          <h2 className="font-serif font-bold text-2xl text-bg-1 tracking-[-0.72px] mb-3 mt-6">
            Exercices
          </h2>
          <div className="flex flex-col gap-2">
            {exercises.map((exo, idx) => {
              const state = exoStates[idx] || 'pending'
              const isCompleted = state === 'completed'
              const isSelected = selectedIndex === idx

              return (
                <ExerciseRow
                  key={idx}
                  index={idx + 1}
                  name={exo.exercise?.name || ''}
                  sets={exo.sets}
                  reps={exo.reps}
                  variant="dark"
                  accent={accentColor}
                  completed={isCompleted}
                  selected={isSelected}
                  onClick={() => handleSelectExercise(idx)}
                  onPlay={
                    !isCompleted ? () => handleOpenVideo(exo) : undefined
                  }
                />
              )
            })}
          </div>
        </div>

        {/* CTA flottant — bottom 56px */}
        <div className="fixed left-[24px] right-[24px] z-[10] cta-position-safe">
            {allCompleted ? (
              <button
                onClick={handleFinishWorkout}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-[12px] cursor-pointer active:scale-95 transition-transform font-sans font-semibold text-base"
                style={{ backgroundColor: accentColor, color: '#1b1d1f', boxShadow: `0px 0px 20px 0px ${accentColor}4D` }}
              >
                <Check size={16} />
                Terminer la séance
              </button>
            ) : selectedIndex !== null ? (
              <button
                onClick={handleStartExercise}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-[12px] cursor-pointer active:scale-95 transition-transform font-sans font-semibold text-base"
                style={{ backgroundColor: accentColor, color: '#1b1d1f', boxShadow: `0px 0px 20px 0px ${accentColor}4D` }}
              >
                <Timer size={16} />
                {completedCount === 0 ? 'Commencer ta séance' : "Lancer l'exercice"}
              </button>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 p-4 rounded-[12px] font-sans font-semibold text-base bg-tx-3 opacity-40 text-tx-1 cursor-default"
              >
                <Play size={16} />
                Sélectionne un exercice
              </button>
            )}
        </div>

        {/* Modale vidéo */}
        {videoModal.isOpen && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <button
              onClick={() => setVideoModal({ isOpen: false, url: null, title: '' })}
              className="absolute top-8 right-6 w-14 h-14 bg-dark-800 rounded-full flex items-center justify-center border border-dark-700 text-white active:scale-95 z-50"
            >
              <X size={28} />
            </button>
            <h3 className="text-xl font-bold text-bg-1 mb-6 text-center px-8">
              {videoModal.title}
            </h3>
            <div className="w-full max-w-sm rounded-[32px] overflow-hidden border-2 border-dark-700 bg-dark-900">
              {videoModal.url ? (
                <video
                  src={videoModal.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Vidéo indisponible
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── VUE SAISIE (Input poids/reps) — Figma 235:705 ────
  if (view === 'input' && activeExoIndex !== null) {
    const exo = exercises[activeExoIndex]
    const targetRepsStr = exo.reps || '10'
    const isRange = targetRepsStr.includes('-')
    const targetMax = isRange
      ? parseInt(targetRepsStr.split('-')[1]) || 10
      : parseInt(targetRepsStr) || 10
    const stepKey = `${activeExoIndex}-${currentSet}`

    /** Messages motivationnels quand on atteint le max de la range */
    const motivationalMessages = [
      'Déjà {max} reps ? Tu joues à quoi là, augmente la charge !',
      'Tu maîtrises, passe au poids supérieur !',
      '{max} reps clean ? Il est temps de charger plus !',
      'Trop facile pour toi, monte la charge !',
      'Objectif atteint ! Rajoute du poids maintenant 💪',
    ]
    const motivationalMsg = motivationalMessages[activeExoIndex % motivationalMessages.length]
      .replace('{max}', String(targetMax))

    /* Figma positions (from top of 874px frame, incl 62px status bar):
       header=72, badge=188, name=230, objective=283,
       weight=326, reps=491, pill=648, CTA=766
       We offset by -62px since we don't render the status bar,
       then add our own top padding (~56px for pt-14).
       Net offset from container top: figmaTop - 62 + 10 */
    return (
      <div className="flex-1 relative h-full overflow-hidden">
        {/* Header — Figma top=72 → ~20px from our container */}
        <div className="absolute top-2 left-[16px] right-[16px] flex items-center z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform"
            aria-label="Annuler la séance"
          >
            <X size={16} className="text-bg-1" />
          </button>
          <h1 className="flex-1 text-center font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px]">
            {workout.title}
          </h1>
          <button
            onClick={() => { setPrevView(view as 'list' | 'input' | 'rest'); setView('recap') }}
            className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform"
            aria-label="Récapitulatif"
          >
            <List size={16} className="text-bg-1" />
          </button>
        </div>

        {/* Badge — Figma: top=188, rounded-8, px-12 py-6, bg accent/25%, border accent */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[128px]">
          <span
            className="inline-flex px-3 py-1.5 rounded-[8px] text-[12px] font-sans font-semibold uppercase whitespace-nowrap"
            style={{
              backgroundColor: `${accentColor}40`,
              border: `1px solid ${accentColor}`,
              color: accentColor,
            }}
          >
            série {currentSet} sur {exo.sets}
          </span>
        </div>

        {/* Exercise name — Figma: top=230, 32px PT Serif Bold, tracking -0.96px */}
        <h2 className="absolute left-1/2 -translate-x-1/2 top-[170px] font-serif font-bold text-[32px] text-bg-1 text-center whitespace-nowrap tracking-[-0.96px]">
          {exo.exercise?.name}
        </h2>

        {/* Objective — Figma: top=283, 16px Figtree */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[223px] flex items-center gap-1 whitespace-nowrap">
          <span className="font-sans font-normal text-[16px] text-tx-3">Objectif ciblé :</span>
          <span className="font-sans font-bold text-[16px]" style={{ color: accentColor }}>
            {exo.reps} reps
          </span>
        </div>

        {/* Weight container — Figma: left=32, w=338, h=141, rounded-24, top=326 → 274 */}
        <div className="absolute left-[32px] right-[32px] h-[141px] bg-tx-1 rounded-[24px] overflow-hidden top-[266px]">
          <p className="text-center text-tx-3 text-[12px] font-sans font-semibold uppercase mt-6">
            Poids (kg)
          </p>
          <HorizontalPicker
            value={weight}
            onChange={setWeight}
            min={0}
            max={200}
            stepKey={stepKey}
          />
        </div>

        {/* Reps container — Figma: top=491 → 439, 24px gap from weight */}
        <div className="absolute left-[32px] right-[32px] h-[141px] bg-tx-1 rounded-[24px] overflow-hidden top-[431px]">
          <p className="text-center text-tx-3 text-[12px] font-sans font-semibold uppercase mt-6">
            Reps
          </p>
          <HorizontalPicker
            value={reps}
            onChange={setReps}
            min={0}
            max={50}
            stepKey={stepKey}
          />
        </div>

        {/* Motivational pill — 16px below reps container bottom (439+141+16=596) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[588px] flex items-center justify-center">
          {isRange && reps >= targetMax && (
            <div
              className="px-4 py-3 rounded-[24px] text-[12px] font-sans font-semibold text-center whitespace-nowrap"
              style={{
                backgroundColor: `${accentColor}40`,
                color: accentColor,
              }}
            >
              {motivationalMsg}
            </div>
          )}
        </div>

        {/* CTA — bottom 56px */}
        <div className="absolute left-[24px] right-[24px] cta-position-safe">
          <button
            onClick={validateSet}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-[12px] active:scale-[0.97] transition-transform font-sans font-semibold text-[16px] cursor-pointer"
            style={{
              backgroundColor: accentColor,
              color: '#1b1d1f',
              boxShadow: `0px 0px 20px 0px ${accentColor}4D`,
            }}
          >
            <Check size={16} strokeWidth={2.5} /> Valider ma série
          </button>
        </div>
      </div>
    )
  }

  // ─── VUE REPOS (Timer) ────────────────────────────────
  if (view === 'rest' && activeExoIndex !== null) {
    const exo = exercises[activeExoIndex]
    const nextExoName = exo.exercise?.name || 'Exercice suivant'
    const mins = Math.floor(restTimeLeft / 60)
    const secs = restTimeLeft % 60

    /* Prochain exercice à afficher sous le timer */
    const nextExoData = exo
    const nextVideoUrl = nextExoData?.exercise?.video_url
    const nextVideoName = nextExoData?.exercise?.name || ''

    return (
      <div className="flex-1 relative h-full overflow-hidden">
        {/* Header — X / Titre / List (même pattern que input) */}
        <div className="absolute top-2 left-[16px] right-[16px] flex items-center z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform"
            aria-label="Annuler la séance"
          >
            <X size={16} className="text-bg-1" />
          </button>
          <h1 className="flex-1 text-center font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px]">
            {workout.title}
          </h1>
          <button
            onClick={() => { setPrevView(view as 'list' | 'input' | 'rest'); setView('recap') }}
            className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform"
            aria-label="Récapitulatif"
          >
            <List size={16} className="text-bg-1" />
          </button>
        </div>

        {/* Halo — lueur animée derrière le timer */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-10 animate-pulse -mt-[70px]"
          style={{ backgroundColor: accentColor }}
        />

        {/* Timer — Figma: 116px Figtree Bold, slightly above center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-[70px]">
          <p className="font-sans font-bold text-[116px] leading-none tabular-nums tracking-[-3.48px] text-bg-1 text-center">
            {mins}:{secs < 10 ? '0' : ''}{secs}
          </p>
        </div>

        {/* Instruction container — 45px sous le timer */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 mt-[35px] flex flex-col items-center">
          {/* "Prépare-toi pour" → 4px → nom exercice → 12px → pill */}
          <p className="font-sans font-normal text-[12px] text-tx-3">
            Prépare-toi pour
          </p>
          <p className="font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px] mt-[4px]">
            {nextExoName}
          </p>
          {nextVideoUrl && nextVideoUrl.length > 5 && (
            <button
              onClick={() => setVideoModal({ isOpen: true, url: nextVideoUrl, title: nextVideoName })}
              className="flex items-center gap-1.5 px-4 py-3 rounded-[24px] active:scale-95 transition-transform cursor-pointer mt-[12px]"
              style={{ backgroundColor: `${accentColor}40` }}
            >
              <Play size={12} fill={accentColor} stroke={accentColor} />
              <span className="font-sans font-semibold text-[12px] whitespace-nowrap" style={{ color: accentColor }}>
                Comment l'exécuter ?
              </span>
            </button>
          )}
        </div>

        {/* Actions — bottom 56px : Retour + Passer le repos */}
        <div className="absolute left-[24px] right-[24px] flex items-center gap-3 cta-position-safe">
          <button
            onClick={() => {
              // Retour à la vue input — le timer continue (targetEndTime persiste)
              setView('input')
            }}
            className="shrink-0 w-[56px] h-[56px] rounded-[12px] bg-tx-1 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Retour"
          >
            <ChevronLeft size={16} className="text-bg-1" />
          </button>
          <button
            onClick={skipRest}
            className="flex-1 bg-tx-1 p-4 rounded-[12px] active:scale-95 transition-transform flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="font-sans font-semibold text-[16px] text-bg-1">Passer le repos</span>
            <ArrowRight size={16} className="text-bg-1" />
          </button>
        </div>

        {/* Modale vidéo (réutilisée) */}
        {videoModal.isOpen && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <button
              onClick={() => setVideoModal({ isOpen: false, url: null, title: '' })}
              className="absolute top-8 right-6 w-14 h-14 bg-dark-800 rounded-full flex items-center justify-center border border-dark-700 text-white active:scale-95 z-50"
            >
              <X size={28} />
            </button>
            <h3 className="text-xl font-bold text-bg-1 mb-6 text-center px-8">
              {videoModal.title}
            </h3>
            <div className="w-full max-w-sm rounded-[32px] overflow-hidden border-2 border-dark-700 bg-dark-900">
              {videoModal.url ? (
                <video
                  src={videoModal.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Vidéo indisponible
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── VUE RÉCAPITULATIF (Figma node 332:1841) ───────────
  if (view === 'recap') {
    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-2 pb-4 flex items-center shrink-0">
          <button
            onClick={() => setView(prevView)}
            className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform"
            aria-label="Retour"
          >
            <ChevronLeft size={16} className="text-bg-1" />
          </button>
          <h1 className="flex-1 text-center font-serif font-bold text-xl text-bg-1 tracking-[-0.6px]">
            Récapitulatif
          </h1>
          <div className="w-10" />
        </div>

        {/* Liste scrollable des exercices */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-40">
          {exercises.map((exo, eIdx) => {
            const exId = exo.exercise?.id
            return (
              <div key={eIdx} className="bg-tx-1 rounded-[16px] p-4 mb-6 overflow-hidden">
                {/* Nom exercice */}
                <p
                  className="font-sans font-bold text-2xl uppercase mb-4"
                  style={{ color: accentColor }}
                >
                  {exo.exercise?.name}
                </p>

                {/* En-têtes colonnes */}
                <div className="flex px-3 mb-2">
                  <span className="font-sans font-medium text-xs text-tx-3 uppercase w-16">
                    Séries
                  </span>
                  <span className="font-sans font-medium text-xs text-tx-3 uppercase flex-1 text-center">
                    Poids (kg)
                  </span>
                  <span className="font-sans font-medium text-xs text-tx-3 uppercase w-16 text-right">
                    Reps
                  </span>
                </div>

                {/* Lignes de séries */}
                <div className="flex flex-col gap-2">
                  {Array.from({ length: exo.sets }).map((_, sIdx) => {
                    const setNum = sIdx + 1
                    const key = `${eIdx}-${setNum}`
                    const log = sessionLogs[key]
                    const defaultWeight = historicalPRs[exId] || 0
                    const defaultReps = parseInt((exo.reps || '10').split('-')[0]) || 10
                    const currentWeight = log ? log.weight_used : defaultWeight
                    const currentReps = log ? log.reps_done : defaultReps
                    // Afficher vide si pas encore loggué (pour éviter le "0" bloquant)
                    const displayWeight = log ? String(log.weight_used) : (defaultWeight > 0 ? String(defaultWeight) : '')
                    const displayReps = log ? String(log.reps_done) : (defaultReps > 0 ? String(defaultReps) : '')

                    const updateLog = (field: string, val: string) => {
                      setSessionLogs((prev) => ({
                        ...prev,
                        [key]: {
                          exercise_id: exId,
                          weight_used: field === 'weight' ? (val === '' ? 0 : Number(val)) : currentWeight,
                          reps_done: field === 'reps' ? (val === '' ? 0 : Number(val)) : currentReps,
                        },
                      }))
                    }

                    return (
                      <div
                        key={setNum}
                        className="flex items-center bg-[rgba(12,12,12,0.5)] rounded-[8px] h-10 px-3"
                      >
                        <span className="font-sans font-bold text-base text-tx-3 w-16">
                          {setNum}
                        </span>
                        <div className="flex-1 text-center">
                          <input
                            type="number"
                            value={displayWeight}
                            placeholder="0"
                            onChange={(e) => updateLog('weight', e.target.value)}
                            className="w-16 bg-transparent text-center font-sans font-bold text-base text-bg-1 placeholder:text-tx-3 placeholder:opacity-50 focus:outline-none"
                          />
                        </div>
                        <div className="w-16 text-right">
                          <input
                            type="number"
                            value={displayReps}
                            placeholder="0"
                            onChange={(e) => updateLog('reps', e.target.value)}
                            className="w-12 bg-transparent text-right font-sans font-bold text-base text-bg-1 placeholder:text-tx-3 placeholder:opacity-50 focus:outline-none"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Terminer — bottom 56px */}
        <div className="fixed left-[24px] right-[24px] z-[10] cta-position-safe">
          <button
            onClick={() => {
              const newStates = { ...exoStates }
              exercises.forEach((_, idx) => {
                newStates[idx] = 'completed'
              })
              setExoStates(newStates)
              handleFinishWorkout()
            }}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-[12px] cursor-pointer active:scale-95 transition-transform font-sans font-semibold text-base"
            style={{ backgroundColor: accentColor, color: '#1b1d1f', boxShadow: `0px 0px 20px 0px ${accentColor}4D` }}
          >
            <Check size={16} />
            Terminer ma séance
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ═══════════════════════════════════════════════════
// Molette horizontale (réutilisée de l'ancien code)
// ═══════════════════════════════════════════════════

const HorizontalPicker = ({ value, onChange, min, max, stepKey }) => {
  const scrollRef = useRef(null)
  const itemWidth = 80
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const isManualScroll = useRef(false)
  const scrollTimeout = useRef(null)

  useEffect(() => {
    if (scrollRef.current && !isManualScroll.current) {
      scrollRef.current.scrollLeft = (value - min) * itemWidth
    }
  }, [value, min, stepKey])

  const handleScroll = (e) => {
    isManualScroll.current = true
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      isManualScroll.current = false
    }, 150)
    const scrollLeft = e.target.scrollLeft
    const index = Math.round(scrollLeft / itemWidth)
    const newValue = min + index
    if (newValue !== value && newValue >= min && newValue <= max) onChange(newValue)
  }

  return (
    <div
      className="relative w-full h-20 overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 40%, black 60%, transparent)',
      }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex overflow-x-auto overflow-y-hidden touch-pan-x snap-x snap-mandatory no-scrollbar items-center"
        style={{
          paddingLeft: 'calc(50% - 40px)',
          paddingRight: 'calc(50% - 40px)',
        }}
      >
        {items.map((num) => (
          <div
            key={num}
            className={`shrink-0 w-20 h-20 flex items-center justify-center snap-center transition-all duration-300 cursor-grab active:cursor-grabbing ${
              value === num ? 'scale-110 opacity-100' : 'scale-90 opacity-30'
            }`}
          >
            <span
              className={`transition-colors ${
                value === num
                  ? 'text-5xl font-bold text-white'
                  : 'text-3xl font-bold text-gray-500'
              }`}
            >
              {num}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Vue Circuit Timer (gardée pour les séances abdos)
// ═══════════════════════════════════════════════════

const CircuitTimerView = ({ exercises, onFinish, isBBL }) => {
  const cText = isBBL ? 'text-pink-500' : 'text-neon'
  const cBg = isBBL ? 'bg-pink-500' : 'bg-neon'
  const cShadow = isBBL
    ? 'shadow-[0_0_40px_rgba(236,72,153,0.3)]'
    : 'shadow-[0_0_40px_rgba(204,255,0,0.3)]'
  const cShadowText = isBBL
    ? 'drop-shadow-[0_0_35px_rgba(236,72,153,0.5)]'
    : 'drop-shadow-[0_0_35px_rgba(204,255,0,0.5)]'

  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [targetEndTime, setTargetEndTime] = useState(null)

  useEffect(() => {
    if (exercises.length === 0) return
    const generatedList = []
    const totalSets = exercises[0].sets || 1
    for (let tour = 1; tour <= totalSets; tour++) {
      exercises.forEach((exo) => {
        const duration = parseInt(exo.reps.replace('s', '')) || 30
        generatedList.push({
          type: 'WORK',
          name: exo.exercise.name,
          duration: duration,
          tour: tour,
          totalTours: totalSets,
        })
        if (exo.rest_seconds > 0)
          generatedList.push({
            type: 'REST',
            name: 'Repos',
            duration: exo.rest_seconds,
            tour: tour,
            totalTours: totalSets,
          })
      })
    }
    setPlaylist(generatedList)
    if (generatedList.length > 0) setTimeLeft(generatedList[0].duration)
  }, [exercises])

  useEffect(() => {
    let interval = null
    if (isRunning && targetEndTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const remaining = Math.round((targetEndTime - now) / 1000)
        if (remaining <= 0) {
          setTimeLeft(0)
          skipNext()
        } else {
          setTimeLeft(remaining)
        }
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isRunning, targetEndTime, currentIndex])

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false)
      setTargetEndTime(null)
    } else {
      setIsRunning(true)
      setTargetEndTime(Date.now() + timeLeft * 1000)
    }
  }

  const skipNext = () => {
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      const nextDuration = playlist[nextIndex].duration
      setTimeLeft(nextDuration)
      if (isRunning) setTargetEndTime(Date.now() + nextDuration * 1000)
    } else {
      setIsRunning(false)
      setIsFinished(true)
    }
  }

  if (playlist.length === 0) return null
  if (isFinished)
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div
          className={`w-24 h-24 ${cBg} text-dark-900 rounded-full flex items-center justify-center mb-6 ${cShadow}`}
        >
          <Check size={48} strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-bold uppercase mb-2">Circuit Terminé !</h2>
        <button
          onClick={() => onFinish([])}
          className={`w-full ${cBg} text-dark-900 font-bold py-4 rounded-2xl mt-8`}
        >
          VALIDER LA SÉANCE
        </button>
      </div>
    )

  const currentStep = playlist[currentIndex]
  const nextStep = playlist[currentIndex + 1]
  const isRest = currentStep.type === 'REST'
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeDisplay = `${mins > 0 ? mins + ':' : ''}${secs < 10 && mins > 0 ? '0' : ''}${secs}`
  const progress = (currentIndex / playlist.length) * 100

  return (
    <div className="flex-1 flex flex-col p-6 pb-8 relative">
      <div className="text-center mb-12 shrink-0">
        <span className="bg-dark-800 border border-dark-700 text-gray-300 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
          Tour {currentStep.tour} / {currentStep.totalTours}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2
          className={`text-3xl font-bold uppercase tracking-wide mb-6 text-center ${isRest ? 'text-gray-400' : cText}`}
        >
          {currentStep.name}
        </h2>
        <div
          className={`text-[120px] font-bold leading-none tabular-nums tracking-tighter transition-all duration-300 ${isRest ? 'text-white' : `${cText} ${cShadowText}`}`}
        >
          {timeDisplay}
        </div>
      </div>
      <div className="mt-8 text-center h-12 shrink-0">
        {nextStep && (
          <p className="text-sm text-gray-500 font-medium">
            Suivant : <span className="text-white font-bold">{nextStep.name}</span>
          </p>
        )}
      </div>
      <div className="mt-4 relative w-full flex items-center justify-center h-24 shrink-0">
        <button
          onClick={toggleTimer}
          className={`absolute z-10 w-24 h-24 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
            isRunning
              ? 'bg-dark-800 border-2 border-dark-700 text-white'
              : `${cBg} text-dark-900 ${cShadow}`
          }`}
        >
          {isRunning ? (
            <Pause size={36} fill="currentColor" />
          ) : (
            <Play size={36} fill="currentColor" className="ml-2" />
          )}
        </button>
        <button
          onClick={skipNext}
          className="absolute right-4 w-12 h-12 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-gray-400 hover:text-white active:scale-95"
        >
          <SkipForward size={20} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-dark-800">
        <div
          className={`h-full transition-all duration-300 ${cBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
