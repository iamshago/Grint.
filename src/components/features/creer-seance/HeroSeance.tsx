import { useEffect, useRef, useState } from 'react'
import { IconeImagePlus } from './icones'
import './creer-seance.css'

interface HeroSeanceProps {
  /** Image de couverture, ou null : la zone reste grise avec le bouton « Image ». */
  image: string | null
  /** Ouvre la feuille d'images. */
  onOuvrir: () => void
  /** Texte du bouton (jaune ; rose pour une séance BBL). */
  couleur?: string
}

/**
 * Haut d'une séance perso (planches F3 / F4 / G1) : 308 px, gris clair tant qu'il n'y a pas d'image,
 * bouton « Image » au centre. Quand une image arrive, elle apparaît en dézoomant (1.08 → 1)
 * et le bouton s'efface.
 */
export default function HeroSeance({ image, onOuvrir, couleur = '#ffee8c' }: HeroSeanceProps) {
  // Image déjà là au montage (séance existante) : affichée d'emblée, sans animation.
  const [pleine, setPleine] = useState(Boolean(image))
  const avant = useRef(image)

  useEffect(() => {
    const etaitVide = !avant.current
    avant.current = image
    if (!image) {
      setPleine(false)
      return
    }
    if (!etaitVide) return
    let r2 = 0
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setPleine(true))
    })
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
    }
  }, [image])

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 308, background: '#e3e7ef', overflow: 'hidden' }}>
      {image && (
        <img
          className={`f3-hero ${pleine ? 'f3-pleine' : ''}`}
          src={image}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
      <button
        type="button"
        className={`f3-ajout f3-touche ${image ? 'f3-cache' : ''}`}
        onClick={onOuvrir}
        tabIndex={image ? -1 : 0}
        style={{ position: 'absolute', left: '50%', top: 110, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 20px', border: 0, borderRadius: 12, background: '#1b1d1f', color: couleur, boxShadow: '0px 0px 40px 0px rgba(31,32,33,0.4)', fontFamily: 'Figtree, Inter, system-ui, sans-serif', fontWeight: 600, fontSize: 16 }}
      >
        <IconeImagePlus taille={16} />
        Image
      </button>
    </div>
  )
}
