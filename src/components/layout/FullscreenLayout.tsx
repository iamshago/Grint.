import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FullscreenLayoutProps {
  children: ReactNode
  className?: string
}

/** Layout fullscreen pour Workout Player — pas de TabBar */
export default function FullscreenLayout({ children, className }: FullscreenLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-dark-900 text-bg-1', className)}>
      {children}
    </div>
  )
}
