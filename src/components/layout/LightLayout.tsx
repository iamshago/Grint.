import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LightLayoutProps {
  children: ReactNode
  className?: string
  hideTabBar?: boolean
  /** Active le scroll vertical. false = full-screen h-[100dvh] overflow-hidden */
  scrollable?: boolean
}

/** Layout light mode — fond #f1f4fb */
export default function LightLayout({ children, className, hideTabBar = false, scrollable = false }: LightLayoutProps) {
  return (
    <div
      className={cn(
        'bg-bg-1 text-tx-1 safe-area-top',
        scrollable
          ? 'min-h-[100dvh] overflow-y-auto overscroll-none'
          : 'h-[100dvh] overflow-hidden',
        !hideTabBar && 'pb-[120px]',
        className,
      )}
      style={scrollable ? { WebkitOverflowScrolling: 'touch' } : undefined}
    >
      {children}
    </div>
  )
}
