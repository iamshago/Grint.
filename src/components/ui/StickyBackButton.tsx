import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StickyBackButtonProps {
  /** Cible de navigation. Par défaut `-1` (retour historique). */
  to?: string | number
  ariaLabel?: string
  /** `dark` = fond `#1b1d1f` + flèche claire (défaut) ; `light` = fond `#1b1d1f` + flèche claire (idem, garde la cohérence). */
  variant?: 'dark' | 'light'
  /** Z-index — par défaut 40, sous TopFadeOverlay (30) ne fonctionne pas ; on est au-dessus pour rester cliquable. */
  zIndex?: number
  className?: string
}

/**
 * Bouton retour circulaire sticky en haut à gauche de l'écran.
 * Reste visible au scroll, position fixed en respectant le safe-area-top.
 * Doit être placé *après* le `<TopFadeOverlay />` pour rester cliquable au-dessus du fade.
 */
export default function StickyBackButton({
  to = -1,
  ariaLabel = 'Retour',
  zIndex = 40,
  className,
}: StickyBackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (typeof to === 'string') {
      navigate(to)
    } else {
      navigate(to)
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        'fixed left-[16px] bg-[#1b1d1f] p-[12px] rounded-[24px] flex items-center justify-center min-w-[44px] min-h-[44px] active:scale-95 transition-transform',
        className,
      )}
      style={{
        top: `calc(env(safe-area-inset-top, 0px) + 8px)`,
        zIndex,
      }}
    >
      <ChevronLeft size={16} className="text-bg-1" />
    </button>
  )
}
