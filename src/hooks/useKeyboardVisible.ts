import { useState, useEffect } from 'react'

/**
 * Détecte si le clavier virtuel iOS est ouvert via le visualViewport API.
 * Fallback sur focus/blur des inputs si visualViewport n'est pas dispo.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) {
      // Fallback : focus/blur sur les inputs
      const onFocus = (e: FocusEvent) => {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          setVisible(true)
        }
      }
      const onBlur = () => {
        setTimeout(() => setVisible(false), 100)
      }
      document.addEventListener('focusin', onFocus)
      document.addEventListener('focusout', onBlur)
      return () => {
        document.removeEventListener('focusin', onFocus)
        document.removeEventListener('focusout', onBlur)
      }
    }

    // Hauteur initiale du viewport (sans clavier)
    const initialHeight = vv.height

    const onResize = () => {
      // Si le viewport a rétréci de plus de 150px → clavier ouvert
      const keyboardOpen = initialHeight - vv.height > 150
      setVisible(keyboardOpen)
    }

    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  return visible
}
