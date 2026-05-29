// @ts-nocheck
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, Dumbbell, ArrowLeft, X, Play, Check, Calendar, Target, Plus, FolderPlus, MoreVertical } from 'lucide-react'

import LightLayout from '@/components/layout/LightLayout'
import StickyPageHeader from '@/components/layout/StickyPageHeader'
import ProgramCard from '@/components/features/ProgramCard'
import WorkoutCard from '@/components/features/WorkoutCard'
import ExerciseRow from '@/components/features/ExerciseRow'
import UserProgramPreview from '@/components/features/UserProgramPreview'
import SwipeableDeleteRow from '@/components/features/SwipeableDeleteRow'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import TopFadeOverlay from '@/components/ui/TopFadeOverlay'
import ActionSheet from '@/components/ui/ActionSheet'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import { fetchUserPrograms, softDeleteUserWorkout } from '@/lib/myPrograms'

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
  const [userWorkouts, setUserWorkouts] = useState([])
  const [programs, setPrograms] = useState([])
  const [userPrograms, setUserPrograms] = useState([])
  const [previewUserProgramId, setPreviewUserProgramId] = useState(null)
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

  // FAB « + » : bottom sheet de création (programme / séance directe).
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  // Séance perso ciblée par le menu ⋮ (suppression).
  const [menuWorkout, setMenuWorkout] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  // Récupérer programmes (catalogue) + séances (catalogue) depuis Supabase en parallèle.
  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoading(true)
        const [workoutsRes, programsRes] = await Promise.all([
          supabase
            .from('workouts')
            .select(`*, workout_exercises (*, exercise:exercises (*))`)
            .eq('is_deleted', false),
          supabase
            .from('programs')
            .select('*')
            .order('display_order', { ascending: true }),
        ])
        if (workoutsRes.error) throw workoutsRes.error
        if (programsRes.error) throw programsRes.error
        setWorkouts(workoutsRes.data || [])
        setPrograms(programsRes.data || [])
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  // Programmes & séances persos de l'utilisateur.
  // - Programmes → carrousel (après le catalogue).
  // - Séances perso → fusionnées dans « Toutes les séances » + filtre « Mes séances ».
  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      try {
        const [progs, wkRes] = await Promise.all([
          fetchUserPrograms(user.id),
          supabase
            .from('user_workouts')
            .select('*, user_workout_exercises(*, exercise:exercises(*))')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false }),
        ])
        setUserPrograms(progs)
        if (wkRes.error) throw wkRes.error
        setUserWorkouts(wkRes.data || [])
      } catch (err) {
        console.error('Erreur données perso:', err)
      }
    }
    loadUserData()
  }, [])

  // Tag « Mes séances » caché tant que l'utilisateur n'a pas de séance perso.
  const hasUserWorkouts = userWorkouts.length > 0
  const filters = hasUserWorkouts
    ? ['All', 'Mes séances', 'Haut du corps', 'Bas du corps', 'Abdos']
    : ['All', 'Haut du corps', 'Bas du corps', 'Abdos']

  // Liste unifiée catalogue + perso. Les séances perso d'abord (mises en avant).
  const userItems = userWorkouts.map((w) => ({
    source: 'user',
    id: w.id,
    title: w.name,
    category: w.category || 'upper',
    imageUrl: w.image_url,
    durationMin: undefined,
    exerciseCount: w.user_workout_exercises?.length,
    difficulty: undefined,
    raw: w,
  }))
  const catalogItems = workouts.map((w) => ({
    source: 'catalog',
    id: w.id,
    title: w.title,
    category: w.category || 'upper',
    imageUrl: w.image_url,
    durationMin: w.duration_min,
    exerciseCount: w.workout_exercises?.length,
    difficulty: w.difficulty,
    raw: w,
  }))

  // Le tag « Mes séances » peut disparaître (suppression de la dernière séance
  // perso) alors qu'il est actif → on rebascule sur « Tout ».
  useEffect(() => {
    if (activeFilter === 'Mes séances' && userWorkouts.length === 0) {
      setActiveFilter('All')
    }
  }, [activeFilter, userWorkouts.length])

  // Filtrage des séances (catalogue par titre, perso par catégorie).
  const processedWorkouts = [...userItems, ...catalogItems].filter((item) => {
    const search = searchTerm.toLowerCase()
    if (search && !item.title.toLowerCase().includes(search)) return false
    if (activeFilter === 'All') return true
    if (activeFilter === 'Mes séances') return item.source === 'user'
    if (activeFilter === 'Haut du corps') {
      if (item.source === 'user') return item.category === 'upper'
      const t = item.title.toLowerCase()
      return t.includes('upper') || t.includes('push') || t.includes('pull')
    }
    if (activeFilter === 'Bas du corps') {
      if (item.source === 'user') return item.category === 'lower' || item.category === 'bbl'
      const t = item.title.toLowerCase()
      return t.includes('lower') || t.includes('leg') || t.includes('bbl')
    }
    if (activeFilter === 'Abdos') {
      if (item.source === 'user') return false
      const t = item.title.toLowerCase()
      return t.includes('abdos') || t.includes('circuit') || t.includes('core')
    }
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

      const isUser = selectedWorkout.__source === 'user'
      const plansToInsert = selectedDays.map((dayIndex) => ({
        user_id: user.id,
        day_of_week: dayIndex,
        source: isUser ? 'user' : 'catalog',
        workout_id: isUser ? null : selectedWorkout.id,
        user_workout_id: isUser ? selectedWorkout.id : null,
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

  // Libellé de catégorie pour le badge d'une séance perso (pas de difficulté).
  const CATEGORY_LABEL = { upper: 'Haut du corps', lower: 'Bas du corps', bbl: 'BBL' }

  // Normalise une séance perso vers la forme attendue par la modale détail.
  const openUserWorkout = (uw) => {
    setPreviewWorkout({
      id: uw.id,
      __source: 'user',
      title: uw.name,
      category: uw.category || 'upper',
      image_url: uw.image_url,
      detail_image_url: uw.image_url,
      difficulty: CATEGORY_LABEL[uw.category] || 'Séance',
      description: null,
      duration_min: null,
      workout_exercises: (uw.user_workout_exercises || []).map((e) => ({
        order_index: e.order_index,
        sets: e.sets,
        reps: e.reps,
        exercise: e.exercise,
      })),
    })
  }

  // Suppression (soft) d'une séance perso depuis le menu ⋮.
  const handleDeleteUserWorkout = async () => {
    if (!menuWorkout) return
    try {
      setDeleting(true)
      await softDeleteUserWorkout(menuWorkout.id)
      setUserWorkouts((prev) => prev.filter((w) => w.id !== menuWorkout.id))
      setMenuWorkout(null)
      // Si on supprimait depuis l'écran de détail, on le ferme.
      setPreviewWorkout((pw) => (pw && pw.id === menuWorkout.id ? null : pw))
      showToast('Séance supprimée.', 'success')
    } catch (err) {
      console.error(err)
      showToast('Erreur lors de la suppression.', 'error')
    } finally {
      setDeleting(false)
    }
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
    <LightLayout scrollable hideTabBar className="pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">
      {/* Easing gradient haut — 15 stops sigmoïde, zéro liseré (cf. Round 3). */}
      <TopFadeOverlay />

      {/* Toast */}
      {toast && (
        <div className="fixed toast-top-safe left-0 right-0 z-[300] flex justify-center px-4 pointer-events-none">
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

      {/* Header sticky — back + titre + recherche restent collés en haut au scroll.
       *  marginTop/paddingTop neutralisent le safe-area-top du LightLayout pour
       *  conserver un rendu identique en haut de page tout en couvrant la zone
       *  status bar quand le sticky s'active. */}
      <div
        className="sticky top-0 z-40 bg-bg-1 pb-6"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        }}
      >
        {/* Header — back button inline avec le titre, alignement vertical garanti */}
        <div className="px-4 pt-2 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            aria-label="Retour"
            className="bg-white rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform shadow-[0px_2px_8px_rgba(0,0,0,0.08)] shrink-0"
          >
            <ArrowLeft size={16} className="text-tx-1" />
          </button>
          <h1 className="font-serif font-bold text-xl text-tx-1 tracking-tight text-center flex-1 pr-[40px]">
            Programmer mes séances
          </h1>
        </div>

        {/* Barre de recherche */}
        <div className="px-4">
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
      </div>

      {/* Section Programmes — masquée pendant la recherche. La création passe
       *  désormais par le FAB « + » en bas à droite (cf. brief programs-hub-v2). */}
      {!searchTerm && (
        <div className="mb-8">
          <h2 className="font-serif font-bold text-2xl text-tx-1 tracking-tight px-4 mb-4">
            Programmes
          </h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pl-4 pr-4 pb-2">
            {programs.map((prog) => (
              <ProgramCard
                key={prog.id}
                title={prog.title}
                frequency={prog.frequency}
                imageUrl={prog.image_url || undefined}
                onClick={() => setPreviewProgram(prog)}
              />
            ))}

            {/* Programmes perso — après le catalogue, badge « Perso » pour les distinguer */}
            {userPrograms.map((up) => {
              const count = up.categories?.length ?? 0
              return (
                <ProgramCard
                  key={up.id}
                  title={up.name}
                  difficulty="Perso"
                  frequency={`${count} séance${count > 1 ? 's' : ''}`}
                  imageUrl={up.image_url || undefined}
                  onClick={() => setPreviewUserProgramId(up.id)}
                />
              )
            })}
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
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-3 rounded-full text-xs font-sans font-semibold shrink-0 cursor-pointer transition-colors ${
                activeFilter === filter
                  ? 'bg-tx-1 text-pr-1'
                  : 'bg-surface text-[#3d4149]'
              }`}
            >
              {filter === 'All' ? 'Tout' : filter}
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
            {processedWorkouts.map((item) => {
              const card = (
                <WorkoutCard
                  title={item.title}
                  difficulty={item.difficulty === 'Beginner' ? 'DÉBUTANT' : item.difficulty === 'Intermediate' ? 'INTERMÉDIAIRE' : item.difficulty === 'Advanced' ? 'AVANCÉ' : item.difficulty}
                  durationMin={item.durationMin}
                  exerciseCount={item.exerciseCount}
                  imageUrl={item.imageUrl}
                  category={item.category}
                  onPlay={() => (item.source === 'user' ? openUserWorkout(item.raw) : setPreviewWorkout(item.raw))}
                />
              )
              // Séances perso : swipe gauche → poubelle. Catalogue : carte simple.
              return item.source === 'user' ? (
                <SwipeableDeleteRow
                  key={`${item.source}-${item.id}`}
                  ariaLabel={`Supprimer ${item.title}`}
                  onDelete={() => setMenuWorkout(item.raw)}
                >
                  {card}
                </SwipeableDeleteRow>
              ) : (
                <div key={`${item.source}-${item.id}`}>{card}</div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB création — bas-droite, au-dessus de la liste qui scrolle. */}
      <button
        type="button"
        onClick={() => setCreateSheetOpen(true)}
        aria-label="Créer"
        className="fixed right-6 z-40 w-14 h-14 rounded-full bg-tx-1 flex items-center justify-center shadow-[0px_8px_24px_0px_rgba(31,32,33,0.32)] cursor-pointer active:scale-95 transition-transform"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        <Plus size={28} className="text-pr-1" />
      </button>

    </LightLayout>

      {/* === APERÇU PROGRAMME PERSO — composant dédié (carrousel → séances → planifier) === */}
      {previewUserProgramId && (
        <UserProgramPreview
          programId={previewUserProgramId}
          onClose={() => setPreviewUserProgramId(null)}
          onToast={showToast}
        />
      )}

      {/* === DÉTAIL PROGRAMME — header sticky + contenu scrollable, sans hero ni bottom sheet === */}
      {previewProgram && createPortal(
        <div className="fixed inset-0 z-[9999] bg-bg-1 flex flex-col">
          {/* Header sticky — composant partagé. Pas de menu sur cette page (le user
           *  ne s'inscrit pas à un programme, donc pas d'action contextuelle). */}
          <StickyPageHeader
            variant="light"
            title={previewProgram.title}
            subtitle={
              previewProgram.frequency
                ? previewProgram.frequency.replace('fois / semaine', 'fois / sem')
                : undefined
            }
            onBack={() => setPreviewProgram(null)}
          />

          {/* Contenu scrollable — pas de snap, pas de bottom sheet */}
          <div className="flex-1 overflow-y-auto no-scrollbar overscroll-none">
            <div
              className="px-4 flex flex-col gap-8"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}
            >
              {/* Description + stats — le titre vit uniquement dans le header sticky */}
              <div className="flex flex-col gap-3">
                <p className="font-sans text-base text-tx-1 leading-6">
                  {previewProgram.description}
                </p>

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
        </div>,
        document.body
      )}

      {/* === Bottom sheet création (FAB) === */}
      <ActionSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        ariaLabel="Que veux-tu créer ?"
        actions={[
          {
            label: 'Créer un programme',
            icon: <FolderPlus size={20} className="text-tx-1" />,
            onClick: () => {
              setCreateSheetOpen(false)
              navigate('/my-programs')
            },
          },
          {
            label: 'Créer une séance',
            icon: <Dumbbell size={20} className="text-tx-1" />,
            onClick: () => {
              setCreateSheetOpen(false)
              navigate('/workouts/new')
            },
          },
          { label: 'Annuler', variant: 'cancel', onClick: () => setCreateSheetOpen(false) },
        ]}
      />

      {/* === Menu ⋮ d'une séance perso (suppression) === */}
      <ActionSheet
        open={Boolean(menuWorkout)}
        onClose={() => !deleting && setMenuWorkout(null)}
        ariaLabel={menuWorkout ? `Options pour ${menuWorkout.name}` : 'Options de la séance'}
        actions={[
          {
            label: deleting ? 'Suppression…' : 'Supprimer la séance',
            variant: 'destructive',
            disabled: deleting,
            onClick: handleDeleteUserWorkout,
          },
          { label: 'Annuler', variant: 'cancel', disabled: deleting, onClick: () => setMenuWorkout(null) },
        ]}
      />

      {/* === Portals — rendus hors du LightLayout pour éviter le stacking context === */}

      {/* === MODALE DÉTAIL SÉANCE (Light — Planifier) === */}
      {previewWorkout && createPortal((() => {
        const accent = CATEGORY_ACCENT[previewWorkout.category] || '#ffee8c'
        return (
        <div className="fixed inset-0 z-[9999] bg-bg-1 overflow-hidden">
          {/* Image hero — sticky derrière le contenu */}
          <div data-hero-image className="absolute top-0 left-0 right-0 h-[308px] transition-opacity duration-300">
            {(previewWorkout.detail_image_url || previewWorkout.image_url) && (
              <img
                src={previewWorkout.detail_image_url || previewWorkout.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Bouton retour fixe */}
          <button
            onClick={() => setPreviewWorkout(null)}
            className="fixed left-4 z-[110] bg-white rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform fixed-top-button"
            aria-label="Retour"
          >
            <ArrowLeft size={16} className="text-tx-1" />
          </button>

          {/* Menu ⋮ — séances perso uniquement : suppression depuis le détail. */}
          {previewWorkout.__source === 'user' && (
            <button
              onClick={() => setMenuWorkout({ id: previewWorkout.id, name: previewWorkout.title })}
              className="fixed right-4 z-[110] bg-white rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform fixed-top-button"
              aria-label="Options de la séance"
            >
              <MoreVertical size={16} className="text-tx-1" />
            </button>
          )}

          {/* Contenu scrollable — CSS snap + fade image. Pas de TopFadeOverlay
           *  ici : il créait un liseré clair par-dessus le haut de l'image hero
           *  (le fade light bg-1 → transparent voilait le sujet de la photo). */}
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
                    {previewWorkout.duration_min != null && (
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
                    )}
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

