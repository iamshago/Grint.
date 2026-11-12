// @ts-nocheck
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import { Pencil, Check, X, LogOut, Trash2, Clock, Dumbbell, Flame as FlameIcon } from 'lucide-react'
import SessionCard from '@/components/features/SessionCard'
import DarkLayout from '@/components/layout/DarkLayout'
import TopFadeOverlay from '@/components/ui/TopFadeOverlay'
import { useNavigate } from 'react-router-dom'
import { useAccent } from '@/lib/AccentContext'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import { AVATARS, resolveAvatarSrc } from '@/lib/avatars'
import { firstNameOnly } from '@/lib/displayName'
import { useStreak, DAY_LABELS } from '@/hooks/useStreak'
import { useCollection } from '@/hooks/useCollection'
import CarteCollection from '@/components/features/collection/CarteCollection'
import CartePerformance from '@/components/features/profile/CartePerformance'
import { MOIS, type ExoRecord } from '@/components/features/profile/crete'

/**
 * Clé de jour 'YYYY-MM-DD' en fuseau LOCAL (pas UTC).
 * Découper en UTC ferait basculer une séance faite tard le soir au lendemain.
 */
function localDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Profile() {
  const navigate = useNavigate()
  const { accent } = useAccent()
  const [loading, setLoading] = useState(true)

  // USER
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Athlète')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')
  const [selectedAvatarId, setSelectedAvatarId] = useState(localStorage.getItem('selectedAvatarId') || 'superman')
  // Photo URL personnalisée (Supabase profiles.avatar_url) — prioritaire sur avatar_id
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null)
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

  // HISTORIQUE DES RECORDS (carte performance, record en profil d'altitude) : poids max de chaque séance
  const [exosRecords, setExosRecords] = useState<ExoRecord[]>([])

  // COLLECTION (médailles)
  const collection = useCollection(currentUserId)

  // CALORIES par jour (semaine en cours)
  const [weekCalories, setWeekCalories] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [totalWeekCalories, setTotalWeekCalories] = useState(0)

  // JOURS D'ENTRAÎNEMENT (calendrier Fréquence) — map 'YYYY-MM-DD' local → catégorie
  const [workoutDays, setWorkoutDays] = useState<Record<string, string>>({})

  // LAST SESSION
  const [lastSession, setLastSession] = useState<any>(null)
  const [lastSessionPRCount, setLastSessionPRCount] = useState(0)

  // FRIENDS (vrais amis depuis la base — vide par défaut)
  const [friends, setFriends] = useState<{ id: string; avatarId: string; avatarUrl: string | null; name: string }[]>([])
  const [pendingRequestCount, setPendingRequestCount] = useState(0)

  /** Source visuelle de l'avatar courant : avatar_id > avatar_url > défaut */
  const currentAvatarSrc = resolveAvatarSrc({ avatar_url: selectedAvatarUrl, avatar_id: selectedAvatarId })

  useEffect(() => {
    fetchProfileData()
    // Re-fetch après retour AvatarPicker (l'avatar a pu changer en base). Sans repasser par « Chargement… » :
    // la page reste en place et se met à jour (un jour de séance ajouté éclot dans le calendrier Fréquence).
    const handleFocus = () => {
      fetchProfileData(true)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  async function fetchProfileData(silencieux = false) {
    try {
      if (!silencieux) setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Username — lire depuis la table profiles, fallback localStorage
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_id, avatar_url')
        .eq('id', user.id)
        .single()

      // Avatar : Supabase = source de vérité, localStorage = cache miroir
      if (profileData?.avatar_id) {
        setSelectedAvatarId(profileData.avatar_id)
        try { localStorage.setItem('selectedAvatarId', profileData.avatar_id) } catch {}
      }
      // Photo URL personnalisée — uploadée ou OAuth — fallback si avatar_id est null
      setSelectedAvatarUrl(profileData?.avatar_url ?? null)

      if (profileData?.username) {
        const formatted = `@${profileData.username}`
        setUsername(formatted)
        localStorage.setItem('username', formatted)
      } else {
        const savedUsername = localStorage.getItem('username')
        if (savedUsername) setUsername(savedUsername)
      }

      // Nom : priorité profiles.display_name > localStorage > Google metadata
      // firstNameOnly en safety net : la DB est censée stocker déjà le prénom
      // (trigger BEFORE INSERT/UPDATE), mais on rogne aussi côté lecture pour
      // gérer les anciennes valeurs cachées en localStorage et les re-syncs.
      if (profileData?.display_name) {
        const cleaned = firstNameOnly(profileData.display_name)
        setUserName(cleaned)
        localStorage.setItem('userName', cleaned)
      } else {
        const savedName = localStorage.getItem('userName')
        if (savedName) {
          setUserName(firstNameOnly(savedName))
        } else {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Athlète'
          setUserName(firstNameOnly(fullName))
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

      // --- Jours d'entraînement (calendrier Fréquence) ---
      // category est dénormalisée sur completed_workouts (88/88 lignes remplies).
      // Pas de join : la colonne suffit. Tri desc → la séance la plus récente du
      // jour gagne si jamais il y en a plusieurs (sécurité, règle 1 séance/jour).
      const { data: allCompleted } = await supabase
        .from('completed_workouts')
        .select('completed_at, category')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })

      const dayMap: Record<string, string> = {}
      allCompleted?.forEach((cw) => {
        if (!cw.completed_at || !cw.category) return
        const key = localDayKey(new Date(cw.completed_at))
        if (!dayMap[key]) dayMap[key] = cw.category
      })
      setWorkoutDays(dayMap)

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

        // Historique par exercice : une séance par jour (heure locale), son poids max
        const parExo: Record<string, Record<string, { j: number; v: number; date: string }>> = {}
        logs.forEach((log) => {
          const exName = log.exercise?.name
          if (!exName || !(log.weight_used > 0)) return
          const d = new Date(log.created_at)
          const jour = localDayKey(d)
          const jours = (parExo[exName] = parExo[exName] || {})
          if (!jours[jour] || log.weight_used > jours[jour].v) {
            jours[jour] = { j: Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5, v: log.weight_used, date: `${d.getDate()} ${MOIS[d.getMonth()]}` }
          }
        })
        setExosRecords(prList.filter((pr) => parExo[pr.name]).map((pr) => ({
          nom: pr.name,
          seances: Object.values(parExo[pr.name]).sort((a, b) => a.j - b.j),
        })))
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

      // --- FRIENDS + PENDING REQUESTS ---
      const [acceptedRes, pendingRes] = await Promise.all([
        supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted'),
        supabase
          .from('friendships')
          .select('id')
          .eq('addressee_id', user.id)
          .eq('status', 'pending'),
      ])

      // Nombre de demandes en attente
      setPendingRequestCount(pendingRes.data?.length || 0)

      // Amis acceptés — récupérer profils pour les avatars
      const friendships = acceptedRes.data || []
      if (friendships.length > 0) {
        const friendIds = friendships.map((f) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        )
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_id, avatar_url')
          .in('id', friendIds)

        if (friendProfiles) {
          setFriends(
            friendProfiles.map((p) => ({
              id: p.id,
              avatarId: p.avatar_id || 'superman',
              avatarUrl: p.avatar_url || null,
              name: firstNameOnly(p.display_name) || p.username || 'Ami',
            }))
          )
        }
      } else {
        setFriends([])
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    // Règle métier : on ne stocke que le prénom (cf. BRIEF display-name-first-name-only).
    // firstNameOnly côté client évite le flicker "Marie Dupont" → "Marie" entre
    // l'écriture et le re-fetch ; le trigger DB est la garantie finale.
    const cleaned = firstNameOnly(tempName)
    if (cleaned) {
      setUserName(cleaned)
      localStorage.setItem('userName', cleaned)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Sauvegarder dans profiles.display_name (source de vérité)
        await supabase.from('profiles').update({ display_name: cleaned }).eq('id', user.id)
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

  if (loading || (currentUserId && collection.loading)) {
    return (
      <DarkLayout className="flex items-center justify-center">
        Chargement...
      </DarkLayout>
    )
  }


  return (
    <>
    <DarkLayout scrollable className="overflow-x-hidden">
      {/* Fade dark subtil — masque le contenu qui passe sous la status bar / Dynamic Island */}
      <TopFadeOverlay variant="dark" />
      {/* ==================== AVATAR + NOM ==================== */}
      <div className="flex flex-col items-center pt-[16px] pb-[24px]">
        {/* Avatar 124px — cliquable pour changer */}
        <button
          onClick={() => navigate('/profile/avatar')}
          className="w-[124px] h-[124px] rounded-full overflow-hidden bg-tx-1 mb-[12px] relative group"
          aria-label="Changer de photo de profil"
        >
          <img src={currentAvatarSrc} alt="Avatar" className="w-full h-full object-cover" />
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
            {/* Badge demandes en attente */}
            {pendingRequestCount > 0 && (
              <span className="absolute top-[8px] right-[8px] z-10 bg-[#FF3B30] text-white font-sans font-bold text-[11px] rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-[5px]">
                {pendingRequestCount}
              </span>
            )}
            {friends.length > 0 ? (
              <>
                {/* Avatars empilés */}
                <div className="absolute top-[16px] left-1/2 -translate-x-1/2 flex items-center pr-[18px]">
                  {friends.slice(0, 3).map((f, i) => {
                    const friendAvatarSrc = resolveAvatarSrc({ avatar_url: f.avatarUrl, avatar_id: f.avatarId })
                    return (
                      <div
                        key={f.id}
                        className="w-[40px] h-[40px] rounded-full overflow-hidden border-0 border-[#3d4149] shrink-0"
                        style={{ marginRight: i < Math.min(friends.length, 3) - 1 ? '-18px' : 0, opacity: i === 0 && friends.length > 1 ? 0.4 : 1 }}
                      >
                        <img
                          src={friendAvatarSrc}
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

        {/* ---- COLLECTION (maquette E1) ---- */}
        <CarteCollection medailles={collection.medailles.filter((m) => m.serie === 'regularite' || collection.defi)} onOuvrir={() => navigate('/profile/collection')} />

        {/* ---- CARTE PERFORMANCE (maquette O3 v2 : le record en profil d'altitude) ---- */}
        <CartePerformance
          workoutDays={workoutDays}
          calories={weekCalories}
          exos={exosRecords}
          exoActif={highlightedPR?.name ?? null}
          onChoisirExo={(nom) => {
            const pr = allPRs.find((p) => p.name === nom)
            if (!pr) return
            setHighlightedPR(pr)
            localStorage.setItem('highlightedPR', pr.name)
          }}
        />

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

  const handleValidate = () => {
    if (!selected) return
    const pr = allPRs.find((p) => p.name === selected)
    if (pr) onSelect(pr)
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

      {/* Liste exercices — uniquement ceux avec une entrée dans user_progress */}
      <div className="flex-1 overflow-y-auto px-4 pb-[140px]">
        <p className="font-sans text-[14px] text-tx-3 mb-4">
          Choisis l'exercice à mettre en avant sur ton profil.
        </p>
        {allPRs.length === 0 ? (
          <div className="bg-[#1b1d1f] rounded-[16px] h-[100px] flex items-center justify-center px-4">
            <p className="font-sans text-[14px] text-tx-3 text-center">
              Aucun record personnel pour le moment. Termine une séance avec un poids enregistré.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[8px]">
            {allPRs.map((pr) => {
              const isSelected = selected === pr.name
              const isCurrent = currentPR?.name === pr.name

              return (
                <button
                  key={pr.name}
                  onClick={() => setSelected(isSelected ? null : pr.name)}
                  className="w-full flex items-center justify-between px-[16px] py-[14px] rounded-[12px] transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,238,140,0.15)' : '#1b1d1f',
                    border: isSelected ? '1.5px solid #ffee8c' : '1.5px solid transparent',
                  }}
                  aria-label={`Sélectionner ${pr.name}`}
                >
                  <div className="flex items-center gap-[14px]">
                    {/* Poids PR affiché en grand, sans encart */}
                    <div className="flex items-baseline shrink-0 min-w-[48px]">
                      <span className="font-serif font-bold text-[32px] leading-none" style={{ color: isSelected ? '#ffee8c' : '#f1f4fb' }}>
                        {pr.weight}
                      </span>
                      <span className="font-sans font-medium text-[12px] ml-[2px]" style={{ color: isSelected ? '#ffee8c' : '#989da6' }}>
                        kg
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-sans font-semibold text-[16px] text-bg-1">{pr.name}</p>
                      <p className="font-sans text-[12px] text-[#ffee8c]">
                        {isCurrent ? 'Affiché sur ton profil' : 'Record personnel'}
                      </p>
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
        )}
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
