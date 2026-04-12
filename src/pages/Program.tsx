// @ts-nocheck
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, Dumbbell, ArrowLeft, X, Play, Check, Calendar, Target } from 'lucide-react'

import LightLayout from '@/components/layout/LightLayout'
import ProgramCard from '@/components/features/ProgramCard'
import WorkoutCard from '@/components/features/WorkoutCard'
import ExerciseRow from '@/components/features/ExerciseRow'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'

/** Couleur d'accent par catégorie de séance */
const CATEGORY_ACCENT: Record<string, string> = {
  upper: '#ffee8c',
  lower: '#507fff',
  bbl: '#ff63b3',
}

const PROGRAMS = [
  {
    id: 'ul',
    title: 'Upper / Lower',
    difficulty: 'Intermédiaire',
    frequency: '2 à 4 fois / semaine',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    description: "Sépare l'entraînement du haut et du bas du corps. Le compromis parfait pour optimiser la récupération tout en gardant une haute fréquence.",
    focus: ['Haut du corps', 'Bas du corps'],
    keywords: ['upper', 'lower'],
  },
  {
    id: 'bbl',
    title: 'BBL Bootcamp',
    difficulty: 'Intermédiaire',
    frequency: '2 à 4 fois / semaine',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    description: 'Un focus intensif sur le développement des fessiers et du bas du corps. Prépare-toi à transpirer.',
    focus: ['Fessiers', 'Jambes'],
    keywords: ['bbl', 'leg', 'women', 'woman'],
  },
  {
    id: 'ppl',
    title: 'Push Pull Legs',
    difficulty: 'Avancé',
    frequency: '3 à 6 fois / semaine',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    description: "Le programme de musculation par excellence. Divise le corps en mouvements de poussée, de tirage et focus jambes.",
    focus: ['Pecs/Triceps', 'Dos/Biceps', 'Jambes'],
    keywords: ['push', 'pull', 'leg'],
  },
  {
    id: 'fb',
    title: 'Full Body',
    difficulty: 'Débutant',
    frequency: '2 à 4 fois / semaine',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    description: "Travaille l'ensemble du corps à chaque séance. Parfait pour commencer ou si tu as un emploi du temps chargé.",
    focus: ['Corps complet', 'Fondations'],
    keywords: ['full', 'body', 'circuit'],
  },
]

const FILTERS = ['All', 'Haut du corps', 'Bas du corps', 'Abdos', 'Cardio']

const WEEKDAYS = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 0 },
]

