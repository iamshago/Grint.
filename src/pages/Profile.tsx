// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import { Pencil, Check, X, LogOut, Trash2, ChevronRight, ChevronLeft, Clock, Dumbbell, Flame as FlameIcon } from 'lucide-react'
import SessionCard from '@/components/features/SessionCard'
import DarkLayout from '@/components/layout/DarkLayout'
import { useNavigate } from 'react-router-dom'
import { useAccent, CATEGORY_COLORS } from '@/lib/AccentContext'
import { AVATARS, getAvatarById, getDefaultAvatar } from '@/lib/avatars'
import { useStreak, CATEGORY_ACCENT, DAY_LABELS } from '@/hooks/useStreak'

export default function Profile() {
  const navigate = useNavigate()
  const { accent } = useAccent()
  const [loading, setLoading] = useState(true)

  // USER
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Athlète')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')
  const [selectedAvatarId, setSelectedAvatarId] = useState(localStorage.getItem('selectedAvatarId') || 'superman')
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [showUsernamePopup, setShowUsernamePopup] = useState(false)

  // STREAK (via hook partagé)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { streakCount, weekDays } = useStreak(currentUserId)

  // PR
  const [highlightedPR, setHighlightedPR] = useState<{ name: string; weight: number; date: string } | null>(null)
  const [allPRs, setAllPRs] = useState<{ name: string; weight: number; date: string }[]>([])

  // PR PICKER
  const [showPRPicker, setShowPRPicker] = useState(false)

  // PR HISTORY (pour le graphique d'évolution)
  const [prHistory, setPrHistory] = useState<{ weight: number; date: string }[]>([])
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null)

  // PERF TAB
  const [perfTab, setPerfTab] = useState<'frequency' | 'pr' | 'calories'>('frequency')

  // CALORIES par jour (semaine en cours)
  const [weekCalories, setWeekCalories] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [totalWeekCalories, setTotalWeekCalories] = useState(0)

  // LAST SESSION
  const [lastSession, setLastSession] = useState<any>(null)
  const [lastSessionPRCount, setLastSessionPRCount] = useState(0)

  // FRIENDS (vrais amis depuis la base — vide par défaut)
  const [friends, setFriends] = useState<{ id: string; avatarId: string; name: string }[]>([])

  /** Avatar sélectionné */
  const currentAvatar = getAvatarById(selectedAvatarId) || getDefaultAvatar()

  useEffect(() => {
    fetchProfileData()
    // Re-lire l'avatar au retour de la page AvatarPicker
    const handleFocus = () => {
      setSelectedAvatarId(localStorage.getItem('selectedAvatarId') || 'superman')
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  async function fetchProfileData() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Username — lire depuis la table profiles, fallback localStorage
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single()

      if (profileData?.username) {
        const formatted = `@${profileData.username}`
        setUsername(formatted)
        localStorage.setItem('username', formatted)
      } else {
        const savedUsername = localStorage.getItem('username')
        if (savedUsername) setUsername(savedUsername)
      }

      // Nom : priorité profiles.display_name > localStorage > Google metadata
      if (profileData?.display_name) {
        setUserName(profileData.display_name)
        localStorage.setItem('userName', profileData.display_name)
      } else {
        const savedName = localStorage.getItem('userName')
        if (savedName) {
          setUserName(savedName)
        } else {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Athlète'
          setUserName(fullName.split(' ')[0])
        }
      }

      // Streak chargé via useStreak(currentUserId) — on set juste l'ID ici
      setCurrentUserId(user.id)

      // Calories par jour (semaine en cours)
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      const { data: weekWithCals } = await supabase
        .from('completed_workouts')
        .select('completed_at, calories')
        .eq('user_id', user.id)
        .gte('completed_at', monday.toISOString())
        .lte('completed_at', sunday.toISOString())

      const calsPerDay = [0, 0, 0, 0, 0, 0, 0]
      weekWithCals?.forEach((cw) => {
        const d = new Date(cw.completed_at)
        const dow = (d.getDay() + 6) % 7
        calsPerDay[dow] += (cw.calories || 0)
      })
      setWeekCalories(calsPerDay)
      setTotalWeekCalories(calsPerDay.reduce((a, b) => a + b, 0))

      // --- PRs ---
      const { data: logs } = await supabase
        .from('user_progress')
        .select('*, exercise:exercises(name)')
        .eq('user_id', user.id)

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
        setAllPRs(prList)
        const savedPRName = localStorage.getItem('highlightedPR')
        setHighlightedPR(prList.find((pr) => pr.name === savedPRName) || prList[0])
      }

      // --- Last session ---
      const { data: lastWorkouts } = await supabase
        .from('completed_workouts')
        .select('*, workouts(title, duration_min, category, workout_exercises(id))')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)

      if (lastWorkouts && lastWorkouts.length > 0) {
        setLastSession(lastWorkouts[0])

        // Compter les PR battus lors de cette séance
        const sessionDay = new Date(lastWorkouts[0].completed_at).toISOString().split('T')[0]
        const { data: allLogs } = await supabase
          .from('user_progress')
          .select('exercise_id, weight_used, created_at')
          .eq('user_id', user.id)
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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /** Charger l'historique de poids pour un exercice donné */
  async function fetchPRHistory(exerciseName: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Trouver l'exercise_id par nom
      const { data: exercises } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', exerciseName)
        .limit(1)

      if (!exercises || exercises.length === 0) {
        setPrHistory([])
        setSelectedPointIdx(null)
        return
      }

      const exId = exercises[0].id

      // Récupérer tous les logs triés par date
      const { data: logs } = await supabase
        .from('user_progress')
        .select('weight_used, created_at')
        .eq('user_id', user.id)
        .eq('exercise_id', exId)
        .order('created_at', { ascending: true })

      if (!logs || logs.length === 0) {
        setPrHistory([])
        setSelectedPointIdx(null)
        return
      }

      // Garder le max weight par jour (une entrée par séance)
      const byDay: Record<string, { weight: number; date: string }> = {}
      logs.forEach((log) => {
        const day = new Date(log.created_at).toISOString().split('T')[0]
        if (!byDay[day] || log.weight_used > byDay[day].weight) {
          byDay[day] = { weight: log.weight_used, date: log.created_at }
        }
      })
      const history = Object.values(byDay).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setPrHistory(history)

      // Sélectionner le point max (= PR actuel)
      let maxIdx = 0
      history.forEach((h, i) => { if (h.weight >= history[maxIdx].weight) maxIdx = i })
      setSelectedPointIdx(maxIdx)
    } catch (err) {
      console.error('fetchPRHistory error:', err)
      setPrHistory([])
      setSelectedPointIdx(null)
    }
  }

  const handleSaveName = async () => {
    if (tempName.trim()) {
      setUserName(tempName)
      localStorage.setItem('userName', tempName)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Sauvegarder dans profiles.display_name (source de vérité)
        await supabase.from('profiles').update({ display_name: tempName }).eq('id', user.id)
      }
    }
    setIsEditingName(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleClearData = async () => {
    const conf = window.confirm("⚠️ Es-tu sûr de vouloir supprimer TOUTES tes données ?")
    if (!conf) return
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('user_progress').delete().eq('user_id', user.id)
        await supabase.from('completed_workouts').delete().eq('user_id', user.id)
        await supabase.from('workout_plan').delete().eq('user_id', user.id)
        localStorage.removeItem('highlightedPR')
        localStorage.removeItem('offline_workouts')
        alert("Données réinitialisées.")
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
      alert("Erreur.")
      setLoading(false)
    }
  }

  /** Couleur de la checkbox d'un jour */
  const getDayColor = (cat: string | null) => {
    if (!cat) return null
    return CATEGORY_ACCENT[cat] || '#ffee8c'
  }

  /** Barre de progression du streak */
  const streakProgress = Math.min(streakCount / 52, 1)

  if (loading) {
    return (
      <DarkLayout className="flex items-center justify-center">
        Chargement...
      </DarkLayout>
    )
  }


  return (
    <>
    <DarkLayout scrollable className="overflow-x-hidden">
      {/* ==================== AVATAR + NOM ==================== */}
      <div className="flex flex-col items-center pt-[16px] pb-[24px]">
        {/* Avatar 124px — cliquable pour changer */}
        <button
          onClick={() => navigate('/profile/avatar')}
          className="w-[124px] h-[124px] rounded-full overflow-hidden bg-tx-1 mb-[12px] relative group"
          aria-label="Changer de photo de profil"
        >
          <img src={currentAvatar.src} alt="Avatar" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Pencil size={24} className="text-bg-1" />
          </div>
        </button>

        {/* Nom + Edit */}
        {isEditingName ? (
          <div className="flex items-center gap-2 px-6">
            <input
              autoFocus
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder={userName}
              className="bg-tx-1 border border-[#3d4149] rounded-lg px-3 py-2 text-[32px] font-serif font-bold text-bg-1 w-48 focus:outline-none focus:border-[#ffee8c] text-center tracking-[-0.96px]"
            />
            <button
              onClick={handleSaveName}
              className="p-2 bg-[#ffee8c] text-tx-1 rounded-lg"
              aria-label="Sauvegarder le nom"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => setIsEditingName(false)}
              className="p-2 bg-tx-1 text-bg-1 rounded-lg"
              aria-label="Annuler"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-[4px]">
            <div className="flex items-center gap-[8px]">
              <h1 className="font-serif font-bold text-[32px] text-bg-1 tracking-[-0.96px]">
                {userName}
              </h1>
              <button
                onClick={() => { setTempName(userName); setIsEditingName(true) }}
                className="text-tx-3 hover:text-bg-1 transition-colors"
                aria-label="Modifier le nom"
              >
                <Pencil size={20} />
              </button>
            </div>
            {username && (
              <button
                onClick={() => setShowUsernamePopup(true)}
                className="font-serif font-bold text-[16px] text-tx-3 hover:text-bg-1 transition-colors"
                aria-label="Modifier le nom d'utilisateur"
              >
                {username.startsWith('@') ? username : `@${username}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==================== CONTENU SCROLLABLE ==================== */}
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
            {/* Compteur + barre */}
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
                    {/* Checkbox */}
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

        {/* ---- AMIS + PR ROW ---- */}
        <div className="flex gap-[16px]">
          {/* Carte Amis */}
          <button
            onClick={() => navigate('/profile/friends')}
            className="bg-tx-1 rounded-[16px] w-[123px] h-[122px] overflow-hidden relative shrink-0 text-left"
            aria-label="Voir mes amis"
          >
            {friends.length > 0 ? (
              <>
                {/* Avatars empilés */}
                <div className="absolute top-[16px] left-1/2 -translate-x-1/2 flex items-center pr-[18px]">
                  {friends.slice(0, 3).map((f, i) => {
                    const friendAvatar = getAvatarById(f.avatarId)
                    return (
                      <div
                        key={f.id}
                        className="w-[40px] h-[40px] rounded-full overflow-hidden border-0 border-[#3d4149] shrink-0"
                        style={{ marginRight: i < Math.min(friends.length, 3) - 1 ? '-18px' : 0, opacity: i === 0 && friends.length > 1 ? 0.4 : 1 }}
                      >
                        <img
                          src={friendAvatar?.src || '/assets/avatars/superman.png'}
                          alt={f.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )
                  })}
                </div>
                <p className="absolute top-[64px] left-1/2 -translate-x-1/2 font-sans font-bold text-[20px] text-bg-1 whitespace-nowrap">
                  Amis
                </p>
                <div className="absolute top-[92px] left-[22px] flex items-center gap-[6px]">
                  <div className="w-[6px] h-[6px] rounded-full bg-[#ffee8c]" />
                  <span className="font-sans font-semibold text-[12px] text-[#ffee8c]">{friends.length} connecté{friends.length > 1 ? 's' : ''}</span>
                </div>
              </>
            ) : (
              <>
                {/* État vide — aucun ami */}
                <div className="absolute top-[24px] left-1/2 -translate-x-1/2 w-[40px] h-[40px] rounded-full bg-[#3d4149] flex items-center justify-center">
                  <span className="text-tx-3 text-[24px] font-light leading-none">+</span>
                </div>
                <p className="absolute top-[72px] left-1/2 -translate-x-1/2 font-sans font-bold text-[16px] text-bg-1 whitespace-nowrap">
                  Amis
                </p>
                <p className="absolute top-[94px] left-0 right-0 text-center font-sans text-[11px] text-tx-3">
                  Ajouter des amis
                </p>
              </>
            )}
          </button>

          {/* Carte Record Personnel — cliquable → ouvre le picker */}
          {highlightedPR && highlightedPR.weight > 0 ? (
            <button
              onClick={() => setShowPRPicker(true)}
              className="flex-1 h-[122px] rounded-[16px] overflow-hidden relative text-left"
              style={{ background: 'linear-gradient(to bottom, #1b1d1f, #0c0c0c)' }}
              aria-label="Choisir un record personnel"
            >
              {/* Glow ellipse en bas */}
              <div
                className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[169px] h-[91px] rounded-full blur-[40px]"
                style={{ backgroundColor: 'rgba(255,238,140,0.15)' }}
              />
              {/* Icône biceps + titre */}
              <div className="absolute top-[14px] left-[12px] right-[12px] flex items-center gap-[5px]">
                <img src="/assets/biceps-icon.svg" alt="" className="w-[16px] h-[16px] shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(93%) sepia(20%) saturate(1000%) hue-rotate(5deg) brightness(105%) contrast(101%)' }} />
                <span className="font-sans font-bold text-[14px] text-[#ffee8c]">Record personnel</span>
              </div>
              {/* Valeur PR */}
              <p className="absolute top-[52px] left-[12px] leading-none">
                <span className="font-serif font-bold text-[48px] text-[#ffee8c]">
                  {highlightedPR.weight}
                </span>
                <span className="font-sans font-normal text-[12px] text-[#ffee8c]"> Kg</span>
              </p>
              {/* Badge exercice */}
              <div className="absolute top-[62px] right-[12px] bg-[#ffee8c] rounded-[8px] px-[10px] py-[5px] max-w-[50%]">
                <span className="font-sans font-semibold text-[12px] text-[#49452c] truncate block">
                  {highlightedPR.name}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowPRPicker(true)}
              className="flex-1 h-[122px] rounded-[16px] overflow-hidden relative bg-black border-2 border-dashed border-[#3d4149] text-left"
              aria-label="Choisir un record personnel"
            >
              {/* Icône + titre centrés ensemble */}
              <div className="absolute top-[12px] left-[12px] right-[12px] flex items-center justify-center gap-[5px]">
                <img src="/assets/biceps-icon.svg" alt="" className="w-[16px] h-[16px] shrink-0 opacity-60" />
                <span className="font-sans font-bold text-[14px] text-[#3d4149] whitespace-nowrap">Record personnel</span>
              </div>
              {/* Texte centré */}
              <p className="absolute top-[64px] left-[12px] right-[12px] text-center font-sans font-normal text-[12px] text-tx-3">
                Aucun record d'affiché
              </p>
            </button>
          )}
        </div>

        {/* ---- CONTAINER PERF ---- */}
        <div
          className="rounded-[16px] overflow-hidden relative"
          style={{ background: 'linear-gradient(to bottom, #1b1d1f, #0c0c0c)', minHeight: '354px' }}
        >
          {/* Tabs filtres — scroll horizontal */}
          <div className="flex gap-[8px] items-center px-[16px] pt-[16px] overflow-x-auto no-scrollbar">
            <PerfTab label="Fréquence" active={perfTab === 'frequency'} onClick={() => setPerfTab('frequency')} />
            <PerfTab label="Record personnel" active={perfTab === 'pr'} onClick={() => setPerfTab('pr')} />
            <PerfTab label="Calories" active={perfTab === 'calories'} onClick={() => setPerfTab('calories')} />
          </div>

          {/* ===== CONTENU DYNAMIQUE ===== */}
          <div className="px-[16px] pt-[16px] pb-[16px]">

            {/* --- TAB: Record personnel --- */}
            {perfTab === 'pr' && (
              <PRChartTab
                allPRs={allPRs}
                highlightedPR={highlightedPR}
                prHistory={prHistory}
                selectedPointIdx={selectedPointIdx}
                onSelectExercise={(pr) => {
                  setHighlightedPR(pr)
                  localStorage.setItem('highlightedPR', pr.name)
                  fetchPRHistory(pr.name)
                }}
                onSelectPoint={(idx) => setSelectedPointIdx(idx)}
              />
            )}

            {/* --- TAB: Calories --- */}
            {perfTab === 'calories' && (
              <>
                <p className="text-bg-1 leading-none mb-[4px]">
                  <span className="font-serif font-bold text-[48px]">{totalWeekCalories}</span>
                  <span className="font-sans font-normal text-[16px] text-tx-3"> </span>
                  <span className="font-sans font-semibold text-[12px] text-[#ffee8c]">Kcal</span>
                </p>
                <p className="font-sans text-[12px] text-tx-3 mb-[16px]">Dépense sur 7 jours</p>

                {/* Barres */}
                <div className="h-[150px] flex items-end justify-between px-[4px]">
                  {weekCalories.map((cal, i) => {
                    const maxCal = Math.max(...weekCalories, 1)
                    const h = Math.max((cal / maxCal) * 100, cal > 0 ? 8 : 0)
                    return (
                      <div key={i} className="flex flex-col items-center gap-[8px] flex-1">
                        <div
                          className="w-[12px] rounded-t-[16px]"
                          style={{ height: `${h}%`, backgroundColor: '#ffee8c', minHeight: cal > 0 ? 12 : 0 }}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Labels jours */}
                <div className="flex justify-between px-[4px] mt-[8px]">
                  {DAY_LABELS.map((d) => (
                    <span key={d} className="font-sans font-semibold text-[12px] text-bg-1 text-center flex-1">{d}</span>
                  ))}
                </div>
              </>
            )}

            {/* --- TAB: Fréquence (calendrier mensuel) --- */}
            {perfTab === 'frequency' && (
              <FrequencyCalendar weekDays={weekDays} />
            )}
          </div>
        </div>

        {/* ---- DERNIÈRE SÉANCE ---- */}
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-[24px] text-bg-1 tracking-[-0.72px]">
            Dernière séance
          </h2>
          <button
            onClick={() => navigate('/profile/history')}
            className="font-sans font-bold text-[16px] text-[#ffee8c] active:opacity-70"
            aria-label="Voir toutes les séances"
          >
            Voir toutes
          </button>
        </div>

        {lastSession ? (
          <SessionCard
            title={lastSession.workouts?.title || 'Séance'}
            date={lastSession.completed_at}
            durationMin={lastSession.duration_min || lastSession.workouts?.duration_min || 0}
            exerciseCount={lastSession.workouts?.workout_exercises?.length ?? 0}
            calories={lastSession.calories || 0}
            prCount={lastSessionPRCount}
          />
        ) : (
          <div className="bg-tx-1 rounded-[16px] h-[100px] flex items-center justify-center">
            <p className="text-tx-3 text-[14px]">Aucune séance terminée</p>
          </div>
        )}

        {/* ---- BOUTONS ACTION (64px depuis la carte Dernière séance) ---- */}
        <button
          onClick={handleClearData}
          className="w-full bg-[rgba(230,45,45,0.1)] border border-[#e62d2d] rounded-[12px] p-[16px] flex items-center justify-center gap-[12px] active:scale-95 transition-transform mt-[48px]"
          aria-label="Réinitialiser mes données"
        >
          <Trash2 size={16} className="text-[#e62d2d]" />
          <span className="font-sans font-semibold text-[16px] text-[#e62d2d]">
            Réinitialiser mes données
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-tx-1 rounded-[12px] p-[16px] flex items-center justify-center gap-[12px] active:scale-95 transition-transform"
          aria-label="Me déconnecter"
        >
          <LogOut size={16} className="text-bg-1" />
          <span className="font-sans font-semibold text-[16px] text-bg-1">
            Me déconnecter
          </span>
        </button>
      </div>

    </DarkLayout>

      {/* Portals — rendus hors du DarkLayout pour éviter le stacking context */}
      {showPRPicker && createPortal(
        <PRPickerModal
          allPRs={allPRs}
          currentPR={highlightedPR}
          onClose={() => setShowPRPicker(false)}
          onSelect={(pr) => {
            setHighlightedPR(pr)
            localStorage.setItem('highlightedPR', pr.name)
            setShowPRPicker(false)
          }}
        />,
        document.body
      )}

      {showUsernamePopup && createPortal(
        <UsernameEditPopup
          currentUsername={username}
          onClose={() => setShowUsernamePopup(false)}
          onSave={(newUsername) => {
            const formatted = `@${newUsername}`
            setUsername(formatted)
            localStorage.setItem('username', formatted)
            setShowUsernamePopup(false)
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                supabase.from('profiles').upsert({
                  id: user.id,
                  username: newUsername,
                }, { onConflict: 'id' }).then(() => {})
              }
            })
          }}
        />,
        document.body
      )}
    </>
  )
}

/** Composant tab filtre pour le container Perf */
function PerfTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-[6px] px-[16px] py-[12px] rounded-full shrink-0 transition-colors"
      style={{ backgroundColor: active ? '#ffee8c' : '#3d4149' }}
      aria-label={label}
    >
      <span
        className="font-sans font-semibold text-[12px] whitespace-nowrap"
        style={{ color: active ? '#1b1d1f' : '#f1f4fb' }}
      >
        {label}
      </span>
    </button>
  )
}

/** Popup de modification du nom d'utilisateur */
function UsernameEditPopup({
  currentUsername,
  onClose,
  onSave,
}: {
  currentUsername: string
  onClose: () => void
  onSave: (newUsername: string) => void
}) {
  const [value, setValue] = useState(currentUsername.replace(/^@/, ''))
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkAvailability = (username: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!username.trim() || username.trim().length < 3) {
      setAvailable(null)
      setError(username.trim().length > 0 ? 'Minimum 3 caractères' : '')
      return
    }
    setChecking(true)
    setError('')
    debounceRef.current = setTimeout(async () => {
      try {
        // Vérifier unicité dans la table profiles
        const { data, error: err } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username.trim())
          .limit(1)

        if (err) {
          // Table n'existe peut-être pas encore — considérer comme disponible
          setAvailable(true)
        } else if (data && data.length > 0) {
          // Vérifier si c'est le propre username de l'utilisateur
          const { data: { user } } = await supabase.auth.getUser()
          if (user && data[0].id === user.id) {
            setAvailable(true)
          } else {
            setAvailable(false)
          }
        } else {
          setAvailable(true)
        }
      } catch {
        setAvailable(true) // Fallback si pas de table
      } finally {
        setChecking(false)
      }
    }, 400)
  }

  const handleChange = (newVal: string) => {
    // Nettoyer : lowercase, pas d'espaces, alphanum + underscore
    const cleaned = newVal.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setValue(cleaned)
    checkAvailability(cleaned)
  }

  const handleSave = () => {
    if (available && value.trim().length >= 3) {
      onSave(value.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-[24px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Popup centré */}
      <div className="relative bg-[#1b1d1f] rounded-[24px] w-full max-w-[354px] p-[24px] flex flex-col gap-[16px]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-[8px] flex-1 pr-[12px]">
            <h2 className="font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px]">
              Nom d'utilisateur
            </h2>
            <p className="font-sans text-[16px] text-bg-1 leading-[22px]">
              Choisis un identifiant unique visible par tes amis.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="bg-[#3d4149] p-[12px] rounded-[24px] shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={16} className="text-bg-1" />
          </button>
        </div>

        {/* Input avec indicateur */}
        <div className="relative">
          <div className="flex items-center bg-[#3d4149] border rounded-[8px] overflow-hidden transition-colors"
            style={{
              borderColor: available === false ? '#e62d2d' : available === true ? '#22c55e' : '#989da6',
            }}
          >
            <span className="pl-[16px] font-sans text-[16px] text-tx-3">@</span>
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="ton_username"
              maxLength={24}
              className="bg-transparent p-[16px] pl-[4px] w-full text-[16px] text-bg-1 placeholder-tx-3 outline-none font-sans"
            />
            {/* Indicateur */}
            <div className="pr-[16px] shrink-0">
              {checking && (
                <div className="w-[20px] h-[20px] border-2 border-tx-3 border-t-transparent rounded-full animate-spin" />
              )}
              {!checking && available === true && (
                <Check size={20} className="text-[#22c55e]" />
              )}
              {!checking && available === false && (
                <X size={20} className="text-[#e62d2d]" />
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && <p className="font-sans text-[14px] text-[#e62d2d]">{error}</p>}
        {!checking && available === false && (
          <p className="font-sans text-[14px] text-[#e62d2d]">Ce nom d'utilisateur est déjà pris</p>
        )}
        {!checking && available === true && value.trim().length >= 3 && (
          <p className="font-sans text-[14px] text-[#22c55e]">Disponible !</p>
        )}

        {/* Bouton Valider */}
        <button
          onClick={handleSave}
          disabled={!available || value.trim().length < 3 || checking}
          className="rounded-[12px] p-[16px] w-full font-sans font-semibold text-[16px] transition-all"
          style={{
            backgroundColor: available && value.trim().length >= 3 ? '#ffee8c' : 'rgba(255,238,140,0.25)',
            color: available && value.trim().length >= 3 ? '#1b1d1f' : 'rgba(27,29,31,0.5)',
            cursor: available && value.trim().length >= 3 ? 'pointer' : 'default',
          }}
        >
          Valider
        </button>
      </div>
    </div>
  )
}

/** Onglet Record Personnel — graphique d'évolution style Figma 374:1769 */
function PRChartTab({
  allPRs,
  highlightedPR,
  prHistory,
  selectedPointIdx,
  onSelectExercise,
  onSelectPoint,
}: {
  allPRs: { name: string; weight: number; date: string }[]
  highlightedPR: { name: string; weight: number; date: string } | null
  prHistory: { weight: number; date: string }[]
  selectedPointIdx: number | null
  onSelectExercise: (pr: { name: string; weight: number; date: string }) => void
  onSelectPoint: (idx: number) => void
}) {
  // Données affichées : soit l'historique réel, soit le PR seul en un point
  const displayData = prHistory.length > 0
    ? prHistory
    : highlightedPR
      ? [{ weight: highlightedPR.weight, date: highlightedPR.date }]
      : []

  const activeIdx = selectedPointIdx ?? (displayData.length - 1)
  const activePoint = displayData[activeIdx] || null

  // Le poids affiché
  const displayWeight = activePoint?.weight ?? highlightedPR?.weight ?? 0
  const displayDate = activePoint?.date ?? highlightedPR?.date ?? ''

  // SVG chart dimensions
  const W = 338
  const H = 120
  const PAD_X = 16
  const PAD_Y = 12

  // Calculer les coordonnées des points
  const points = displayData.map((d, i) => {
    const x = displayData.length === 1
      ? W / 2
      : PAD_X + (i / (displayData.length - 1)) * (W - 2 * PAD_X)
    return { ...d, x, idx: i }
  })

  // Min / max pour l'échelle Y
  const weights = displayData.map(d => d.weight)
  const minW = Math.min(...weights) * 0.85
  const maxW = Math.max(...weights) * 1.1 || 1

  const yScale = (w: number) => {
    if (maxW === minW) return H / 2
    return H - PAD_Y - ((w - minW) / (maxW - minW)) * (H - 2 * PAD_Y)
  }

  const pointsWithY = points.map(p => ({ ...p, y: yScale(p.weight) }))

  // Construire le path SVG
  const linePath = pointsWithY.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${pointsWithY[pointsWithY.length - 1]?.x ?? W} ${H} L ${pointsWithY[0]?.x ?? 0} ${H} Z`

  const selectedPt = pointsWithY[activeIdx] || null

  return (
    <>
      {/* Poids en grand */}
      <p className="text-bg-1 leading-none mb-[4px]">
        <span className="font-serif font-bold text-[48px]">{displayWeight}</span>
        <span className="font-sans font-normal text-[16px] text-tx-3"> </span>
        <span className="font-sans font-semibold text-[12px] text-[#ffee8c]">kg</span>
      </p>
      <p className="font-sans text-[12px] text-tx-3 mb-[12px]">Record de la séance</p>

      {/* Pills exercices — scrollable horizontalement */}
      <div className="flex gap-[8px] overflow-x-auto no-scrollbar mb-[16px]">
        {allPRs.length > 0 ? allPRs.map((pr) => (
          <button
            key={pr.name}
            className="px-[12px] py-[6px] rounded-[8px] font-sans font-semibold text-[12px] uppercase whitespace-nowrap shrink-0"
            style={{
              backgroundColor: pr.name === highlightedPR?.name ? 'rgba(255,238,140,0.25)' : '#3d4149',
              border: pr.name === highlightedPR?.name ? '1px solid #ffee8c' : '1px solid transparent',
              color: pr.name === highlightedPR?.name ? '#ffee8c' : '#989da6',
            }}
            onClick={() => onSelectExercise(pr)}
          >
            {pr.name}
          </button>
        )) : (
          /* Aucun PR — afficher les exercices par défaut en gris */
          PR_EXERCISES_LIST.slice(0, 5).map((name) => (
            <div
              key={name}
              className="px-[12px] py-[6px] rounded-[8px] font-sans font-semibold text-[12px] uppercase whitespace-nowrap shrink-0 bg-[#3d4149] text-tx-3"
            >
              {name}
            </div>
          ))
        )}
      </div>

      {/* Graphique SVG — courbe d'évolution */}
      {displayData.length > 1 ? (
        <div className="relative" style={{ width: W, height: H + 40 }}>
          <svg width={W} height={H} className="overflow-visible">
            <defs>
              <linearGradient id="prGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffee8c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ffee8c" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gradient fill sous la courbe */}
            <path d={areaPath} fill="url(#prGradient)" />

            {/* Ligne de la courbe */}
            <path d={linePath} fill="none" stroke="#ffee8c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* Ligne pointillée verticale du point sélectionné */}
            {selectedPt && (
              <line
                x1={selectedPt.x} y1={selectedPt.y + 6}
                x2={selectedPt.x} y2={H + 20}
                stroke="#ffee8c" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"
              />
            )}

            {/* Points — cercles */}
            {pointsWithY.map((p, i) => (
              <g key={i} onClick={() => onSelectPoint(i)} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r="10" fill="transparent" /> {/* Zone cliquable agrandie */}
                <circle
                  cx={p.x} cy={p.y} r="4"
                  fill={i === activeIdx ? '#ffee8c' : 'transparent'}
                  stroke={i === activeIdx ? '#ffee8c' : '#989da6'}
                  strokeWidth={i === activeIdx ? 0 : 1.5}
                />
                {/* Glow autour du point sélectionné */}
                {i === activeIdx && (
                  <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="rgba(255,238,140,0.3)" strokeWidth="2" />
                )}
              </g>
            ))}
          </svg>

          {/* Date sous le graphique */}
          {displayDate && (
            <p
              className="absolute font-sans font-semibold text-[12px] text-bg-1 text-center whitespace-nowrap"
              style={{
                top: H + 24,
                left: selectedPt ? selectedPt.x : W / 2,
                transform: 'translateX(-50%)',
              }}
            >
              {new Date(displayDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      ) : displayData.length === 1 ? (
        /* Un seul point — afficher un point centré */
        <div className="relative" style={{ width: W, height: H + 40 }}>
          <svg width={W} height={H} className="overflow-visible">
            <circle cx={W / 2} cy={H / 2} r="5" fill="#ffee8c" />
            <circle cx={W / 2} cy={H / 2} r="9" fill="none" stroke="rgba(255,238,140,0.3)" strokeWidth="2" />
            <line x1={W / 2} y1={H / 2 + 8} x2={W / 2} y2={H + 20} stroke="#ffee8c" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          </svg>
          {displayDate && (
            <p className="absolute font-sans font-semibold text-[12px] text-bg-1 text-center whitespace-nowrap" style={{ top: H + 24, left: '50%', transform: 'translateX(-50%)' }}>
              {new Date(displayDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      ) : (
        /* Aucune donnée */
        <div className="flex items-center justify-center h-[160px]">
          <p className="text-tx-3 text-[14px]">Aucune donnée pour le moment</p>
        </div>
      )}
    </>
  )
}

/** Référence pour les pills par défaut quand aucun PR n'existe */
const PR_EXERCISES_LIST = ['Bench', 'Squat', 'Soulevé de terre', 'Curl biceps', 'Presse']

/** Liste d'exercices disponibles pour le PR — ordre fixe */
const PR_EXERCISES = [
  'Bench', 'Squat', 'Soulevé de terre',
  'Développé couché altère', 'Tirage vertical', 'Tirage horizontal',
  'Curl biceps', 'Extension triceps', 'Presse', 'Fente',
]

/** Modal de sélection du Record Personnel */
function PRPickerModal({
  allPRs,
  currentPR,
  onClose,
  onSelect,
}: {
  allPRs: { name: string; weight: number; date: string }[]
  currentPR: { name: string; weight: number; date: string } | null
  onClose: () => void
  onSelect: (pr: { name: string; weight: number; date: string }) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  // Map pour retrouver le PR data par nom d'exercice
  const prMap: Record<string, { name: string; weight: number; date: string }> = {}
  allPRs.forEach((pr) => { prMap[pr.name] = pr })

  const handleValidate = () => {
    if (!selected) return
    // Si l'exercice a un PR en base, l'utiliser ; sinon créer un placeholder à 0
    const pr = prMap[selected] || { name: selected, weight: 0, date: new Date().toISOString() }
    onSelect(pr)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0c0c] flex flex-col">
      {/* Header */}
      <div className="px-4 pb-4 pt-2 flex items-center shrink-0 safe-area-top">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform"
          aria-label="Fermer"
        >
          <X size={16} className="text-bg-1" />
        </button>
        <h1 className="flex-1 text-center font-serif font-bold text-xl text-bg-1 tracking-[-0.6px]">
          Record personnel
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Liste exercices */}
      <div className="flex-1 overflow-y-auto px-4 pb-[140px]">
        <p className="font-sans text-[14px] text-tx-3 mb-4">
          Choisis l'exercice à mettre en avant sur ton profil.
        </p>
        <div className="flex flex-col gap-[8px]">
          {PR_EXERCISES.map((exoName) => {
            const prData = prMap[exoName]
            const isSelected = selected === exoName
            const isCurrent = currentPR?.name === exoName

            return (
              <button
                key={exoName}
                onClick={() => setSelected(isSelected ? null : exoName)}
                className="w-full flex items-center justify-between px-[16px] py-[14px] rounded-[12px] transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: isSelected ? 'rgba(255,238,140,0.15)' : '#1b1d1f',
                  border: isSelected ? '1.5px solid #ffee8c' : '1.5px solid transparent',
                }}
                aria-label={`Sélectionner ${exoName}`}
              >
                <div className="flex items-center gap-[14px]">
                  {/* Poids PR affiché en grand, sans encart */}
                  <div className="flex items-baseline shrink-0 min-w-[48px]">
                    <span className="font-serif font-bold text-[32px] leading-none" style={{ color: isSelected ? '#ffee8c' : '#f1f4fb' }}>
                      {prData ? prData.weight : 0}
                    </span>
                    <span className="font-sans font-medium text-[12px] ml-[2px]" style={{ color: isSelected ? '#ffee8c' : '#989da6' }}>
                      kg
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-sans font-semibold text-[16px] text-bg-1">{exoName}</p>
                    {prData ? (
                      <p className="font-sans text-[12px] text-[#ffee8c]">Record personnel</p>
                    ) : (
                      <p className="font-sans text-[12px] text-tx-3">Pas encore de record</p>
                    )}
                  </div>
                </div>
                {/* Indicateur sélection */}
                <div
                  className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isSelected ? '#ffee8c' : 'transparent',
                    border: isSelected ? 'none' : '2px solid #3d4149',
                  }}
                >
                  {isSelected && <Check size={14} strokeWidth={3} className="text-[#1b1d1f]" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA Valider */}
      <div className="fixed bottom-0 left-0 right-0 z-[110] px-6 pt-4 cta-bottom-safe" style={{ background: 'linear-gradient(to bottom, rgba(12,12,12,0), #0c0c0c 32%)' }}>
        <button
          onClick={handleValidate}
          disabled={!selected}
          className="w-full p-[16px] rounded-[12px] font-sans font-semibold text-[16px] transition-all active:scale-95"
          style={{
            backgroundColor: selected ? '#ffee8c' : '#2c2c2e',
            color: selected ? '#1b1d1f' : '#6b7280',
            cursor: selected ? 'pointer' : 'default',
          }}
          aria-label="Valider le record personnel"
        >
          Valider
        </button>
      </div>
    </div>
  )
}

/** Calendrier mensuel pour l'onglet Fréquence — avec navigation par mois */
function FrequencyCalendar({ weekDays }: { weekDays: { category: string | null }[] }) {
  const today = new Date()
  const [monthOffset, setMonthOffset] = useState(0)

  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = displayDate.getFullYear()
  const month = displayDate.getMonth()
  const isCurrentMonth = monthOffset === 0

  // Nom du mois abrégé
  const monthLabel = displayDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

  // Jours du mois
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  // Décalage : lundi = 0
  const startOffset = (firstDay.getDay() + 6) % 7

  const dayHeaders = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']

  // Construire la grille
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // Remplir les semaines complètes
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (day: number) =>
    isCurrentMonth && day === today.getDate()

  return (
    <div className="flex flex-col gap-[2px] items-center">
      {/* Navigation mois */}
      <div className="flex items-center justify-between w-full mb-[8px]">
        <button
          onClick={() => setMonthOffset((o) => o - 1)}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: '#3d4149' }}
          aria-label="Mois précédent"
        >
          <ChevronLeft size={16} className="text-bg-1" />
        </button>
        <span className="font-sans font-semibold text-[14px] text-bg-1 capitalize">
          {monthLabel}
        </span>
        <button
          onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
          disabled={isCurrentMonth}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: isCurrentMonth ? '#2c2c2e' : '#3d4149', opacity: isCurrentMonth ? 0.4 : 1 }}
          aria-label="Mois suivant"
        >
          <ChevronRight size={16} className="text-bg-1" />
        </button>
      </div>

      {/* Headers jours */}
      <div className="flex w-full">
        {dayHeaders.map((d) => (
          <div key={d} className="flex-1 h-[40px] flex items-center justify-center">
            <span className="font-sans font-medium text-[16px] text-bg-1">{d}</span>
          </div>
        ))}
      </div>
      {/* Lignes de dates */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <div key={row} className="flex w-full">
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => (
            <div key={col} className="flex-1 h-[40px] flex items-center justify-center">
              {day !== null ? (
                <div
                  className="w-[40px] h-[40px] flex items-center justify-center"
                  style={{
                    backgroundColor: isToday(day) ? '#ffee8c' : 'transparent',
                    borderRadius: isToday(day) ? '50px' : '2px',
                  }}
                >
                  <span
                    className="font-sans font-medium text-[16px]"
                    style={{ color: isToday(day) ? '#1b1d1f' : '#989da6' }}
                  >
                    {day}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
