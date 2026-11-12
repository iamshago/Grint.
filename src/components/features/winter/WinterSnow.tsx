import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import './winter.css'

// Flocons de la maquette G-CarteDefiWinter : position, taille, opacité, dérive, durée, départ.
const FLOCONS: Array<[left: number, size: number, o: number, dx: number, dur: number, delay: number]> = [
  [8, 2, 0.6, 8, 6, -1],
  [19, 3, 0.8, -6, 7.5, -3],
  [31, 2, 0.5, 10, 6.5, -5],
  [44, 3, 0.7, 4, 8, -2],
  [56, 2, 0.6, -10, 7, -4],
  [67, 4, 0.65, 6, 9, -6],
  [78, 2, 0.55, -4, 6.8, -2.5],
  [89, 3, 0.7, 8, 7.8, -5.5],
]

interface WinterSnowProps {
  /** Distance de chute en px (un peu plus que la hauteur du cadre). */
  fall?: number
  className?: string
}

/** Neige qui tombe par-dessus l'illustration Winter (purement décoratif). */
export default function WinterSnow({ fall = 175, className }: WinterSnowProps) {
  return (
    <span aria-hidden="true" className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {FLOCONS.map(([left, size, o, dx, dur, delay]) => (
        <i
          key={left}
          className="winter-flocon"
          style={{
            left: `${left}%`,
            width: size,
            height: size,
            animationDuration: `${dur}s`,
            animationDelay: `${delay}s`,
            '--o': o,
            '--dx': `${dx}px`,
            '--dy': `${fall}px`,
          } as CSSProperties}
        />
      ))}
    </span>
  )
}
