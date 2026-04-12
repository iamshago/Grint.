// @ts-nocheck
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Clock, Dumbbell } from 'lucide-react'
import DarkLayout from '@/components/layout/DarkLayout'
import { supabase } from '@/lib/supabaseClient'
import { getAvatarById } from '@/lib/avatars'
import { useStreak, CATEGORY_ACCENT, DAY_LABELS } from '@/hooks/useStreak'

/** Formate une date en "20 FÉV" */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
  return `${day} ${month}`
}

/** Page profil d'un ami — Figma 390:1107 */
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

  // Last session
  const [lastSession, setLastSession] = useState<any>(null)
  const [lastSessionPRCount, setLastSessionPRCount] = useState(0)

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
        setProfile({ id: friendId, username: 'ami', display_name: 'Ami', avatar_id: 'superman' })
      }

      // 2. Streak chargé via useStreak(id) automatiquement

      // 3. PR — user_progress est lisible publiquement
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

      // 4. Dernière séance (RLS autorise les amis via policy "Friends can view completed workouts")
      const { data: lastWorkouts } = await supabase
        .from('completed_workouts')
        .select('*, workouts(title, duration_min, category, workout_exercises(id))')
        .eq('user_id', friendId)
        .order('completed_at', { ascending: false })
        .limit(1)

      if (lastWorkouts && lastWorkouts.length > 0) {
        setLastSession(lastWorkouts[0])

        // Compter les PR battus lors de cette séance
        const sessionDay = new Date(lastWorkouts[0].completed_at).toISOString().split('T')[0]
        const { data: allLogs } = await supabase
          .from('user_progress')
          .select('exercise_id, weight_used, created_at')
          .eq('user_id', friendId)
          .order('created_at', { ascending: true })

        if (allLogs && allLogs.length > 0) {
          const maxByExo: Record<string, number> = {}
          let prOnDay = 0
          allLogs.forEach((log) => {
            const day = new Date(log.created_at).toISOString().split('T')[0]
            const prev = maxByExo[log.exercise_id] || 0
            if (log.weight_used > prev) {
              if (prev > 0 && day === sessionDay) prOnDay++
              maxByExo[log.exercise_id] = log.weight_used
            }
          })
          setLastSessionPRCount(prOnDay)
        }
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

  const sessionCategory = lastSession?.workouts?.category || 'upper'
  const lastSessionDate = lastSession ? formatShortDate(lastSession.completed_at) : ''

  return (
    <DarkLayout scrollable hideTabBar className="overflow-x-hidden pb-40">

      {/* ==================== BOUTON RETOUR ==================== */}
      <div className="px-[16px] pt-[8px]">
        <button
          onClick={() => navigate('/profile/friends')}
          aria-label="Retour aux amis"
          className="w-[44px] h-[44px] rounded-full bg-[#1b1d1f] flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-[#f1f4fb]" />
        </button>
      </div>

      {/* ==================== AVATAR + NOM ==================== */}
      <div className="flex flex-col items-center pt-[16px] pb-[24px]">
        {/* Avatar circulaire avec fond sombre */}
        <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-[#1b1d1f] mb-[16px]">
          {avatar ? (
            <img src={avatar.src} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#3d4149]" />
          )}
        </div>
        <h1 className="font-serif font-bold text-[32px] text-[#f1f4fb] leading-[1.1] tracking-[-0.96px]">
          {displayName}
        </h1>
        {usernameStr && (
          <p className="font-sans text-[14px] text-[#9ca3b0] mt-[4px]">
            {usernameStr}
          </p>
        )}
      </div>

      {/* ==================== CONTENU ==================== */}
      <div className="px-[16px] flex flex-col gap-[16px]">

        {/* ---- CARTE STREAK ---- */}
        <div className="bg-[#1b1d1f] rounded-[16px] px-[16px] py-[16px] flex items-center gap-[16px]">
          {/* Flamme */}
          <div className="w-[56px] h-[68px] shrink-0 flex items-center justify-center">
            <img
              src="/assets/streak-flame.svg"
              alt="Streak flame"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Contenu droite */}
          <div className="flex-1 flex flex-col gap-[12px]">
            {/* Nombre + barre */}
            <div className="flex flex-col gap-[8px]">
              <p className="text-[#f1f4fb] leading-none">
                <span className="font-sans font-bold text-[24px]">{streakCount} </span>
                <span className="font-sans font-normal text-[12px] text-[#9ca3b0]">/ 52 semaines</span>
              </p>
              <div className="bg-[rgba(77,80,87,0.5)] h-[12px] rounded-[8px] w-full">
                <div
                  className="h-[12px] rounded-[8px] bg-[#f1f4fb]"
                  style={{
                    width: `${streakProgress * 100}%`,
                    boxShadow: '0px 0px 15.5px 5px rgba(255,255,255,0.2)',
                  }}
                />
              </div>
            </div>

            {/* Jours de la semaine */}
            <div className="flex items-center justify-between">
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
                      className="font-sans font-semibold text-[10px] text-center"
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
            className="rounded-[16px] overflow-hidden relative px-[16px] pt-[16px] pb-[20px]"
            style={{ background: 'linear-gradient(180deg, #1b1d1f 0%, #0c0c0c 100%)' }}
          >
            {/* Glow ellipse en bas */}
            <div
              className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 w-[200px] h-[100px] rounded-full"
              style={{ backgroundColor: 'rgba(255,238,140,0.12)', filter: 'blur(40px)' }}
            />

            {/* Titre avec icône */}
            <div className="flex items-center gap-[6px] mb-[12px] relative z-10">
              <img
                src="/assets/biceps-icon.svg"
                alt=""
                className="w-[20px] h-[20px]"
                style={{ filter: 'brightness(0) saturate(100%) invert(93%) sepia(20%) saturate(1000%) hue-rotate(5deg) brightness(105%) contrast(101%)' }}
              />
              <span className="font-sans font-bold text-[20px] text-[#ffee8c]">Record personnel</span>
            </div>

            {/* Valeur PR + Badge */}
            <div className="flex items-end gap-[12px] relative z-10">
              <p className="leading-none">
                <span className="font-serif font-bold text-[56px] text-[#ffee8c]">
                  {highlightedPR.weight}
                </span>
                <span className="font-sans font-normal text-[14px] text-[#ffee8c] ml-[2px]">Kg</span>
              </p>
              <div className="bg-[#ffee8c] rounded-[8px] px-[12px] py-[6px] mb-[8px]">
                <span className="font-sans font-semibold text-[16px] text-[#49452c]">
                  {highlightedPR.name}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-[16px] overflow-hidden relative px-[16px] py-[20px]"
            style={{ background: 'linear-gradient(180deg, #1b1d1f 0%, #0c0c0c 100%)' }}
          >
            <div className="flex items-center gap-[6px] mb-[16px]">
              <img src="/assets/biceps-icon.svg" alt="" className="w-[20px] h-[20px] opacity-40" />
              <span className="font-sans font-bold text-[20px] text-[#3d4149]">Record personnel</span>
            </div>
            <p className="text-center font-sans font-normal text-[14px] text-[#9ca3b0]">
              Aucun record
            </p>
          </div>
        )}

        {/* ---- DERNIÈRE SÉANCE ---- */}
        <h2 className="font-serif font-bold text-[24px] text-[#f1f4fb] tracking-[-0.72px] mt-[8px]">
          Dernière séance
        </h2>

        {lastSession ? (
          <div className="bg-[#1b1d1f] rounded-[16px] overflow-hidden">
            {/* Header : titre + date */}
            <div className="px-[16px] pt-[16px] pb-[8px] flex items-start justify-between">
              <p className="font-serif font-bold text-[24px] text-[#f1f4fb] leading-[1.1]">
                {lastSession.workouts?.title || 'Séance'}
              </p>
              <p className="font-sans font-bold text-[12px] text-[#9ca3b0] mt-[6px] shrink-0 ml-[12px]">
                {lastSessionDate}
              </p>
            </div>

            {/* Durée + Exercices */}
            <div className="flex items-center gap-[16px] px-[16px] pb-[16px]">
              <div className="flex items-center gap-[6px]">
                <Clock size={16} className="text-[#9ca3b0]" />
                <span className="font-sans text-[16px] text-[#f1f4fb]">
                  {lastSession.workouts?.duration_min || '?'} min
                </span>
              </div>
              <div className="flex items-center gap-[6px]">
                <Dumbbell size={16} className="text-[#9ca3b0]" />
                <span className="font-sans text-[16px] text-[#f1f4fb]">
                  {lastSession.workouts?.workout_exercises?.length || '?'} exercices
                </span>
              </div>
            </div>

            {/* Barre info basse : Calories + Record */}
            <div className="h-[64px] bg-[rgba(12,12,12,0.5)] flex items-center px-[16px]">
              {/* Calories */}
              <div className="flex items-center gap-[8px] flex-1">
                <div className="w-[32px] h-[32px] rounded-full bg-[rgba(255,238,140,0.25)] flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1C8 1 3 5.5 3 9.5C3 12.5 5.2 14.5 8 14.5C10.8 14.5 13 12.5 13 9.5C13 5.5 8 1 8 1Z" fill="#ffee8c" opacity="0.6" />
                    <path d="M8 8C8 8 6 10 6 11.5C6 12.9 6.9 13.5 8 13.5C9.1 13.5 10 12.9 10 11.5C10 10 8 8 8 8Z" fill="#ffee8c" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-sans font-semibold text-[10px] text-[#9ca3b0] uppercase tracking-[0.5px]">Calories</span>
                  <span className="font-sans font-semibold text-[16px] text-[#f1f4fb] leading-tight">
                    {lastSession.calories || 0} Kcal
                  </span>
                </div>
              </div>

              {/* Record */}
              <div className="flex items-center gap-[8px]">
                <div className="w-[32px] h-[32px] rounded-full bg-[#ffee8c] flex items-center justify-center shrink-0">
                  <img src="/assets/biceps-icon.svg" alt="" className="w-[16px] h-[16px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-sans font-semibold text-[10px] text-[#9ca3b0] uppercase tracking-[0.5px]">Record</span>
                  <span className="font-sans font-semibold text-[16px] text-[#ffee8c] leading-tight">
                    +{lastSessionPRCount} PR
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#1b1d1f] rounded-[16px] h-[100px] flex items-center justify-center">
            <p className="text-[#9ca3b0] text-[14px]">Aucune séance</p>
          </div>
        )}
      </div>
    </DarkLayout>
  )
}
