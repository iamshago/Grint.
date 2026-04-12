import { useRef, useEffect, useState } from 'react'
import { Home, Users, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutGroup, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible'

interface Tab {
  label: string
  icon: typeof Home
  path: string
  matchPaths: string[]
}

const tabs: Tab[] = [
  { label: 'Accueil', icon: Home, path: '/home', matchPaths: ['/', '/home'] },
  { label: 'Communauté', icon: Users, path: '/community', matchPaths: ['/community'] },
  { label: 'Profil', icon: User, path: '/profile', matchPaths: ['/profile', '/profile/friends', '/profile/history', '/stats', '/profile/friends/'] },
]

/** Bottom tab bar 3 tabs — Figma node 216:2537 */
export default function TabBar({ className }: { className?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const prevActiveIndex = useRef<number>(-1)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const keyboardVisible = useKeyboardVisible()

  // Attendre que le premier paint soit fait pour afficher la TabBar
  // (évite le flash de mauvaise position au lancement PWA)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReady(true)
      })
    })
  }, [])

  // Après fermeture du clavier, forcer un reflow de la TabBar uniquement
  // (pas de window.scrollTo qui cause des effets secondaires)
  useEffect(() => {
    const handleFocusOut = () => {
      setTimeout(() => {
        const el = tabBarRef.current
        if (el) {
          el.style.display = 'none'
          void el.offsetHeight // force reflow
          el.style.display = ''
        }
      }, 100)
    }
    document.addEventListener('focusout', handleFocusOut)
    return () => document.removeEventListener('focusout', handleFocusOut)
  }, [])

  const getActiveIndex = () =>
    tabs.findIndex((tab) =>
      tab.matchPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))
    )

  const activeIndex = getActiveIndex()
  const tabChanged = prevActiveIndex.current !== activeIndex && prevActiveIndex.current !== -1

  useEffect(() => {
    prevActiveIndex.current = activeIndex
  })

  // Cacher la TabBar quand le clavier iOS est ouvert
  if (keyboardVisible) return null

  return (
    <div
      ref={tabBarRef}
      className={cn(
        'fixed left-1/2 z-50 tab-bar-position',
        'bg-tx-1 border border-tx-3 rounded-[24px] shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)]',
        'flex items-center h-[76px] w-[275px] p-[7px]',
        className,
      )}
      style={{
        transform: 'translate(-50%, 0) translateZ(0)',
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}
    >
      <LayoutGroup>
        {tabs.map((tab, index) => {
          const active = index === activeIndex
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer relative h-full"
            >
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 bg-pr-1 rounded-16 shadow-[0px_0px_20px_0px_rgba(255,238,140,0.3)]"
                  transition={
                    tabChanged
                      ? { type: 'spring', stiffness: 500, damping: 35 }
                      : { duration: 0 }
                  }
                />
              )}
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 2}
                className={cn('relative z-10 transition-colors', active ? 'text-tx-1' : 'text-tx-3')}
              />
              <span
                className={cn(
                  'relative z-10 font-grotesk font-medium text-xs transition-colors',
                  active ? 'text-tx-1' : 'text-tx-3',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </LayoutGroup>
    </div>
  )
}
