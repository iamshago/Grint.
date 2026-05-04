import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DarkLayoutProps {
  children: ReactNode
  className?: string
  hideTabBar?: boolean
  /**
   * @deprecated Conservé pour compatibilité — n'a plus d'effet. Le body est
   * désormais le scroller naturel sur toutes les pages (fix TabBar iOS Safari).
   * Cf. memory/decisions.md 2026-05-04.
   */
  scrollable?: boolean
}

/** Layout dark mode — fond #0C0C0C. Toujours min-h-[100dvh] : le body scrolle naturellement. */
export default function DarkLayout({ children, className, hideTabBar = false }: DarkLayoutProps) {
  return (
    <div
      className={cn(
        'bg-[#0c0c0c] text-bg-1 font-sans safe-area-top min-h-[100dvh]',
        !hideTabBar && 'pb-tabbar',
        className,
      )}
    >
      {children}
    </div>
  )
}
