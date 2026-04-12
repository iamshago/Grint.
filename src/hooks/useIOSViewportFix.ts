import { useEffect } from 'react'

/**
 * Corrige le bug iOS PWA où les éléments fixed restent déplacés
 * après la fermeture du clavier virtuel.
 * Force un recalcul du viewport via window.scrollTo.
 */
export function useIOSViewportFix() {
  useEffect(() => {
    // Détecter iOS standalone mode (PWA)
    const isIOSPWA =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      (navigator as any).standalone === true

    if (!isIOSPWA) return

    const vv = window.visualViewport
    if (!vv) return

    let wasKeyboardOpen = false
    const initialHeight = vv.height

    const onResize = () => {
      const keyboardOpen = initialHeight - vv.height > 150

      if (wasKeyboardOpen && !keyboardOpen) {
        // Le clavier vient de se fermer — forcer le recalcul du viewport
        requestAnimationFrame(() => {
          window.scrollTo(0, document.documentElement.scrollTop)
          setTimeout(() => {
            window.scrollTo(0, 0)
          }, 50)
        })
      }

      wasKeyboardOpen = keyboardOpen
    }

    // Aussi corriger sur blur des inputs (fallback)
    const onFocusOut = () => {
      setTimeout(() => {
        window.scrollTo(0, document.documentElement.scrollTop || 0)
      }, 100)
    }

    vv.addEventListener('resize', onResize)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      vv.removeEventListener('resize', onResize)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])
}
