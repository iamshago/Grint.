import { cn } from '@/lib/utils'
import { DOS_MEDAILLES, FACE_MEDAILLE, MEDAILLES_SVG, RELIEF_MEDAILLES, TRACES_MEDAILLES } from './medaillesSvg'
import './medailles.css'

/**
 * Médailles de l'app, dessinées comme les modèles validés d'E4 « Collection · mix » (consigne de
 * Florian : les badges d'E4 partout) : camp = mousqueton (campD), palier8 = palier8D, mipente = col
 * sans drapeau (mipenteE), palier16 = fanion (palier16D), podium = podiumD, sommet = sommetD,
 * semN = flamme (semBN).
 */
export type ModeleMedaille =
  | 'camp' | 'palier8' | 'mipente' | 'palier16' | 'sommet' | 'podium'
  | 'sem2' | 'sem4' | 'sem6' | 'sem12' | 'sem26' | 'sem52'

export type AnimMedaille = 'aucune' | 'nouveau' | 'arrivee' | 'vitrine'

interface MedailleProps {
  modele: ModeleMedaille
  etat: 'gagnee' | 'verrouillee'
  /** « 3d » : tranche en couches + revers gravé (G-Medaille relief 3d) ; « plat » par défaut. */
  relief?: 'plat' | '3d'
  /** nouveau : reflet ; arrivee : arrive en tournant ; vitrine : s'ouvre en tournant puis se balance. */
  anim?: AnimMedaille
  /** Vitrine : « a » / « b » relance un tour (comme la prop tour de G-Medaille). */
  tour?: '' | 'a' | 'b'
  /** Gravure du revers (prénom · date), en capitales. */
  gravure?: string
  taille: number
  className?: string
}

const FERME = '</div></div></div></div>'
const echappe = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const traces = (h: string) => h.replace(/ d="@(\d+)"/g, (_, n) => ` d="${TRACES_MEDAILLES[Number(n)]}"`)

const rendu = (modele: ModeleMedaille, etat: 'gagnee' | 'verrouillee') => traces(MEDAILLES_SVG[`${modele}-${etat}`] ?? '')

/** Mélange de deux couleurs #rrggbb (fonction melange de G-Medaille). */
function melange(a: string, b: string, t: number): string {
  const l = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const A = l(a), B = l(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/** Médaille Grint (G-Medaille) : le rendu de la maquette, à l'identique. */
export default function Medaille({ modele, etat, relief = 'plat', anim = 'aucune', tour = '', gravure = '', taille, className }: MedailleProps) {
  const gagnee = etat !== 'verrouillee'
  const r3d = RELIEF_MEDAILLES[modele]
  const a3d = gagnee && relief === '3d' && !!r3d
  const a = gagnee ? anim : 'aucune'
  let html = rendu(modele, etat)

  if (!a3d) {
    if (a !== 'aucune') html = html.replace(FACE_MEDAILLE, FACE_MEDAILLE.replace('class=""', `class="gm-${a}"`))
    return (
      <span
        className={cn('relative block shrink-0', className)}
        style={{ width: taille, height: taille }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  // Relief 3d : la logique de G-Medaille (tranches empilées sur Z, face devant, revers derrière)
  const iFace = html.indexOf(FACE_MEDAILLE)
  const face = html.slice(html.indexOf('>', iFace) + 1, html.length - FERME.length)
  const ep = Math.max(4, Math.round(taille * 0.075))
  const n = taille > 140 ? 18 : 10
  const tranches = Array.from({ length: n }, (_, i) => {
    const k = i / (n - 1)
    const lum = 1 - Math.abs(k - 0.5) * 2
    return { z: (-ep / 2 + k * ep).toFixed(2), c: melange(r3d.t0, r3d.t1, 0.2 + lum * 0.8) }
  })
  const demi = (ep / 2 + 0.3).toFixed(2)
  let clsTour = ''
  if (a === 'vitrine') clsTour = tour === 'a' ? 'gm-tour-a' : tour === 'b' ? 'gm-tour-b' : 'gm-tour-ouvre'
  if (a === 'arrivee') clsTour = 'gm-tour-arrivee'
  const dos = traces(DOS_MEDAILLES[modele] ?? '').replace(/__GRAVURE__/g, echappe(gravure))
  const couche = { position: 'absolute', inset: 0 } as const

  return (
    <span className={cn('relative block shrink-0', className)} style={{ width: taille, height: taille }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', perspective: `${Math.round(taille * 4.5)}px`, fontFamily: 'Figtree, system-ui, sans-serif' }}>
        <div className={a === 'vitrine' ? 'gm-balance' : ''} style={{ ...couche, transformStyle: 'preserve-3d' }}>
          <div className={clsTour} style={{ ...couche, transformStyle: 'preserve-3d' }}>
            {tranches.map((t) => (
              <svg key={t.z} viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" style={{ ...couche, overflow: 'visible', transform: `translateZ(${t.z}px)` }}>
                <path d={r3d.p0} fillRule={r3d.fr as 'nonzero'} clipRule={r3d.fr as 'nonzero'} fill={t.c} />
              </svg>
            ))}
            <div
              className={a === 'aucune' ? '' : `gm-${a}`}
              style={{ ...couche, transform: `translateZ(${demi}px)`, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              dangerouslySetInnerHTML={{ __html: face }}
            />
            <div
              style={{ ...couche, transform: `rotateY(180deg) translateZ(${demi}px)`, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              dangerouslySetInnerHTML={{ __html: dos }}
            />
          </div>
        </div>
      </div>
    </span>
  )
}

/** Médailles de la série Winter, dans l'ordre de « À gagner », avec le seuil de points de chacune. */
export const SERIE_WINTER: Array<{ modele: ModeleMedaille; seuil: number }> = [
  { modele: 'camp', seuil: 0 },
  { modele: 'palier8', seuil: 8 },
  { modele: 'mipente', seuil: 12 },
  { modele: 'palier16', seuil: 16 },
  { modele: 'sommet', seuil: 24 },
]