export default function Program() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  // Modales
  const [previewProgram, setPreviewProgram] = useState(null)
  const [previewWorkout, setPreviewWorkout] = useState(null)
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedDays, setSelectedDays] = useState([])

  const [toast, setToast] = useState(null)
  const [videoModal, setVideoModal] = useState({ isOpen: false, url: null, title: '' })

  // Fade de l'image au scroll (ref callback)
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Récupérer les séances depuis Supabase
  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('workouts')
          .select(`*, workout_exercises (*, exercise:exercises (*))`)
        if (error) throw error
        setWorkouts(data || [])
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchWorkouts()
  }, [])

  // Filtrage des séances
  const processedWorkouts = workouts.filter((workout) => {
    const title = workout.title.toLowerCase()
    const search = searchTerm.toLowerCase()
    if (search && !title.includes(search)) return false
    if (activeFilter === 'All') return true
    if (activeFilter === 'Haut du corps')
      return title.includes('upper') || title.includes('push') || title.includes('pull')
    if (activeFilter === 'Bas du corps')
      return title.includes('lower') || title.includes('leg') || title.includes('bbl')
    if (activeFilter === 'Abdos')
      return title.includes('abdos') || title.includes('circuit') || title.includes('core')
    if (activeFilter === 'Cardio')
      return title.includes('cardio') || title.includes('hiit')
    return true
  })

  const getProgramWorkouts = (program) => {
    return workouts.filter((w) =>
      program.keywords.some((keyword) => w.title.toLowerCase().includes(keyword)),
    )
  }

  // Planification
  const handleScheduleMultiple = async () => {
    if (selectedDays.length === 0) return
    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return showToast('Tu dois être connecté !', 'error')

      const plansToInsert = selectedDays.map((dayIndex) => ({
        user_id: user.id,
        day_of_week: dayIndex,
        workout_id: selectedWorkout.id,
      }))

      const { error } = await supabase
        .from('workout_plan')
        .upsert(plansToInsert, { onConflict: 'user_id, day_of_week' })
      if (error) throw error

      setIsModalOpen(false)
      setSelectedDays([])
      setPreviewWorkout(null)
      showToast('Séance planifiée avec succès !', 'success')
    } catch (error) {
      showToast('Erreur lors de la sauvegarde.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openScheduleModal = (workout) => {
    setSelectedWorkout(workout)
    setIsModalOpen(true)
  }

  const handleOpenVideo = (exo) => {
    if (exo.exercise?.video_url && exo.exercise.video_url.length > 5) {
      setVideoModal({ isOpen: true, url: exo.exercise.video_url, title: exo.exercise.name })
    } else {
      showToast(`Vidéo bientôt disponible pour ${exo.exercise?.name || 'cet exercice'}`, 'info')
    }
  }

  return (
    <>
    <LightLayout hideTabBar scrollable className="pb-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-12 left-0 right-0 z-[300] flex justify-center px-4 pointer-events-none">
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-[rgba(208,253,62,0.1)] border-neon'
                : toast.type === 'error'
                  ? 'bg-[rgba(230,45,45,0.1)] border-[#e62d2d]'
                  : 'bg-white/80 border-border-light'
            }`}
          >
            {toast.type === 'success' && (
              <div className="bg-neon text-dark-900 rounded-full p-1">
                <Check size={14} strokeWidth={4} />
              </div>
            )}
            <span className="text-sm font-semibold text-tx-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Bouton back — fixed pour rester accessible */}
      <button
        onClick={() => navigate('/home')}
        aria-label="Retour"
        className="fixed left-4 z-40 bg-white rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform shadow-[0px_2px_8px_rgba(0,0,0,0.08)]"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      >
        <ArrowLeft size={16} className="text-tx-1" />
      </button>

      {/* Header */}
      <div className="px-4 pt-2 pb-4 flex items-center gap-4">
        {/* Espace pour le bouton fixed */}
        <div className="w-10 shrink-0" />
        <h1 className="font-serif font-bold text-xl text-tx-1 tracking-tight text-center flex-1 pr-10">
          Programmer mes séances
        </h1>
      </div>

      {/* Barre de recherche */}
      <div className="px-4 mb-6">
        <div className="relative flex items-center gap-3 bg-bg-2 rounded-12 px-4 py-5">
          <Search size={16} className="text-tx-2 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher une séance"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-base font-sans text-tx-1 placeholder-tx-2 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[#3d4149] cursor-pointer"
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Section Programmes */}
      {!searchTerm && (
        <div className="mb-8">
          <h2 className="font-serif font-bold text-2xl text-tx-1 tracking-tight px-4 mb-4">
            Programmes
          </h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pl-4 pr-4 pb-2">
            {PROGRAMS.map((prog) => (
              <ProgramCard
                key={prog.id}
                title={prog.title}
                difficulty={prog.difficulty}
                frequency={prog.frequency}
                imageUrl={prog.image}
                onClick={() => setPreviewProgram(prog)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section Toutes les séances */}
      <div className="px-4">
        <h2 className="font-serif font-bold text-2xl text-tx-1 tracking-tight mb-4">
          {searchTerm ? 'Résultats' : 'Toutes les séances'}
        </h2>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-4 px-4">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-3 rounded-full text-xs font-sans font-semibold shrink-0 cursor-pointer transition-colors ${
                activeFilter === filter
                  ? 'bg-tx-1 text-pr-1'
                  : 'bg-surface text-[#3d4149]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Liste des séances */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[168px] bg-surface rounded-16 animate-pulse" />
            ))}
          </div>
        ) : processedWorkouts.length === 0 ? (
          <div className="bg-surface rounded-16 p-10 text-center">
            <p className="font-sans text-tx-secondary text-sm">Aucune séance ne correspond.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-8">
            {processedWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                title={workout.title}
                difficulty={workout.difficulty === 'Beginner' ? 'DÉBUTANT' : workout.difficulty === 'Intermediate' ? 'INTERMÉDIAIRE' : workout.difficulty === 'Advanced' ? 'AVANCÉ' : workout.difficulty}
                durationMin={workout.duration_min}
                exerciseCount={workout.workout_exercises?.length}
                imageUrl={workout.image_url}
                category={workout.category || 'upper'}
                onPlay={() => setPreviewWorkout(workout)}
              />
            ))}
          </div>
        )}
      </div>

      {/* === MODALE PROGRAMME DÉTAIL === */}
      {previewProgram && (
        <div className="fixed inset-0 z-[80] bg-bg-1 overflow-hidden">
          {/* Image hero — sticky derrière le contenu */}
          <div data-hero-image className="absolute top-0 left-0 right-0 h-[308px] transition-opacity duration-300">
            <img
              src={previewProgram.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bouton retour fixe */}
          <button
            onClick={() => setPreviewProgram(null)}
            className="fixed top-[72px] left-4 z-[90] bg-white rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform"
            aria-label="Retour"
          >
            <ArrowLeft size={16} className="text-tx-1" />
          </button>

          {/* Contenu scrollable — CSS snap + fade image */}
          <div ref={snapRef} className="h-full overflow-y-auto no-scrollbar overscroll-none snap-y snap-mandatory scroll-smooth">
            <div className="h-[258px] shrink-0 snap-start snap-always" />

            <div className="relative bg-bg-1 rounded-t-[24px] shadow-[0px_0px_13px_0px_rgba(0,0,0,0.1)] px-4 pt-3 pb-10 snap-start snap-always">
              {/* Handle / tiret indicateur de scroll */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-bg-2" />
              </div>
              <div className="flex flex-col gap-8">
                {/* Header : badge + titre + description + stats */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Badge variant="light" className="self-start">
                      {previewProgram.difficulty}
                    </Badge>
                    <h2 className="font-serif font-bold text-[32px] text-tx-1 tracking-[-0.96px]">
                      {previewProgram.title}
                    </h2>
                    <p className="font-sans text-base text-tx-1 leading-6">
                      {previewProgram.description}
                    </p>
                  </div>

                  {/* Infos fréquence & focus */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[24px] bg-tx-1 flex items-center justify-center p-2">
                        <Calendar size={16} className="text-pr-1" />
                      </div>
                      <div>
                        <p className="font-sans font-semibold text-xs text-tx-3">FRÉQUENCE</p>
                        <p className="font-sans font-semibold text-base text-tx-1">
                          {previewProgram.frequency.replace('fois / semaine', 'fois /sem')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[24px] bg-tx-1 flex items-center justify-center p-2">
                        <Target size={16} className="text-pr-1" />
                      </div>
                      <div>
                        <p className="font-sans font-semibold text-xs text-tx-3">FOCUS</p>
                        <p className="font-sans font-semibold text-base text-tx-1 truncate max-w-[140px]">
                          {previewProgram.focus.join(' & ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Séances du programme */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-serif font-bold text-2xl text-tx-1 tracking-[-0.72px]">
                    Séances du programme
                  </h3>
                  <div className="flex flex-col gap-4">
                    {getProgramWorkouts(previewProgram).map((workout) => (
                      <WorkoutCard
                        key={workout.id}
                        title={workout.title}
                        difficulty={workout.difficulty === 'Beginner' ? 'DÉBUTANT' : workout.difficulty === 'Intermediate' ? 'INTERMÉDIAIRE' : workout.difficulty === 'Advanced' ? 'AVANCÉ' : workout.difficulty}
                        durationMin={workout.duration_min}
                        exerciseCount={workout.workout_exercises?.length}
                        imageUrl={workout.image_url}
                        category={workout.category || 'upper'}
                        onPlay={() => setPreviewWorkout(workout)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </LightLayout>

      {/* === Portals — rendus hors du LightLayout pour éviter le stacking context === */}

      {/* === MODALE DÉTAIL SÉANCE (Light — Planifier) === */}
      {previewWorkout && createPortal((() => {
        const accent = CATEGORY_ACCENT[previewWorkout.category] || '#ffee8c'
        return (
        <div className="fixed inset-0 z-[9999] bg-bg-1 overflow-hidden">
          {/* Image hero — sticky derrière le contenu */}
          <div data-hero-image className="absolute top-0 left-0 right-0 h-[308px] transition-opacity duration-300">
            {previewWorkout.image_url && (
              <img
                src={previewWorkout.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Bouton retour fixe */}
          <button
            onClick={() => setPreviewWorkout(null)}
            className="fixed left-4 z-[110] bg-white rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
            aria-label="Retour"
          >
            <ArrowLeft size={16} className="text-tx-1" />
          </button>

          {/* Contenu scrollable — CSS snap + fade image */}
          <div ref={snapRef} className="h-full overflow-y-auto no-scrollbar overscroll-none snap-y snap-mandatory scroll-smooth">
            <div className="h-[258px] shrink-0 snap-start snap-always" />

            <div className="relative bg-bg-1 rounded-t-[24px] shadow-[0px_0px_13px_0px_rgba(0,0,0,0.1)] px-4 pt-3 snap-start snap-always" style={{ paddingBottom: '120px' }}>
              {/* Handle / tiret indicateur de scroll */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-bg-2" />
              </div>
              <div className="flex flex-col gap-8">
                {/* Header : badge + titre + description + stats */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    {/* Badge difficulté */}
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg border border-tx-2 bg-bg-2 self-start">
                      <span className="font-sans font-semibold text-xs text-tx-2 uppercase">
                        {previewWorkout.difficulty === 'Beginner' ? 'DÉBUTANT' : previewWorkout.difficulty === 'Intermediate' ? 'INTERMÉDIAIRE' : previewWorkout.difficulty === 'Advanced' ? 'AVANCÉ' : previewWorkout.difficulty || 'GÉNÉRAL'}
                      </span>
                    </div>

                    <h2 className="font-serif font-bold text-[32px] text-tx-1 tracking-[-0.96px]">
                      {previewWorkout.title}
                    </h2>
                    <p className="font-sans text-base text-tx-1 leading-6">
                      {previewWorkout.description || 'Prépare-toi à tout donner sur cette séance.'}
                    </p>
                  </div>

                  {/* Stats — icônes accent dynamique */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[24px] bg-tx-1 flex items-center justify-center p-2">
                        <Clock size={16} style={{ color: accent }} />
                      </div>
                      <div>
                        <p className="font-sans font-semibold text-xs text-tx-3">DURÉE</p>
                        <p className="font-sans font-semibold text-base text-tx-1">
                          {previewWorkout.duration_min} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[24px] bg-tx-1 flex items-center justify-center p-2">
                        <Dumbbell size={16} style={{ color: accent }} />
                      </div>
                      <div>
                        <p className="font-sans font-semibold text-xs text-tx-3">EXERCICES</p>
                        <p className="font-sans font-semibold text-base text-tx-1">
                          {previewWorkout.workout_exercises?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exercices — regroupés dans un conteneur avec shadow */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-serif font-bold text-2xl text-tx-1 tracking-[-0.72px]">
                    Exercices
                  </h3>
                  <div className="flex flex-col gap-2">
                    {previewWorkout.workout_exercises
                      ?.sort((a, b) => a.order_index - b.order_index)
                      .map((exo, index) => (
                        <ExerciseRow
                          key={index}
                          index={index + 1}
                          name={exo.exercise?.name || ''}
                          sets={exo.sets}
                          reps={exo.reps}
                          variant="light"
                          accent={accent}
                          onPlay={() => handleOpenVideo(exo)}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA bottom — gradient fade + bouton accent dynamique */}
          <div className="fixed bottom-0 left-0 right-0 z-[110] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(to bottom, rgba(241,244,251,0) 0%, #f1f4fb 32%)' }}
          >
            <div className="px-6 pt-8 pointer-events-auto cta-bottom-safe">
              <button
                className="w-full flex items-center justify-center gap-3 bg-tx-1 font-sans font-semibold text-base p-4 rounded-12 shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] cursor-pointer active:scale-[0.98] transition-transform"
                style={{ color: accent }}
                onClick={() => openScheduleModal(previewWorkout)}
              >
                <Calendar size={16} />
                <span>Planifier cette séance</span>
              </button>
            </div>
          </div>
        </div>
        )
      })(), document.body)}

      {/* === MODALE PLANIFICATION JOURS === */}
      {isModalOpen && selectedWorkout && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-16 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif font-bold text-xl text-tx-1">Planifier</h3>
              <IconButton
                variant="ghost"
                size={36}
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedDays([])
                }}
                aria-label="Fermer"
                className="bg-surface"
              >
                <X size={18} className="text-tx-1" />
              </IconButton>
            </div>
            <p className="font-sans text-sm text-tx-secondary mb-4">
              Sélectionne un ou plusieurs jours pour{' '}
              <span className="font-bold text-tx-1">{selectedWorkout.title}</span> :
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {WEEKDAYS.map((day) => {
                const isSelected = selectedDays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    onClick={() => {
                      if (isSelected) setSelectedDays(selectedDays.filter((d) => d !== day.value))
                      else setSelectedDays([...selectedDays, day.value])
                    }}
                    className={`py-3 rounded-12 text-xs font-sans font-bold uppercase transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-tx-1 text-pr-1'
                        : 'bg-surface text-[#3d4149]'
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
              onClick={handleScheduleMultiple}
              disabled={saving || selectedDays.length === 0}
            >
              {saving ? 'Enregistrement...' : `Valider (${selectedDays.length})`}
            </Button>
          </div>
        </div>,
        document.body
      )}

      {/* === MODALE VIDÉO === */}
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

