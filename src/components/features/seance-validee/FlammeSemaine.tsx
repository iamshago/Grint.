import type { CSSProperties } from 'react'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import { FLAMME_ANIM, FLAMME_COEUR_D, FLAMME_D } from './b1Traces'
import Eclats from './Eclats'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const GRIS = 'rgba(156,163,176,0.3)'

interface FlammeSemaineProps {
  /** Semaines validées avant et après la séance (roule de l'un à l'autre). */
  avant: number
  apres: number
  /** Catégorie de chaque jour (lundi → dimanche), séance du jour comprise. */
  jours: Array<string | null>
  /** Jour de la séance (0 = lundi) : sa pastille s'allume. */
  aujourdhui: number
  /** La séance vient de valider la semaine : la flamme fait son « boost » et sa gerbe. */
  boost: boolean
  onRejouer: () => void
}

const coche = (
  <svg width="8" height="6" viewBox="0 0 8 6" fill="none" style={{ display: 'block' }}>
    <path d="M1 3L3 5L7 1" stroke="#0c0c0c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Haut de la séance validée (B1) : la flamme d'origine qui s'allume, « 7 / 52 semaines », les jours. */
export default function FlammeSemaine({ avant, apres, jours, aujourdhui, boost, onRejouer }: FlammeSemaineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        className="sv-rejoue"
        aria-label="Rejouer"
        onClick={onRejouer}
        style={{ position: 'relative', display: 'block', width: 104, height: 121, margin: 0, padding: 0, border: 0, borderRadius: 28, background: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer' }}
      >
        <svg viewBox="24 24 84 98" width="104" height="121" aria-hidden="true" style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 0 16px rgba(255,238,140,.35))' }}>
          <defs>
            <linearGradient id="svFlamme" x1="66.286" y1="34.286" x2="66.286" y2="112.286" gradientUnits="userSpaceOnUse">
              <stop offset="0.16" stopColor="#FFEE8C" /><stop offset="0.4" stopColor="#FDA379" /><stop offset="1" stopColor="#507FFF" />
            </linearGradient>
          </defs>
          <g className="sv-allume"><g className={boost ? 'sv-boost' : undefined}><g className="sv-respire">
            <path fill="url(#svFlamme)" d={FLAMME_D}>
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
            <path fill="#ffffff" d={FLAMME_COEUR_D} />
          </g></g></g>
        </svg>
        <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: -18, height: 34, display: 'block' }}>
          <i className="sv-braise" style={{ left: '34%', width: 4, height: 4, background: '#ffee8c', animationDuration: '1.4s' }} />
          <i className="sv-braise sv-d" style={{ left: '60%', width: 5, height: 5, background: '#fda379', animationDuration: '1.8s', animationDelay: '-1s' }} />
          <i className="sv-braise sv-d" style={{ left: '66%', width: 4, height: 4, background: '#ffee8c', animationDuration: '1.3s', animationDelay: '-.6s' }} />
          <i className="sv-braise" style={{ left: '44%', width: 4, height: 4, background: '#fff6c2', animationDuration: '1.9s', animationDelay: '-1.4s' }} />
        </span>
        {/* Éclats de la flamme (origine 201,150 de la maquette = 52,54 dans le bouton) et gerbe du boost (52,32) */}
        <Eclats origine={[201, 150]} x={52} y={54} />
        {boost && <Eclats origine={[201, 128]} x={52} y={32} />}
      </button>

      <p className="sv-entre" style={{ animationDelay: '.45s', margin: '20px 0 0', display: 'flex', alignItems: 'baseline', gap: 6, lineHeight: 1 }}>
        <span style={{ display: 'inline-block', height: 48, overflow: 'hidden' }}>
          <span className="sv-rouleau" style={{ display: 'flex', flexDirection: 'column', fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 48, lineHeight: '48px', color: '#f1f4fb' }}>
            <span>{avant}</span><span>{apres}</span>
          </span>
        </span>
        <span style={{ fontWeight: 400, fontSize: 12, color: '#989da6' }}>/ 52 semaines</span>
      </p>

      <div className="sv-entre" style={{ animationDelay: '.55s', marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        {JOURS.map((nom, i) => {
          const c = jours[i]
          const accent = c ? CATEGORY_ACCENT[c] ?? CATEGORY_ACCENT.upper : null
          const estAujourdhui = i === aujourdhui && !!accent
          return (
            <div key={nom} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                className={estAujourdhui ? 'sv-pMer' : undefined}
                style={{
                  width: 16, height: 16, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: accent ?? GRIS, boxShadow: accent ? `0px 0px 24px 0px ${accent}66` : 'none',
                  '--sv-jour': accent ?? undefined, '--sv-jour-lueur': accent ? `${accent}66` : undefined,
                } as CSSProperties}
              >
                {accent && <span className={estAujourdhui ? 'sv-coche' : undefined} style={{ display: 'block' }}>{coche}</span>}
              </div>
              <span
                className={estAujourdhui ? 'sv-lMer' : undefined}
                style={{ fontWeight: 600, fontSize: 12, textAlign: 'center', color: accent ?? '#989da6', '--sv-jour': accent ?? undefined } as CSSProperties}
              >
                {nom}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
