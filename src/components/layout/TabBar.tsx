import { useRef, useEffect } from 'react'
import { Home, Users, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutGroup, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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

  const getActiveIndex = () =>
    tabs.findIndex((tab) =>
      tab.matchPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))
    )

  const activeIndex = getActiveIndex()

  // Déterminer si le tab actif a changé (pas juste une navigation intra-tab)
  const tabChanged = prevActiveIndex.current !== activeIndex && prevActiveIndex.current !== -1

  // Mettre à jour le ref APRÈS le render (pas pendant) pour éviter le bug StrictMode double-render
  useEffect(() => {
    prevActiveIndex.current = activeIndex
  })

  return (
    <div
      className={cn(
        'fixed left-1/2 z-50 tab-bar-position',
        'bg-tx-1 border border-tx-3 rounded-[24px] shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)]',
        'flex items-center h-[76px] w-[275px] p-[7px]',
        className,
      )}
      style={{ transform: 'translate(-50%, 0) translateZ(0)' }}
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
