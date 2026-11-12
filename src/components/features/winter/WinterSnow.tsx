import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import './winter.css'

/** Un flocon : position (% de largeur), taille, opacité, dérive (px), durée et départ (s). */
export interface Flocon {
  x: number
  size: number
  o: number
  dx: number
  dur: number
  delay: number
}

const f = (x: number, size: number, o: number, dx: number, dur: number, delay: number): Flocon => ({ x, size, o, dx, dur, delay })

/** Carte Communauté (G-CarteDefiWinter). */
export const FLOCONS_CARTE: Flocon[] = [
  f(8, 2, 0.6, 8, 6, -1), f(19, 3, 0.8, -6, 7.5, -3), f(31, 2, 0.5, 10, 6.5, -5), f(44, 3, 0.7, 4, 8, -2),
  f(56, 2, 0.6, -10, 7, -4), f(67, 4, 0.65, 6, 9, -6), f(78, 2, 0.55, -4, 6.8, -2.5), f(89, 3, 0.7, 8, 7.8, -5.5),
]

/** Montagne de la page défi (G-Montagne). */
export const FLOCONS_MONTAGNE: Flocon[] = (
  [[6, 2, 7, -1], [15, 3, 9, -4], [24, 2, 8, -6], [33, 3, 10, -2], [42, 2, 7.5, -5], [51, 4, 11, -8],
    [60, 2, 8.5, -3], [69, 3, 9.5, -7], [78, 2, 7, -2.5], [87, 3, 10.5, -9], [95, 2, 8, -4.5], [11, 2, 9, -6.5]] as const
).map(([x, t, d, r]) => f(x, t, 0.6, 8, d, r))

/** Carte du premier de la course (G-LigneCourse), neige plus rapide. */
export const FLOCONS_TETE: Flocon[] = (
  [[6, 2, 0.5, 12, 7, -1], [15, 3, 0.7, -8, 9, -4], [24, 2, 0.4, 16, 8, -6], [33, 3, 0.6, 6, 10, -2],
    [42, 2, 0.5, -14, 7.5, -5], [51, 4, 0.55, 10, 11, -8], [60, 2, 0.45, -6, 8.5, -3], [69, 3, 0.65, 14, 9.5, -7],
    [78, 2, 0.5, -10, 7, -2.5], [87, 3, 0.6, 8, 10.5, -9], [95, 2, 0.4, -12, 8, -4.5], [11, 2, 0.5, 8, 9, -6.5]] as const
).map(([x, t, o, dx, d, r]) => f(x, t, o, dx, +(d * 0.55).toFixed(2), +(r * 0.55).toFixed(2)))

interface WinterSnowProps {
  flocons?: Flocon[]
  /** Distance de chute en px (un peu plus que la hauteur du cadre). */
  fall?: number
  className?: string
}

/** Neige qui tombe par-dessus l'illustration Winter (purement décoratif). */
export default function WinterSnow({ flocons = FLOCONS_CARTE, fall = 175, className }: WinterSnowProps) {
  return (
    <span aria-hidden="true" className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {flocons.map((fl, i) => (
        <i
          key={i}
          className="winter-flocon"
          style={{
            left: `${fl.x}%`,
            width: fl.size,
            height: fl.size,
            animationDuration: `${fl.dur}s`,
            animationDelay: `${fl.delay}s`,
            '--o': fl.o,
            '--dx': `${fl.dx}px`,
            '--dy': `${fall}px`,
          } as CSSProperties}
        />
      ))}
    </span>
  )
}
