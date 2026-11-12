import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNuitVue } from '@/hooks/useNuit'

interface FondJourNuitProps {
  jour: string
  nuit: string
  /** Posé entre l'image et le voile (la neige de la carte). */
  children?: ReactNode
  /** Voile par-dessus l'image (dégradés CSS), un pour chaque moment ; il bascule avec l'image. */
  voile?: { jour: string; nuit: string }
}

const FONDU = 'opacity 2.4s ease-in-out'

/**
 * Fond d'une scène Winter qui suit l'heure : l'image de jour dessous, la nuit par-dessus en fondu.
 * La bascule attend que les deux images soient prêtes, sinon le fondu partirait sur du vide.
 */
export default function FondJourNuit({ jour, nuit, children, voile }: FondJourNuitProps) {
  const boite = useRef<HTMLDivElement>(null)
  const imJour = useRef<HTMLImageElement>(null)
  const imNuit = useRef<HTMLImageElement>(null)
  const [pret, setPret] = useState(false)

  useEffect(() => {
    let vivant = true
    const images = [imJour.current, imNuit.current].filter((i): i is HTMLImageElement => i !== null)
    Promise.all(images.map((i) => i.decode().catch(() => undefined))).then(() => {
      if (vivant) setPret(true)
    })
    return () => {
      vivant = false
    }
  }, [jour, nuit])

  const estNuit = useNuitVue(boite, pret)

  return (
    <div ref={boite} aria-hidden="true" className="absolute inset-0">
      <img ref={imJour} src={jour} alt="" className="absolute inset-0 size-full object-cover" />
      <img
        ref={imNuit}
        src={nuit}
        alt=""
        className="absolute inset-0 size-full object-cover"
        style={{ opacity: estNuit ? 1 : 0, transition: FONDU }}
      />
      {children}
      {voile && (
        <>
          <div className="absolute inset-0" style={{ background: voile.jour, opacity: estNuit ? 0 : 1, transition: FONDU }} />
          <div className="absolute inset-0" style={{ background: voile.nuit, opacity: estNuit ? 1 : 0, transition: FONDU }} />
        </>
      )}
    </div>
  )
}
