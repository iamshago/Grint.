import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type IconButtonVariant = 'gold' | 'dark' | 'ghost'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: IconButtonVariant
  size?: number
  className?: string
}

const variantStyles: Record<IconButtonVariant, string> = {
  gold: 'bg-[rgba(255,238,140,0.25)]',
  dark: 'bg-tx-1 shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)]',
  ghost: 'bg-transparent',
}

/** Bouton circulaire pour icônes (play, back, close) */
export default function IconButton({
  children,
  variant = 'gold',
  size = 40,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center justify-center rounded-full cursor-pointer transition-opacity active:opacity-80',
        variantStyles[variant],
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
    </button>
  )
}
