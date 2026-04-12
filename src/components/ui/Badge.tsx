import { cn } from '@/lib/utils'

type BadgeVariant = 'gold' | 'muted' | 'light'

interface BadgeProps {
  children: string
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: 'bg-[rgba(255,238,140,0.25)] border border-pr-1 text-pr-1',
  muted: 'bg-[#3d4149] text-[#989da6]',
  light: 'bg-surface border border-[#3d4149] text-[#3d4149]',
}

/** Badge de difficulté ou filtre (DÉBUTANT, INTERMÉDIAIRE, etc.) */
export default function Badge({ children, variant = 'gold', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-3 py-1.5 font-sans font-semibold text-xs uppercase',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
