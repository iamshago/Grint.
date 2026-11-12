import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { WINTER_MONTAGNE } from '@/lib/winter'
import WinterSnow, { FLOCONS_MONTAGNE } from './WinterSnow'
import WinterPile, { type Grimpeur } from './WinterPile'
import FondJourNuit from './FondJourNuit'

interface WinterMountainSceneProps {
  summit: number
  milestones: number[]
  /** Toi : `pts` est la valeur affichée (elle change à l'arrivée, ton avatar glisse sur le chemin). */
  moi: { avatar: string; pts: number; prevPts: number } | null
  /** Les autres participants (sans toi). */
  autres: Grimpeur[]
  /** Avec du monde (C7) : visage pour les amis et le premier, en piles. Sinon (C5) : seul le premier a un visage. */
  foule: boolean
}

const W = WINTER_MONTAGNE.largeur
const H = WINTER_MONTAGNE.hauteur
const chemin = `path('${WINTER_MONTAGNE.trace}')`

/**
 * Illustration de la montagne à terrasses et son chemin (maquettes G-Montagne, C5 / C7).
 * Dessinée en 370 × 330 comme la maquette (le chemin et les grimpeurs posés dessus sont
 * en unités de la carte), puis mise à l'échelle de la largeur disponible.
 */
export default function WinterMountainScene({ summit, milestones, moi, autres, foule }: WinterMountainSceneProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  const [ouvert, setOuvert] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const maj = () => setK(el.clientWidth / W)
    maj()
    const ro = new ResizeObserver(maj)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pct = (v: number) => (Math.min(v, summit) / summit) * 100
  const sur = (pos: number, extra: CSSProperties = {}): CSSProperties => ({ offsetPath: chemin, offsetDistance: `${pos}%`, ...extra })

  // C5 : le premier a son visage, les autres sont des points. C7 : les visages (amis, premier)
  // à 1 pt d'écart ou moins se regroupent en pile ; les autres sont des points plus petits.
  const tete = autres.find((a) => a.tete) ?? null
  const visages = foule ? autres.filter((a) => a.visage).sort((a, b) => b.pts - a.pts) : []
  const groupes: Grimpeur[][] = []
  for (const p of visages) {
    const g = groupes[groupes.length - 1]
    if (g && g[g.length - 1].pts - p.pts <= 1) g.push(p)
    else groupes.push([p])
  }

  return (
    <div ref={boxRef} className="relative w-full overflow-hidden" style={{ aspectRatio: `${W} / ${H}` }}>
      <div className="absolute left-0 top-0" style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        {/* Easter egg : la montagne suit l'heure (nuit et lune de 18 h à 7 h, plein jour sinon) */}
        <FondJourNuit jour={WINTER_MONTAGNE.imageJour} nuit={WINTER_MONTAGNE.image} />
        <WinterSnow flocons={FLOCONS_MONTAGNE} fall={340} />

        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" className="absolute inset-0 overflow-visible">
          <defs>
            <filter id="winterFlou" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <path d={WINTER_MONTAGNE.trace} fill="none" stroke="#141a40" strokeOpacity=".55" strokeWidth="4.5" strokeLinecap="round" />
          <path d={WINTER_MONTAGNE.trace} fill="none" stroke="#f1f4fb" strokeOpacity=".6" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round" />
          {moi && (
            <>
              <path className="winter-fait winter-lueur" pathLength={100} d={WINTER_MONTAGNE.trace} fill="none" stroke="#ffee8c" strokeWidth="7" strokeLinecap="round" filter="url(#winterFlou)" style={{ strokeDasharray: `${pct(moi.pts)} 200` }} />
              <path className="winter-fait" pathLength={100} d={WINTER_MONTAGNE.trace} fill="none" stroke="#ffee8c" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: `${pct(moi.pts)} 200` }} />
            </>
          )}
        </svg>

        {/* Les autres participants : des points sur le chemin */}
        {!foule && autres.filter((a) => a !== tete).map((a) => (
          <span key={a.id} className="winter-sur" title={a.nom} style={sur(pct(a.pts), { width: 9, height: 9, zIndex: 2, borderRadius: '50%', background: '#f1f4fb', boxShadow: '0 0 0 2px rgba(13,16,36,.75)' })} />
        ))}
        {foule && autres.filter((a) => !a.visage).map((a) => (
          <span key={a.id} className="winter-sur" style={sur(pct(a.pts), { width: 7, height: 7, zIndex: 2, borderRadius: '50%', background: 'rgba(241,244,251,.8)', boxShadow: '0 0 0 1.5px rgba(13,16,36,.7)' })} />
        ))}

        {/* Paliers */}
        {milestones.map((n) => {
          const ok = (moi?.pts ?? 0) >= n
          const vientDAtteindre = ok && moi !== null && moi.prevPts < n
          return (
            <span key={n} className="winter-sur" style={sur(pct(n), { width: 20, height: 20, zIndex: 3 })}>
              <span
                className={vientDAtteindre ? 'winter-atteint' : undefined}
                style={{
                  display: 'flex', width: 20, height: 20, borderRadius: '50%', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, background: ok ? '#ffee8c' : '#1b1d1f', color: ok ? '#1b1d1f' : '#989da6',
                  boxShadow: `0 0 0 2px ${ok ? 'rgba(255,238,140,.35)' : 'rgba(241,244,251,.35)'}`,
                }}
              >
                {n}
              </span>
            </span>
          )
        })}

        {/* Sommet */}
        <span className="winter-sur" style={sur(100, { width: 0, height: 0, zIndex: 3 })}>
          <span className="absolute left-[8px] top-[-26px] flex items-center gap-[4px] whitespace-nowrap rounded-full bg-[rgba(13,16,36,.75)] text-bg-1 text-[11px] font-bold py-[2px] pl-[6px] pr-[8px]">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffee8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="block">
              <path d="M4 22V4l12 5-12 5" />
            </svg>
            {summit} pts
          </span>
        </span>

        {/* C5 : le premier, en tête */}
        {!foule && tete && (
          <span className="winter-sur" style={sur(pct(tete.pts), { width: 24, height: 24, zIndex: 4 })}>
            <img src={tete.avatar} alt={`${tete.nom}, en tête`} className="block size-[24px] rounded-full object-cover" style={{ boxShadow: '0 0 0 1.5px #f1f4fb, 0 4px 10px rgba(0,0,0,.35)' }} />
          </span>
        )}

        {/* C7 : les amis (et le premier) avec leur visage, en pile quand ils sont au même endroit */}
        {groupes.map((g, gi) => (
          <span key={g[0].id} className="winter-sur" style={sur(pct(g[0].pts), { width: 26, height: 26, zIndex: ouvert === gi ? 8 : 4 })}>
            <WinterPile membres={g} ouvert={ouvert === gi} onToggle={() => setOuvert(ouvert === gi ? null : gi)} />
          </span>
        ))}

        {/* Toi */}
        {moi && (
          <span className="winter-sur winter-moi" style={sur(pct(moi.pts), { width: 32, height: 32, zIndex: 5 })}>
            <img src={moi.avatar} alt="Toi" className="block size-[32px] rounded-full object-cover" style={{ boxShadow: '0 0 0 2.5px #ffee8c, 0 0 18px rgba(255,238,140,.55)' }} />
            <span className="absolute left-[40px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-pr-1 text-tx-1 text-[12px] font-extrabold px-[8px] py-[2px]">
              Toi · {moi.pts} pts
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
