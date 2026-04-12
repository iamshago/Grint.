import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'cta' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  className?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-tx-1 text-pr-1 shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)]',
  cta: 'bg-pr-1 text-tx-1 shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)]',
  ghost: 'bg-transparent text-bg-1',
  danger: 'bg-[rgba(230,45,45,0.1)] text-[#e62d2d] border border-[#e62d2d]',
}

/** Bouton principal avec variantes design system Grint */
export default function Button({
  variant = 'primary',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center justify-center gap-3 rounded-12 p-4 font-sans font-semibold text-base cursor-pointer transition-opacity active:opacity-80',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
