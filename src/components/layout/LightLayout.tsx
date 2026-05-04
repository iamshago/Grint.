import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LightLayoutProps {
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

/** Layout light mode — fond #f1f4fb. Toujours min-h-[100dvh] : le body scrolle naturellement. */
export default function LightLayout({ children, className, hideTabBar = false }: LightLayoutProps) {
  return (
    <div
      className={cn(
        'bg-bg-1 text-tx-1 safe-area-top min-h-[100dvh]',
        !hideTabBar && 'pb-tabbar',
        className,
      )}
    >
      {children}
    </div>
  )
}
