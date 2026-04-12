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
  if (scrollable) {
    // Outer shell fixe (pas de scroll) + inner scrollable pour éviter que le rubber-band iOS déplace la TabBar
    return (
      <div className="h-[100dvh] overflow-hidden bg-[#0c0c0c] text-bg-1 font-sans safe-area-top">
        <div
          className={cn(
            'h-full overflow-y-auto overscroll-none',
            !hideTabBar && 'pb-40',
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
        'bg-[#0c0c0c] text-bg-1 font-sans safe-area-top h-[100dvh] overflow-hidden',
        !hideTabBar && 'pb-40',
        className,
      )}
    >
      {children}
    </div>
  )
}
