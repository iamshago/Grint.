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
  if (scrollable) {
    // Outer shell fixe (pas de scroll) + inner scrollable pour éviter que le rubber-band iOS déplace la TabBar
    return (
      <div className="h-[100dvh] overflow-hidden bg-bg-1 text-tx-1 safe-area-top">
        <div
          className={cn(
            'h-full overflow-y-auto overscroll-none',
            !hideTabBar && 'pb-[120px]',
            className,
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-bg-1 text-tx-1 safe-area-top h-[100dvh] overflow-hidden',
        !hideTabBar && 'pb-[120px]',
        className,
      )}
    >
      {children}
    </div>
  )
}
