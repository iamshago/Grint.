import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import ThemeProvider from '@/components/layout/ThemeProvider'
import { AccentProvider } from '@/lib/AccentContext'
import TabBar from '@/components/layout/TabBar'

/** Routes où le TabBar ne doit PAS s'afficher */
const HIDE_TABBAR_ROUTES = ['/login', '/splash', '/workout', '/profile/avatar', '/onboarding', '/community/challenges']

/**
 * iOS Safari (hors-PWA) : au mount de l'app, déclencher un micro-scroll pour
 * forcer la barre d'URL à se masquer. Sans ça, le visual viewport reste court
 * et la TabBar fixed apparaît visuellement haute sur l'écran.
 *
 * Le body doit être scrollable (cf. index.css : html/body sans height fixe,
 * #root en min-height: 100dvh). On NE remet PAS scrollY à 0 — iOS Safari
 * réafficherait l'URL bar au scroll-up au-delà du sommet. 1px de scroll est
 * invisible et inoffensif.
 */
function useHideMobileUrlBarOnce() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isStandalone = (navigator as any).standalone === true
    if (!isIOS || isStandalone) return

    const t = setTimeout(() => {
      if (window.scrollY === 0 && document.documentElement.scrollHeight > window.innerHeight) {
        window.scrollTo(0, 1)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [])
}

/** TabBar persistant — unique instance pour conserver le layoutId Framer Motion */
function PersistentTabBar() {
  const location = useLocation()
  const hidden = HIDE_TABBAR_ROUTES.some((r) => location.pathname.startsWith(r))
  if (hidden) return null
  return <TabBar />
}

// Pages
import Home from './pages/Home'
import Program from './pages/Program'
import WorkoutSession from './pages/WorkoutSession'
import Stats from './pages/Stats'
import Login from './pages/Login'
import Profile from './pages/Profile'
import AvatarPicker from './pages/AvatarPicker'
import Friends from './pages/Friends'
import FriendProfile from './pages/FriendProfile'
import SessionHistory from './pages/SessionHistory'
import OnboardingUsername from './pages/OnboardingUsername'
import Community from './pages/Community'
import ChallengeDetail from './pages/ChallengeDetail'
import ChallengeJoin from './pages/ChallengeJoin'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasUsername, setHasUsername] = useState<boolean | null>(null)

  useHideMobileUrlBarOnce()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkUsername(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkUsername(session.user.id)
      } else {
        setHasUsername(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUsername(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      setHasUsername(!!(data?.username))
    } catch {
      setHasUsername(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-pr-1 font-bold font-sans">
        Chargement...
      </div>
    )
  }

  // Pas connecté → login
  if (!session) {
    return (
      <Router>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ThemeProvider>
      </Router>
    )
  }

  // Connecté mais pas de username → onboarding
  if (hasUsername === false) {
    return (
      <Router>
        <ThemeProvider>
          <Routes>
            <Route path="/onboarding/username" element={<OnboardingUsername />} />
            <Route path="*" element={<Navigate to="/onboarding/username" replace />} />
          </Routes>
        </ThemeProvider>
      </Router>
    )
  }

  return (
    <Router>
      <AccentProvider>
      <ThemeProvider>
        <Routes>
          {/* Light mode */}
          <Route path="/home" element={<Home />} />
          <Route path="/programs" element={<Program />} />
          <Route path="/programs/:id" element={<Program />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/community/challenges/:id/join" element={<ChallengeJoin />} />

          {/* Dark mode */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/friends" element={<Friends />} />
          <Route path="/profile/friends/:id" element={<FriendProfile />} />
          <Route path="/profile/history" element={<SessionHistory />} />
          <Route path="/stats" element={<Stats />} />

          {/* Fullscreen (pas de TabBar) */}
          <Route path="/workout/:id" element={<WorkoutSession />} />
          <Route path="/profile/avatar" element={<AvatarPicker />} />

          {/* Redirects */}
          <Route path="/login" element={<Navigate to="/home" replace />} />
          <Route path="/onboarding/*" element={<Navigate to="/home" replace />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <PersistentTabBar />
      </ThemeProvider>
      </AccentProvider>
    </Router>
  )
}
