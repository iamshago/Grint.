import type { CSSProperties } from 'react'
import { ECLATS } from './b1Traces'

interface EclatsProps {
  /** Origine de la gerbe dans la maquette B1 (402 px), pour retrouver ses éclats. */
  origine: [number, number]
  /** Position de la gerbe dans son conteneur (px, ou une expression CSS pour x). */
  x: number | string
  y: number
}

/** Une gerbe d'éclats de B1 (étoiles, ronds, feuilles), posée à la même place qu'en maquette. */
export default function Eclats({ origine, x, y }: EclatsProps) {
  const liste = ECLATS.filter(([ox, oy]) => ox === origine[0] && oy === origine[1])
  return (
    <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 0, zIndex: 20, pointerEvents: 'none' }}>
      {liste.map(([, , transform, taille, delai, duree, d, fill], i) => (
        <i key={i} className="sv-ecw" style={{ left: x, top: y, transform }}>
          <i
            className="sv-ec"
            style={{ width: taille, height: taille, animationDelay: `${delai}s`, ...(duree ? { animationDuration: `${duree}s` } : {}) } as CSSProperties}
          >
            <svg viewBox="0 0 36 36" width={taille} height={taille} style={{ display: 'block' }}>
              <path d={d} fill={fill} />
            </svg>
          </i>
        </i>
      ))}
    </span>
  )
}
