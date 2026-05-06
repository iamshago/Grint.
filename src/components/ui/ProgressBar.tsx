import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  /** Étiquette accessible — sera lue par un screen reader. */
  ariaLabel: string
  /** Hauteur du remplissage en pixels (défaut 12). */
  thicknessPx?: number
  /** Classe Tailwind pour le track. Défaut `bg-tx-2` (dark mode). Pour un usage
   *  light-mode, passer `bg-surface` (#e6e8ed). */
  trackClassName?: string
  className?: string
}

/**
 * Barre de progression horizontale, remplissage `bg-pr-1` (gold) avec un léger
 * glow blanc. Track configurable via `trackClassName` (défaut adapté au dark).
 *
 * Le ratio est plafonné à 100%. Si > 0, on impose une largeur minimum 16px
 * pour rester visible en cas de très petite progression.
 */
export default function ProgressBar({
  value,
  max,
  ariaLabel,
  thicknessPx = 12,
  trackClassName = 'bg-tx-2',
  className,
}: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0
  const widthStyle = ratio > 0 ? `max(16px, ${ratio * 100}%)` : '0%'
  const safeMax = max > 0 ? max : 1
  const safeValue = Math.max(0, Math.min(value, safeMax))

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      className={cn('rounded-[8px] overflow-hidden', trackClassName, className)}
      style={{ height: thicknessPx }}
    >
      <div
        className="h-full rounded-[8px] bg-pr-1 shadow-[0px_0px_15.5px_5px_rgba(255,255,255,0.2)]"
        style={{ width: widthStyle }}
      />
    </div>
  )
}
