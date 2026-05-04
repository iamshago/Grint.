import { type ReactNode } from 'react'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StickyPageHeaderProps {
  /** Titre principal — affiché en serif bold 20px */
  title: string
  /** Sous-titre optionnel — affiché sous le titre, sans en haut si absent */
  subtitle?: ReactNode
  /** Action du bouton retour (gauche). Si non fourni → spacer (rare). */
  onBack?: () => void
  /** Action du bouton menu (droite). Si non fourni → spacer invisible w-10 pour conserver le centrage du titre. */
  onMenu?: () => void
  /** Mode visuel : light = fond bg-1 + boutons blancs, dark = fond #0c0c0c + boutons tx-1. */
  variant?: 'light' | 'dark'
  /** aria-label du bouton menu (par défaut "Plus d'actions"). */
  menuLabel?: string
  className?: string
}

/**
 * Header sticky réutilisable pour pages détail (programme, défi, séance, etc.).
 * Pattern unifié : back gauche, bloc titre+sous-titre centré entre les deux
 * boutons latéraux, menu optionnel droite (sinon spacer pour garder le centrage).
 *
 * Le composant gère le safe-area-top iOS et le fond opaque qui masque le
 * contenu qui scrolle dessous. À placer en premier enfant d'un conteneur
 * scrollable (LightLayout, DarkLayout, ou flex flex-col fixed inset-0).
 */
export default function StickyPageHeader({
  title,
  subtitle,
  onBack,
  onMenu,
  variant = 'light',
  menuLabel = "Plus d'actions",
  className,
}: StickyPageHeaderProps) {
  const isDark = variant === 'dark'
  const bgClass = isDark ? 'bg-[#0c0c0c]' : 'bg-bg-1'
  const buttonBgClass = isDark ? 'bg-tx-1' : 'bg-white'
  const iconColorClass = isDark ? 'text-bg-1' : 'text-tx-1'
  const titleColorClass = isDark ? 'text-bg-1' : 'text-tx-1'
  const subtitleColorClass = isDark ? 'text-tx-3' : 'text-tx-3'

  return (
    <header
      className={cn(
        'sticky top-0 z-20 px-4 pt-2 pb-4 flex items-center gap-3 safe-area-top shrink-0',
        bgClass,
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className={cn(
            'rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform shadow-[0px_2px_8px_rgba(0,0,0,0.08)] shrink-0',
            buttonBgClass,
          )}
        >
          <ArrowLeft size={16} className={iconColorClass} />
        </button>
      ) : (
        <div className="w-10 shrink-0" aria-hidden="true" />
      )}

      <div className="flex-1 flex flex-col items-center min-w-0">
        <h1
          className={cn(
            'font-serif font-bold text-xl tracking-tight truncate max-w-full leading-tight',
            titleColorClass,
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={cn('font-sans text-xs truncate max-w-full', subtitleColorClass)}>
            {subtitle}
          </p>
        )}
      </div>

      {onMenu ? (
        <button
          type="button"
          onClick={onMenu}
          aria-label={menuLabel}
          className={cn(
            'rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform shadow-[0px_2px_8px_rgba(0,0,0,0.08)] shrink-0',
            buttonBgClass,
          )}
        >
          <MoreVertical size={16} className={iconColorClass} />
        </button>
      ) : (
        <div className="w-10 shrink-0" aria-hidden="true" />
      )}
    </header>
  )
}
