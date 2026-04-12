// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Play, Clock, Dumbbell, Check, ChevronLeft, X, CalendarPlus } from 'lucide-react'

import LightLayout from '@/components/layout/LightLayout'
import CalendarWeek from '@/components/features/CalendarWeek'
import WorkoutCard from '@/components/features/WorkoutCard'
import ExerciseRow from '@/components/features/ExerciseRow'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'
import { CATEGORY_COLORS } from '@/lib/AccentContext'

import { useStreak, CATEGORY_ACCENT } from '@/hooks/useStreak'

/** Accent couleur dérivé de la catégorie de la séance du jour sélectionné */
const CATEGORY_TO_ACCENT: Record<string, string> = {
  upper: '#ffee8c',
  lower: '#507fff',
  bbl: '#FF69B4',
}

export default function Home() {
  const navigate = useNavigate()

  const [userName, setUserName] = useState(localStorage.getItem('userName') || '')
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)

  /** Snap scroll — fade image hero au scroll */
  const snapRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const SNAP_TARGET = 258
    const imageEl = node.parentElement?.querySelector('[data-hero-image]') as HTMLElement | null
    const handleScroll = () => {
      if (!imageEl) return
      const progress = Math.min(node.scrollTop / SNAP_TARGET, 1)
      imageEl.style.opacity = String(1 - progress * 0.6)
    }
    node.addEventListener('scroll', handleScroll, { passive: true })
  }, [])

  // Accent dérivé de la catégorie de la séance du jour SÉLECTIONNÉ (pas global)
  const selectedCategory = todaysWorkout?.category || null
  const selectedAccent = CATEGORY_TO_ACCENT[selectedCategory] || '#ffee8c'
  const isBBL = selectedCategory === 'bbl'

  const [showPreview, setShowPreview] = useState(false)
  const [videoModal, setVideoModal] = useState({ isOpen: false, url: null, title: '' })

  const [toast, setToast] = useState(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Données streak & semaine (via hook partagé)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { streakCount, weekDays } = useStreak(currentUserId)

  const handleCarouselScroll = () => {
    const el = carouselRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    const cardWidth = el.firstElementChild?.clientWidth || 1
    const gap = 16
    const index = Math.round(scrollLeft / (cardWidth + gap))
    setActiveSlide(Math.min(index, 2))
  }
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Récupérer le nom de l'utilisateur
  useEffect(() => {
    async function getUserData() {
      const savedName = localStorage.getItem('userName')
      if (savedName) {
        setUserName(savedName)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Athlète'
          const firstName = fullName.split(' ')[0]
          setUserName(firstName)
          localStorage.setItem('userName', firstName)
          setCurrentUserId(user.id)
        }
      }
    }
    getUserData()
  }, [])

  // Jour sélectionné (0=lun, 6=dim)
  const now = new Date()
  const todayDayOfWeek = (now.getDay() + 6) % 7
  const [selectedDay, setSelectedDay] = useState(todayDayOfWeek)

  // Reset hebdo : vider le workout_plan quand on passe à une nouvelle semaine
  useEffect(() => {
    async function resetWeeklyPlanIfNeeded() {
      // Calcul du lundi de la semaine courante
      const today = new Date()
      const daysSinceMonday = (today.getDay() + 6) % 7
      const monday = new Date(today)
      monday.setDate(today.getDate() - daysSinceMonday)
      const mondayKey = monday.toISOString().slice(0, 10) // "2026-03-30"

      const savedWeek = localStorage.getItem('plan_week')
      if (savedWeek === mondayKey) return // même semaine, rien à faire

      // Nouvelle semaine détectée → vider le plan
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('workout_plan')
            .delete()
            .eq('user_id', user.id)
        }
      } catch (e) {
        console.error('Erreur reset hebdo:', e)
      }

      localStorage.setItem('plan_week', mondayKey)
    }
    resetWeeklyPlanIfNeeded()
  }, [])

  // Conversion selectedDay (0=lun) vers day_of_week Supabase (0=dim)
  const supabaseDayIndex = selectedDay === 6 ? 0 : selectedDay + 1

  const isFuture = selectedDay > todayDayOfWeek

  const selectedDayLabel = (() => {
    const d = new Date(now)
    const diff = selectedDay - todayDayOfWeek
    d.setDate(d.getDate() + diff)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  })()

  // Récupérer la séance planifiée
  useEffect(() => {
    getWorkoutAndStatus()
  }, [selectedDay])

  async function getWorkoutAndStatus() {
    try {
      setLoading(true)
      setIsCompleted(false)
      setTodaysWorkout(null)
      setShowPreview(false)

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Mode connecté
        const { data: planData, error: planError } = await supabase
          .from('workout_plan')
          .select(`workout_id, workouts (*, workout_exercises(*, exercise:exercises(*)))`)
          .eq('day_of_week', supabaseDayIndex)
          .eq('user_id', user.id)
          .maybeSingle()

        if (planError) throw planError

        if (planData && planData.workouts) {
          setTodaysWorkout(planData.workouts)

          const targetDate = new Date(now)
          const diff = selectedDay - todayDayOfWeek
          targetDate.setDate(targetDate.getDate() + diff)
          const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999)

          const { data: completed } = await supabase
            .from('completed_workouts')
            .select('id')
            .eq('workout_id', planData.workout_id)
            .eq('user_id', user.id)
            .gte('completed_at', startOfDay.toISOString())
            .lte('completed_at', endOfDay.toISOString())
            .maybeSingle()

          if (completed) setIsCompleted(true)
        }
      } else {
        // Mode démo (pas de session) — charge Push Day (6 exos, 60 min)
        const { data: demoWorkout } = await supabase
          .from('workouts')
          .select(`*, workout_exercises(*, exercise:exercises(*))`)
          .eq('title', 'Push Day')
          .maybeSingle()

        if (demoWorkout) setTodaysWorkout(demoWorkout)
      }
    } catch (error) {
      console.log('Erreur:', error.message)
    } finally {
      setLoading(false)
    }
  }

  // Synchro offline
  useEffect(() => {
    const syncOfflineWorkouts = async () => {
      if (!navigator.onLine) return
      const offlineQueue = JSON.parse(localStorage.getItem('offline_workouts') || '[]')
      if (offlineQueue.length === 0) return
      try {
        for (const item of offlineQueue) {
          await supabase.from('completed_workouts').insert(item.completedPayload)
          if (item.progressPayload.length > 0) {
            await supabase.from('user_progress').insert(item.progressPayload)
          }
        }
        localStorage.removeItem('offline_workouts')
        getWorkoutAndStatus()
      } catch (e) {
        console.error('Échec synchro', e)
      }
    }
    syncOfflineWorkouts()
    window.addEventListener('online', syncOfflineWorkouts)
    return () => window.removeEventListener('online', syncOfflineWorkouts)
  }, [])

  // Streak chargé via useStreak(currentUserId) automatiquement

  const handleOpenVideo = (exo) => {
    if (exo.exercise?.video_url && exo.exercise.video_url.length > 5) {
      setVideoModal({ isOpen: true, url: exo.exercise.video_url, title: exo.exercise.name })
    } else {
      showToast(`Vidéo bientôt disponible pour ${exo.exercise?.name || 'cet exercice'}`, 'info')
    }
  }

  return (
    <>
    <LightLayout className="flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed top-12 left-0 right-0 z-[300] flex justify-center px-4 pointer-events-none">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg border backdrop-blur-md ${
            toast.type === 'success' ? 'bg-[rgba(208,253,62,0.1)] border-neon' :
            toast.type === 'error' ? 'bg-[rgba(230,45,45,0.1)] border-[#e62d2d]' :
            'bg-white/80 border-border-light'
          }`}>
            {toast.type === 'success' && (
              <div className="bg-neon text-dark-900 rounded-full p-1">
                <Check size={14} strokeWidth={4} />
              </div>
            )}
            <span className="text-sm font-semibold text-tx-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-serif font-bold text-[32px] text-tx-1 tracking-[-0.96px]">
          Hello {userName}
        </h1>
      </div>

      {/* Carousel dark cards — swipeable */}
      <div className="mt-4">
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4"
          style={{ scrollPaddingInline: '16px', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Card 1 — Calendrier + Programmer */}
          <div className="bg-tx-1 rounded-[24px] p-3 flex flex-col gap-2 items-center snap-start shrink-0" style={{ width: 'calc(100vw - 32px)', scrollSnapStop: 'always' }}>
            <CalendarWeek
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              accentColor={selectedAccent}
            />
            <Button
              variant="cta"
              className="w-full"
              style={{
                backgroundColor: selectedAccent,
                boxShadow: `0px 0px 20px 0px ${selectedAccent}4D`,
              }}
              onClick={() => navigate('/programs')}
            >
              <CalendarPlus size={16} />
              <span>Programmer mes séances</span>
            </Button>
          </div>

          {/* Card 2 — Streak semaine (Figma 405:1594) */}
          <div className="bg-tx-1 rounded-[24px] snap-start shrink-0 px-4 py-6 flex gap-4" style={{ width: 'calc(100vw - 32px)', scrollSnapStop: 'always' }}>
            {/* Flamme à gauche — taille fixe, jamais de shrink */}
            <div className="shrink-0 w-[64px] h-[78px] min-w-[64px] self-center">
              <img src="/assets/streak-flame.svg" alt="" className="w-[64px] h-[78px] drop-shadow-[0_0_12px_rgba(255,238,140,0.4)]" />
            </div>
            {/* Contenu à droite */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <p className="font-sans text-bg-1 leading-none mb-2">
                  <span className="font-bold text-2xl">{streakCount} </span>
                  <span className="text-xs text-[#989da6]">/ 52 semaines</span>
                </p>
                {/* Barre de progression */}
                <div className="w-full h-3 rounded-lg bg-[rgba(77,80,87,0.5)]">
                  <div
                    className="h-3 rounded-lg bg-bg-1 shadow-[0px_0px_15.5px_5px_rgba(255,255,255,0.2)]"
                    style={{ width: `${Math.round((streakCount / 52) * 100)}%` }}
                  />
                </div>
              </div>
              {/* Jours de la semaine — couleurs dynamiques par catégorie */}
              <div className="flex items-center gap-3 mt-5">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
                const cat = weekDays[i]?.category
                const colors = cat ? CATEGORY_COLORS[cat] : null
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={colors
                        ? { backgroundColor: colors.bg, boxShadow: `0px 0px 24px 0px ${colors.glow}` }
                        : { backgroundColor: 'rgba(156,163,176,0.3)' }
                      }
                    >
                      {cat && <Check size={10} strokeWidth={3} className="text-tx-1" />}
                    </div>
                    <span
                      className="font-sans font-semibold text-xs"
                      style={{ color: colors ? colors.text : '#989da6' }}
                    >
                      {day}
                    </span>
                  </div>
                )
              })}
              </div>
            </div>
          </div>

          {/* Card 3 — Concept semaine (Figma 405:1595) — STATIQUE, jamais adaptatif */}
          <div className="bg-tx-1 rounded-[24px] overflow-hidden relative snap-start shrink-0 flex flex-col" style={{ width: 'calc(100vw - 32px)', scrollSnapStop: 'always' }}>
            {/* Contenu haut : toujours "1 séance" — c'est la règle de validation */}
            <div className="flex-1 flex items-center justify-center gap-4 px-5 pt-5 pb-2">
              {/* Haut du corps — toujours jaune */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-sans text-xs text-bg-1">1 séance</span>
                <div className="rounded-full px-3 py-2 flex items-center gap-1.5" style={{ backgroundColor: 'rgba(255,238,140,0.25)' }}>
                  <span className="font-sans font-semibold text-xs" style={{ color: '#ffee8c' }}>haut du corps</span>
                </div>
              </div>
              {/* & */}
              <span className="font-serif font-bold text-2xl text-[#989da6]">&</span>
              {/* Bas du corps — toujours bleu */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-sans text-xs text-bg-1">1 séance</span>
                <div className="bg-[rgba(80,127,255,0.25)] rounded-full px-3 py-2 flex items-center gap-1.5">
                  <span className="font-sans font-semibold text-xs text-[#507fff]">bas du corps</span>
                </div>
              </div>
            </div>
            {/* Bandeau bas */}
            <div className="relative h-[67px] bg-[rgba(12,12,12,0.5)]">
              <p className="absolute inset-0 flex items-center justify-center font-serif font-bold text-xl text-bg-1">
                Pour valider ta semaine !
              </p>
            </div>
          </div>
        </div>

        {/* Dots de pagination */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                activeSlide === i ? 'bg-tx-1' : 'bg-tx-3'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Séance du jour */}
      <div className="px-4 mt-3 flex-1 min-h-0 overflow-hidden flex flex-col">
        <h2 className="font-serif font-bold text-2xl text-tx-1 tracking-tight mb-3">
          {selectedDay === todayDayOfWeek ? 'Séance du jour' : 'Séance prévue'}
        </h2>

        {loading ? (
          <div className="h-[180px] bg-surface rounded-16 animate-pulse" />
        ) : todaysWorkout ? (
          <div>
            <WorkoutCard
              title={todaysWorkout.title}
              difficulty={todaysWorkout.difficulty}
              durationMin={todaysWorkout.duration_min}
              exerciseCount={todaysWorkout.workout_exercises?.length}
              imageUrl={todaysWorkout.image_url}
              category={todaysWorkout.category || 'upper'}
              isCompleted={isCompleted}
              onPlay={!isFuture ? () => navigate(`/workout/${todaysWorkout.id}`) : undefined}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* État vide — pas de séance */}
            <div
              className="bg-bg-2 rounded-[24px] flex-1 min-h-[100px] flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
              onClick={() => navigate('/programs')}
            >
              <p className="font-sans font-semibold text-base text-tx-2">
                Rien de prévu pour ce jour.
              </p>
              <p className="font-sans text-xs text-tx-2">Ajoute une séance</p>
            </div>

            {/* Carte bien-être */}
            <div
              className="bg-bg-2 rounded-[24px] flex-1 min-h-[100px] flex flex-col items-center justify-center gap-2 text-center border border-dashed border-tx-3 cursor-pointer"
              onClick={() => showToast('Étirements bientôt disponibles !', 'info')}
            >
              <p className="font-sans font-semibold text-base text-tx-2">
                Un peu de bien-être ?
              </p>
              <p className="font-sans text-xs text-tx-2">Ajoute un étirement</p>
            </div>
          </div>
        )}
      </div>

    </LightLayout>

      {/* Portals — rendus hors du LightLayout pour éviter le stacking context */}

      {/* Modale aperçu séance — Dark mode, Figma node 272:453 */}
      {showPreview && todaysWorkout && createPortal((() => {
        const cat = todaysWorkout.category || 'upper'
        const accentColor = CATEGORY_ACCENT[cat] || '#ffee8c'
        return (
          <div className="fixed inset-0 z-[9999] bg-dark-900 overflow-hidden">
            {/* Image hero fixe derrière */}
            <div data-hero-image className="absolute top-0 left-0 right-0 h-[308px] transition-opacity duration-300">
              {todaysWorkout.image_url && (
                <img src={todaysWorkout.image_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Bouton retour */}
            <button
              onClick={() => setShowPreview(false)}
              className="fixed left-4 z-[110] bg-tx-1 rounded-[24px] p-3 shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] cursor-pointer active:scale-95 transition-transform"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
              aria-label="Retour"
            >
              <ChevronLeft size={16} className="text-bg-1" />
            </button>

            {/* Contenu scrollable avec snap */}
            <div ref={snapRef} className="h-full overflow-y-auto no-scrollbar overscroll-none snap-y snap-mandatory scroll-smooth">
              {/* Spacer transparent — snap sur l'image */}
              <div className="h-[258px] shrink-0 snap-start snap-always" />

              {/* Carte contenu dark — snap dessus */}
              <div
                className="relative bg-dark-900 rounded-t-[24px] px-4 pt-4 pb-10 snap-start snap-always"
                style={{ paddingBottom: '140px' }}
              >
                {/* Handle / tiret */}
                <div className="flex justify-center mb-6">
                  <div className="w-8 h-[3px] rounded-full bg-[#3d4149]" />
                </div>

                {/* Badge difficulté */}
                <div
                  className="inline-flex items-center px-3 py-1.5 rounded-[8px] mb-2"
                  style={{
                    backgroundColor: `${accentColor}19`,
                    border: `1px solid ${accentColor}`,
                  }}
                >
                  <span
                    className="font-sans font-semibold text-xs uppercase"
                    style={{ color: accentColor }}
                  >
                    {todaysWorkout.difficulty || 'INTERMÉDIAIRE'}
                  </span>
                </div>

                {/* Titre */}
                <h2 className="font-serif font-bold text-[32px] text-bg-1 tracking-[-0.96px] leading-tight mb-2">
                  {todaysWorkout.title}
                </h2>

                {/* Description */}
                <p className="font-sans text-base text-bg-2 leading-6 mb-3">
                  {todaysWorkout.description || 'Prépare-toi mentalement. Intensité maximale !'}
                </p>

                {/* Stats — Durée + Exercices */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}40` }}
                    >
                      <Clock size={16} style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className="font-sans font-semibold text-xs text-tx-3 uppercase">Durée</p>
                      <p className="font-sans font-semibold text-base text-bg-1">{todaysWorkout.duration_min} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}40` }}
                    >
                      <Dumbbell size={16} style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className="font-sans font-semibold text-xs text-tx-3 uppercase">Exercices</p>
                      <p className="font-sans font-semibold text-base text-bg-1">{todaysWorkout.workout_exercises?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Titre section */}
                <h3 className="font-serif font-bold text-2xl text-bg-1 tracking-[-0.72px] mb-3">Exercices</h3>

                {/* Liste exercices */}
                <div className="flex flex-col gap-2">
                  {todaysWorkout.workout_exercises
                    ?.sort((a, b) => a.order_index - b.order_index)
                    .map((exo, index) => (
                      <ExerciseRow
                        key={index}
                        index={index + 1}
                        name={exo.exercise?.name || ''}
                        sets={exo.sets}
                        reps={exo.reps}
                        variant="dark"
                        accent={accentColor}
                        onPlay={() => handleOpenVideo(exo)}
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* CTA flottant avec gradient dark */}
            <div
              className="fixed bottom-0 left-0 right-0 z-[110] pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(to bottom, rgba(12,12,12,0) 0%, #0c0c0c 32%)' }}
            >
              <div className="px-6 pt-8 pointer-events-auto cta-bottom-safe">
                <button
                  onClick={() => navigate(`/workout/${todaysWorkout.id}`)}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-[12px] cursor-pointer active:scale-95 transition-transform font-sans font-semibold text-base"
                  style={{ backgroundColor: accentColor, color: '#1b1d1f', boxShadow: `0px 0px 20px 0px ${accentColor}4D` }}
                  aria-label="Commencer la séance"
                >
                  <Play size={16} fill="#1b1d1f" />
                  {isCompleted ? 'Refaire la séance' : 'Commencer ma séance'}
                </button>
              </div>
            </div>
          </div>
        )
      })(), document.body)}

      {/* Modale vidéo */}
      {videoModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <IconButton
            variant="dark"
            size={48}
            onClick={() => setVideoModal({ isOpen: false, url: null, title: '' })}
            className="absolute top-8 right-6"
            aria-label="Fermer la vidéo"
          >
            <X size={24} className="text-bg-1" />
          </IconButton>
          <h3 className="font-serif font-bold text-xl text-bg-1 mb-6 text-center px-8">
            {videoModal.title}
          </h3>
          <div className="w-full max-w-sm rounded-16 overflow-hidden border border-dark-700 bg-dark-900">
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
              <div className="h-64 flex items-center justify-center text-tx-secondary">
                Vidéo indisponible
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
