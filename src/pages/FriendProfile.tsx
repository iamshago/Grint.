// @ts-nocheck
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Clock, Dumbbell } from 'lucide-react'
import DarkLayout from '@/components/layout/DarkLayout'
import { supabase } from '@/lib/supabaseClient'
import { getAvatarById } from '@/lib/avatars'
import { useStreak, CATEGORY_ACCENT, DAY_LABELS } from '@/hooks/useStreak'

const CATEGORY_GLOW: Record<string, string> = {
  upper: 'rgba(255,238,140,0.15)',
  lower: 'rgba(80,127,255,0.15)',
  bbl: 'rgba(255,99,179,0.15)',
}

/** Formate une date en "20 FÉV" */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
  return `${day} ${month}`
}

/** Page profil d'un ami — Figma 390:1107 & 427:2225 */
export default function FriendProfile() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)

  // Profile
  const [profile, setProfile] = useState<any>(null)

  // Streak (via hook partagé)
  const { streakCount, weekDays } = useStreak(id)

  // PR
  const [highlightedPR, setHighlightedPR] = useState<{ name: string; weight: number; date: string } | null>(null)

  // Last / Active session
  const [lastSession, setLastSession] = useState<any>(null)
  const [activeSession, setActiveSession] = useState<any>(null)

  useEffect(() => {
    if (id) fetchFriendData(id)
  }, [id])

  async function fetchFriendData(friendId: string) {
    try {
      setLoading(true)

      // 1. Profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_id')
        .eq('id', friendId)
        .single()

      if (profileData) {
        setProfile(profileData)
      } else {
        // Fallback: essayer de trouver dans les fake friends
        setProfile({ id: friendId, username: 'ami', display_name: 'Ami', avatar_id: 'superman' })
      }

      // 2. Streak chargé via useStreak(id) automatiquement

      // 3. PR
      const { data: logs } = await supabase
        .from('user_progress')
        .select('*, exercise:exercises(name)')
        .eq('user_id', friendId)

      if (logs && logs.length > 0) {
        const maxPerExo: Record<string, { name: string; weight: number; date: string }> = {}
        logs.forEach((log) => {
          const exName = log.exercise?.name
          if (!exName) return
          if (!maxPerExo[exName] || log.weight_used > maxPerExo[exName].weight) {
            maxPerExo[exName] = { name: exName, weight: log.weight_used, date: log.created_at }
          }
        })
        const prList = Object.values(maxPerExo).sort((a, b) => b.weight - a.weight)
        setHighlightedPR(prList[0] || null)
      }

      // 4. Séance active (< 10 min)
      const twoHoursAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const { data: recentSessions } = await supabase
        .from('completed_workouts')
        .select('*, workouts(title, duration_min, category, workout_exercises(id))')
        .eq('user_id', friendId)
        .gte('completed_at', twoHoursAgo)
        .order('completed_at', { ascending: false })
        .limit(1)

      if (recentSessions && recentSessions.length > 0) {
        setActiveSession(recentSessions[0])
      }

      // 5. Dernière séance
      const { data: lastWorkouts } = await supabase
        .from('completed_workouts')
        .select('*, workouts(title, duration_min, category, workout_exercises(id))')
        .eq('user_id', friendId)
        .order('completed_at', { ascending: false })
        .limit(1)

      if (lastWorkouts && lastWorkouts.length > 0) {
        setLastSession(lastWorkouts[0])
      }
    } catch (err) {
      console.error('Erreur fetchFriendData:', err)
    } finally {
      setLoading(false)
    }
  }

  /** Couleur de la checkbox d'un jour */
  const getDayColor = (cat: string | null) => {
    if (!cat) return null
    return CATEGORY_ACCENT[cat] || '#ffee8c'
  }

  const streakProgress = Math.min(streakCount / 52, 1)

  if (loading) {
    return (
      <DarkLayout hideTabBar className="flex items-center justify-center">
        Chargement...
      </DarkLayout>
    )
  }

  const avatar = getAvatarById(profile?.avatar_id)
  const displayName = profile?.display_name || profile?.username || 'Ami'
  const usernameStr = profile?.username ? `@${profile.username}` : ''

  // Déterminer la session à afficher et si elle est "active"
  const isActive = !!activeSession
  const sessionToShow = activeSession || lastSession
  const sessionCategory = sessionToShow?.workouts?.category || 'upper'
  const accentColor = isActive ? (CATEGORY_ACCENT[sessionCategory] || '#ffee8c') : '#ffee8c'

  const lastSessionDate = sessionToShow
    ? formatShortDate(sessionToShow.completed_at)
    : ''

  return (
    <DarkLayout scrollable hideTabBar className="overflow-x-hidden pb-40">

      {/* ==================== BOUTON RETOUR ==================== */}
      <div className="px-[16px] pt-2">
        <button
          onClick={() => navigate('/profile/friends')}
          aria-label="Retour aux amis"
          className="bg-[#1b1d1f] p-[12px] rounded-[24px] flex items-center justify-center min-w-[44px] min-h-[44px]"
        >
          <ChevronLeft size={16} className="text-bg-1" />
        </button>
      </div>

      {/* ==================== AVATAR + NOM ==================== */}
      <div className="flex flex-col items-center pt-[16px] pb-[24px]">
        <div className="w-[124px] h-[124px] rounded-full overflow-hidden bg-tx-1 mb-[12px]">
          {avatar ? (
            <img src={avatar.src} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#3d4149]" />
          )}
        </div>
        <h1 className="font-serif font-bold text-[32px] text-bg-1 tracking-[-0.96px]">
          {displayName}
        </h1>
        {usernameStr && (
          <p className="font-serif font-bold text-[16px] text-tx-3 mt-[4px]">
            {usernameStr}
          </p>
        )}
      </div>

      {/* ==================== CONTENU ==================== */}
      <div className="px-[16px] flex flex-col gap-[16px]">

        {/* ---- CARTE STREAK ---- */}
        <div className="bg-tx-1 rounded-[16px] px-[16px] py-[12px] flex items-center justify-between h-[127px] overflow-hidden">
          {/* Flamme */}
          <div className="w-[64px] h-[78px] shrink-0 flex items-center justify-center">
            <img
              src="/assets/streak-flame.svg"
              alt="Streak flame"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Contenu droite */}
          <div className="flex flex-col gap-[16px] w-[246px]">
            <div className="flex flex-col gap-[8px]">
              <p className="text-bg-1 leading-none">
                <span className="font-sans font-bold text-[24px]">{streakCount} </span>
                <span className="font-sans font-normal text-[12px] text-tx-3">/ 52 semaines</span>
              </p>
              <div className="bg-[rgba(77,80,87,0.5)] h-[12px] rounded-[8px] w-full">
                <div
                  className="h-[12px] rounded-[8px] bg-bg-1 shadow-[0px_0px_15.5px_5px_rgba(255,255,255,0.2)]"
                  style={{ width: `${streakProgress * 100}%` }}
                />
              </div>
            </div>

            {/* Jours de la semaine */}
            <div className="flex items-center gap-[12px]">
              {DAY_LABELS.map((label, i) => {
                const color = getDayColor(weekDays[i]?.category)
                const hasWorkout = !!color
                return (
                  <div key={i} className="flex flex-col items-center gap-[4px]">
                    <div
                      className="w-[16px] h-[16px] rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: hasWorkout ? color : 'rgba(156,163,176,0.3)',
                        boxShadow: hasWorkout ? `0px 0px 24px 0px ${color}66` : 'none',
                      }}
                    >
                      {hasWorkout && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="#0c0c0c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="font-sans font-semibold text-[12px] text-center"
                      style={{ color: hasWorkout ? color : '#989da6' }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---- CARTE RECORD PERSONNEL ---- */}
        {highlightedPR ? (
          <div
            className="h-[122px] rounded-[16px] overflow-hidden relative"
            style={{ background: 'linear-gradient(to bottom, #1b1d1f, #0c0c0c)' }}
          >
            {/* Glow ellipse en bas */}
            <div
              className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[169px] h-[91px] rounded-full blur-[40px]"
              style={{ backgroundColor: 'rgba(255,238,140,0.15)' }}
            />
            {/* Icône biceps + titre */}
            <div className="absolute top-[16px] left-[16px] flex items-center gap-[6px]">
              <img src="/assets/biceps-icon.svg" alt="" className="w-[20px] h-[20px]" style={{ filter: 'brightness(0) saturate(100%) invert(93%) sepia(20%) saturate(1000%) hue-rotate(5deg) brightness(105%) contrast(101%)' }} />
              <span className="font-sans font-bold text-[20px] text-[#ffee8c]">Record personnel</span>
            </div>
            {/* Valeur PR */}
            <p className="absolute top-[59px] left-[calc(50%-84px)] leading-none">
              <span className="font-serif font-bold text-[56px] text-[#ffee8c]">
                {highlightedPR.weight}
              </span>
              <span className="font-sans font-normal text-[12px] text-[#ffee8c]"> Kg</span>
            </p>
            {/* Badge exercice */}
            <div className="absolute top-[67px] left-[calc(50%+49px)] -translate-x-1/2 bg-[#ffee8c] rounded-[8px] px-[12px] py-[6px]">
              <span className="font-sans font-semibold text-[16px] text-[#49452c]">
                {highlightedPR.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-[122px] rounded-[16px] overflow-hidden relative bg-black border-2 border-dashed border-[#3d4149]">
            <div className="absolute top-[12px] left-0 right-0 flex items-center justify-center gap-[5px]">
              <img src="/assets/biceps-icon.svg" alt="" className="w-[16px] h-[16px] shrink-0 opacity-60" />
              <span className="font-sans font-bold text-[14px] text-[#3d4149]">Record personnel</span>
            </div>
            <p className="absolute top-[64px] left-0 right-0 text-center font-sans font-normal text-[12px] text-tx-3">
              Aucun record
            </p>
          </div>
        )}

        {/* ---- DERNIÈRE SÉANCE ---- */}
        <h2 className="font-serif font-bold text-[24px] text-bg-1 tracking-[-0.72px]">
          Dernière séance
        </h2>

        {sessionToShow ? (
          isActive ? (
            /* ===== CARTE SÉANCE ACTIVE — bordure colorée + glow ===== */
            <div
              className="rounded-[16px] overflow-hidden relative"
              style={{
                border: `0.5px dashed ${accentColor}`,
                boxShadow: `0px 0px 20px 0px ${CATEGORY_GLOW[sessionCategory] || 'rgba(255,238,140,0.15)'}`,
              }}
            >
              {/* Overlay coloré en soft-light */}
              <div
                className="absolute inset-0 rounded-[16px] pointer-events-none"
                style={{ backgroundColor: accentColor, mixBlendMode: 'soft-light' }}
              />

              {/* Badge "Actuellement en séance" */}
              <div className="flex items-center gap-[6px] px-[16px] pt-[16px]">
                <span
                  className="w-[6px] h-[6px] rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <span
                  className="font-sans font-semibold text-[12px]"
                  style={{ color: accentColor }}
                >
                  Actuellement en séance
                </span>
              </div>

              {/* Titre */}
              <p
                className="font-serif font-bold text-[24px] px-[16px] pt-[8px]"
                style={{ color: accentColor }}
              >
                {sessionToShow.workouts?.title || 'Séance'}
              </p>

              {/* Durée + Exercices */}
              <div className="flex items-center gap-[16px] px-[16px] pt-[8px] pb-[16px]">
                <div className="flex items-center gap-[8px]">
                  <Clock size={16} style={{ color: accentColor, opacity: 0.6 }} />
                  <span className="font-sans text-[16px]" style={{ color: accentColor }}>
                    {sessionToShow.workouts?.duration_min || '?'} min
                  </span>
                </div>
                <div className="flex items-center gap-[8px]">
                  <Dumbbell size={16} style={{ color: accentColor, opacity: 0.6 }} />
                  <span className="font-sans text-[16px]" style={{ color: accentColor }}>
                    {sessionToShow.workouts?.workout_exercises?.length || '?'} exercices
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ===== CARTE DERNIÈRE SÉANCE CLASSIQUE ===== */
            <div className="bg-tx-1 rounded-[16px] h-[157px] overflow-hidden relative">
              {/* Titre + date */}
              <p className="absolute top-[16px] left-[16px] font-serif font-bold text-[24px] text-bg-1">
                {sessionToShow.workouts?.title || 'Séance'}
              </p>
              <p className="absolute top-[16px] right-[16px] font-sans font-bold text-[12px] text-tx-3">
                {lastSessionDate}
              </p>

              {/* Détails */}
              <div className="absolute top-[55px] left-[16px] flex items-center gap-[16px]">
                <div className="flex items-center gap-[8px]">
                  <Clock size={16} className="text-bg-1" />
                  <span className="font-sans text-[16px] text-bg-1">
                    {sessionToShow.workouts?.duration_min || '?'} min
                  </span>
                </div>
                <div className="flex items-center gap-[8px]">
                  <Dumbbell size={16} className="text-bg-1" />
                  <span className="font-sans text-[16px] text-bg-1">
                    {sessionToShow.workouts?.workout_exercises?.length || '?'} exercices
                  </span>
                </div>
              </div>

              {/* Barre info basse */}
              <div className="absolute bottom-0 left-0 right-0 h-[67px] bg-[rgba(12,12,12,0.5)]">
                {/* Calories icon */}
                <div className="absolute left-[16px] top-[17px] w-[32px] h-[32px] rounded-full bg-[rgba(255,238,140,0.25)] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1C8 1 3 5.5 3 9.5C3 12.5 5.2 14.5 8 14.5C10.8 14.5 13 12.5 13 9.5C13 5.5 8 1 8 1Z" fill="#ffee8c" opacity="0.6" />
                    <path d="M8 8C8 8 6 10 6 11.5C6 12.9 6.9 13.5 8 13.5C9.1 13.5 10 12.9 10 11.5C10 10 8 8 8 8Z" fill="#ffee8c" />
                  </svg>
                </div>
                {/* Calories text */}
                <div className="absolute left-[56px] top-[16px] flex flex-col gap-[2px]">
                  <span className="font-sans font-semibold text-[12px] text-tx-3">CALORIES</span>
                  <span className="font-sans font-semibold text-[16px] text-bg-1">
                    {sessionToShow.calories || 0} Kcal
                  </span>
                </div>

                {/* Record icon */}
                <div className="absolute left-[265px] top-[17px] w-[32px] h-[32px] rounded-full bg-[#ffee8c] flex items-center justify-center">
                  <img src="/assets/biceps-icon.svg" alt="" className="w-[16px] h-[16px]" />
                </div>
                {/* Record text */}
                <div className="absolute left-[305px] top-[16px] flex flex-col gap-[2px]">
                  <span className="font-sans font-semibold text-[12px] text-tx-3">RECORD</span>
                  <span className="font-sans font-semibold text-[16px] text-[#ffee8c]">
                    +{highlightedPR ? 1 : 0} PR
                  </span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="bg-tx-1 rounded-[16px] h-[100px] flex items-center justify-center">
            <p className="text-tx-3 text-[14px]">Aucune séance</p>
          </div>
        )}
      </div>
    </DarkLayout>
  )
}
