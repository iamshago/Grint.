import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DarkLayoutProps {
  children: ReactNode
  className?: string
  hideTabBar?: boolean
  /** Active le scroll vertical. false = full-screen h-[100dvh] overflow-hidden */
  scrollable?: boolean
}

/** Layout dark mode — fond #0C0C0C */
export default function DarkLayout({ children, className, hideTabBar = false, scrollable = false }: DarkLayoutProps) {
  return (
    <div
      className={cn(
        'bg-[#0c0c0c] text-bg-1 font-sans safe-area-top',
        scrollable
          ? 'min-h-[100dvh] overflow-y-auto overscroll-none'
          : 'h-[100dvh] overflow-hidden',
        !hideTabBar && 'pb-tabbar',
        className,
      )}
      style={scrollable ? { WebkitOverflowScrolling: 'touch' } : undefined}
    >
      {children}
    </div>
  )
}
