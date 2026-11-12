import type { CSSProperties } from 'react'
import { FLAMME_ANIM, FLAMME_COEUR_D, FLAMME_D } from '@/components/features/seance-validee/b1Traces'

// Le cœur blanc suit la flamme avec un léger retard (G-CarteStreakVivante : 1,5 s, begin -0,3 s).
const COEUR_VALUES = [
  FLAMME_COEUR_D,
  'M72 64.6C71.3 64.2 70.4 64.7 70.1 65.5C67.4 72 65.4 76 63.6 79.9C61.4 77.8 59.4 75.8 57.6 74C56.9 73.4 55.8 73.6 55.3 74.3C51.8 79 49.8 83.6 49.8 88.3C49.8 97.4 57.7 104.3 65.8 104.3C74 104.3 81.8 97.5 81.8 88.2C81.8 77.6 74.6 68.4 72 64.6Z',
  FLAMME_COEUR_D,
  'M69.4 68C68.7 67.7 67.9 68.2 67.6 68.9C65.8 73.2 64.4 76.6 62.9 79.7C60.6 76.8 58.6 74.3 56.6 71.9C55.9 71.2 54.8 71.4 54.3 72.1C51.2 77.4 49.8 82.8 49.8 88C49.8 97.3 57.7 104.3 65.8 104.3C74 104.3 81.8 97.5 81.8 88.3C81.8 78.6 73 71 69.4 68Z',
  FLAMME_COEUR_D,
].join(';')

const braise = (left: string, taille: number, fond: string, dx: string, duree: string, delai?: string) => (
  <i className="sk-braiseI" style={{ left, width: taille, height: taille, background: fond, '--dx': dx, animationDuration: duree, animationDelay: delai } as CSSProperties} />
)
const eclat = (fond: string, x: string, y: string) => <i style={{ background: fond, '--x': x, '--y': y } as CSSProperties} />

/**
 * La flamme d'origine (public/assets/streak-flame.svg, tracés repris) animée comme la maquette
 * G-CarteStreakVivante : pointes qui ondulent (SMIL), respiration depuis la base, braises, braise
 * grise qui fume quand la semaine est vide. Les états viennent de la classe de la carte (sk-*).
 */
export default function FlammeVivante() {
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: 64, height: 78, minWidth: 64, alignSelf: 'center' }}>
      <svg viewBox="24 24 84 98" width="64" height="78" role="img" aria-label="Flamme du streak" style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 0 12px rgba(255,238,140,0.4))' }}>
        <defs>
          <linearGradient id="vivFlamme" x1="66.286" y1="34.286" x2="66.286" y2="112.286" gradientUnits="userSpaceOnUse">
            <stop offset="0.16" stopColor="#FFEE8C" /><stop offset="0.4" stopColor="#FDA379" /><stop offset="1" stopColor="#507FFF" />
          </linearGradient>
        </defs>
        <g className="sk-fGris"><path fill="#4d5057" d={FLAMME_D} /><path fill="#6b6f77" d={FLAMME_COEUR_D} /></g>
        <g className="sk-fCorps"><g className="sk-fRespire">
          <path fill="url(#vivFlamme)" d={FLAMME_D}>
            <animate
              attributeName={FLAMME_ANIM.attributeName}
              dur={FLAMME_ANIM.dur}
              repeatCount={FLAMME_ANIM.repeatCount}
              calcMode={FLAMME_ANIM.calcMode as 'spline'}
              keyTimes={FLAMME_ANIM.keyTimes}
              keySplines={FLAMME_ANIM.keySplines}
              values={FLAMME_ANIM.values}
            />
          </path>
          <path fill="#ffffff" d={FLAMME_COEUR_D}>
            <animate
              attributeName="d"
              dur="1.5s"
              begin="-.3s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes={FLAMME_ANIM.keyTimes}
              keySplines={FLAMME_ANIM.keySplines}
              values={COEUR_VALUES}
            />
          </path>
        </g></g>
      </svg>
      <div className="sk-braises" aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: -18, height: 28 }}>
        {braise('32%', 3, '#ffee8c', '-6px', '1.4s')}
        {braise('58%', 4, '#fda379', '7px', '1.8s', '-1.1s')}
        {braise('64%', 3, '#ffee8c', '10px', '1.3s', '-.7s')}
        {braise('42%', 3, '#fff6c2', '-9px', '1.9s', '-1.5s')}
      </div>
      <div className="sk-fumee" aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '30%', height: '50%' }}>
        <i className="sk-fumeeI" style={{ left: '44%' }} /><i className="sk-fumeeI" style={{ left: '50%', animationDelay: '-.7s' }} /><i className="sk-fumeeI" style={{ left: '56%', animationDelay: '-1.4s' }} />
      </div>
      <div className="sk-gerbe" aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '40%', width: 0, height: 0 }}>
        {eclat('#ffee8c', '-36px', '-22px')}{eclat('#fda379', '-26px', '-40px')}{eclat('#fff6c2', '-8px', '-50px')}
        {eclat('#507fff', '12px', '-48px')}{eclat('#ffee8c', '30px', '-36px')}{eclat('#fda379', '40px', '-16px')}
      </div>
    </div>
  )
}
