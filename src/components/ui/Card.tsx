import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardVariant = 'light' | 'dark'

interface CardProps {
  children: ReactNode
  variant?: CardVariant
  className?: string
}

const variantStyles: Record<CardVariant, string> = {
  light: 'bg-white',
  dark: 'bg-tx-1',
}

/** Container arrondi avec variantes light/dark */
export default function Card({ children, variant = 'dark', className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-16 overflow-hidden',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}
