import { cn } from '@/lib/utils'

interface TopFadeOverlayProps {
  variant?: 'light' | 'dark'
  /** Hauteur supplémentaire au-delà du safe-area-top (par défaut 16px). */
  extraHeight?: number
  /** Z-index. Défaut 30 (liste) — passer à 100 dans une modale en portal. */
  zIndex?: number
  className?: string
}

/** Dégradé easing top — masque la zone status bar pendant le scroll, sans liseré.
 *  Utilise les classes utilitaires `scrim-top-light` / `scrim-top-dark` définies
 *  dans src/styles/index.css. */
export default function TopFadeOverlay({
  variant = 'light',
  extraHeight = 16,
  zIndex = 30,
  className,
}: TopFadeOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed top-0 left-0 right-0 pointer-events-none',
        variant === 'light' ? 'scrim-top-light' : 'scrim-top-dark',
        className,
      )}
      style={{
        height: `calc(env(safe-area-inset-top, 0px) + ${extraHeight}px)`,
        zIndex,
      }}
    />
  )
}
