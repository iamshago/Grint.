import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import { CX, T, W, chemins, fmt, geo, minuteur, ondeImages, r1, type ExoRecord } from './crete'
import { SAIT_D, animerOndeSansCss, attributsPanneau, type PanneauProps } from './panneaux'

interface PanneauRecordProps {
  panneau: PanneauProps
  exos: ExoRecord[]
  /** Exercice affiché (celui de la carte Record) */
  nom: string
  /** Nombre de nœuds de la crête (le même pour tous les exercices) */
  ng: number
  /** Groupe « crête » : dessin (arrivée) ou onde (changement d'exercice), '' au repos */
  mode: '' | 'dessin' | 'onde'
  exoAvant: string | null
  sc: 'A' | 'B'
  sel: number | null
  bulleCls: string
  onChoisirExo: (nom: string) => void
  onChoisirPoint: (sel: number | null) => void
}

const vars = (o: Record<string, string>) => o as unknown as CSSProperties

/** Onglet « Record personnel » de la carte performance (O3 v2) : la crête, le sommet, les records, le panneau à encoche. */
export default function PanneauRecord(p: PanneauRecordProps) {
  const ex = p.exos.find((e) => e.nom === p.nom) ?? p.exos[0]
  const G = useMemo(() => geo(ex, p.ng), [ex, p.ng])
  const C = useMemo(() => chemins(G.noeuds), [G])
  const pts = G.pts, iS = G.iS, S = pts[iS], P0 = pts[0]
  const { longueurs, L, quand } = useMemo(() => minuteur(C.segs), [C])

  const enDessin = p.mode === 'dessin'
  const avant = p.exoAvant ? p.exos.find((e) => e.nom === p.exoAvant) : null
  const enOnde = p.mode === 'onde' && !!avant && avant.nom !== ex.nom
  const GA = useMemo(() => (avant ? geo(avant, p.ng) : null), [avant, p.ng])
  const tS = quand(longueurs[S.k] / L)
  const tEtiquette = enOnde ? 0.42 : tS + 0.1
  const sc = p.sc

  // l'onde : neuf images clés ; en CSS (d: path()) là où le navigateur le sait, sinon image par image
  const images = useMemo(() => (enOnde && GA ? ondeImages(GA.noeuds, G.noeuds, C) : null), [enOnde, GA, G, C])
  const cssOnde = (q: 'trace' | 'sous' | 'longue') =>
    images ? vars(Object.fromEntries(images[q].map((d, f) => ['--d' + f, `path('${d}')`]))) : {}
  const refs = useRef<Record<string, SVGElement | null>>({})
  useLayoutEffect(() => {
    if (!images) return
    return animerOndeSansCss([
      [refs.current.clip, images.sous], [refs.current.sous1, images.sous], [refs.current.decoupe, images.sous, 'clip'],
      [refs.current.longue, images.longue], [refs.current.trace1, images.trace], [refs.current.trace2, images.trace],
    ])
  }, [images, sc])

  const sel = p.sel ?? iS
  const records = pts.filter((q) => q.rec).map((q) => {
    const estSommet = q.i === iS, estChoisi = q.i === sel
    return {
      i: q.i, x: r1(q.x), y: r1(q.y),
      t: estSommet ? 16 : estChoisi ? 14 : 10,
      ombre: estSommet || estChoisi ? '0 0 0 3px rgba(255,238,140,0.3), 0 0 16px 0 rgba(255,238,140,0.6)' : '0 0 0 2px rgba(255,238,140,0.35)',
      cls: enDessin || enOnde ? 'o3-pop' + sc : '',
      delai: (enDessin ? quand(longueurs[q.k] / L) - 0.02 : 0.3 + 0.5 * q.x / W).toFixed(2),
      aria: fmt(q.v) + ' kg, ' + q.date,
      choisir: () => p.onChoisirPoint(estSommet || p.sel === q.i ? null : q.i),
    }
  })

  // étiquette du sommet, du côté où il y a de la place
  const aDroite = S.x > W / 2
  const lab = aDroite
    ? { top: r1(S.y - 74), left: 'auto', right: r1(W - S.x + 12) + 'px', align: 'right' as const }
    : { top: r1(S.y - 74), left: r1(S.x + 24) + 'px', right: 'auto', align: 'left' as const }
  const boiteLab = aDroite ? [S.x - 150, S.y - 74, S.x + 20, S.y + 2] : [S.x - 4, S.y - 74, S.x + 170, S.y + 2]

  // bulle : au-dessus du point, ou dessous si elle heurte l'étiquette du sommet
  let bulle: { x: number; y: number; ty: string; origine: string; val: string; date: string } | null = null
  if (sel !== iS && pts[sel]) {
    const q = pts[sel]
    const l = (fmt(q.v) + ' kg · ' + q.date).length * 6.6 + 20
    const bx = Math.min(W - 8 - l / 2, Math.max(8 + l / 2, q.x))
    const haut = [bx - l / 2, q.y - 38, bx + l / 2, q.y - 12]
    const heurte = !(haut[2] < boiteLab[0] || haut[0] > boiteLab[2] || haut[3] < boiteLab[1] || haut[1] > boiteLab[3])
    bulle = {
      x: r1(bx), y: r1(heurte ? q.y + 14 : q.y - 14), ty: heurte ? '0%' : '-100%',
      origine: (50 + (q.x - bx) / l * 100).toFixed(0) + '% ' + (heurte ? '0%' : '100%'),
      val: fmt(q.v), date: q.date,
    }
  }
  const pc = pts[sel] ?? S
  const bord = (x: number) => (Math.abs(x - CX) < 42 ? T - 18 * (0.5 + 0.5 * Math.cos(Math.PI * (x - CX) / 42)) : T)
  const fil = { x: r1(pc.x), y1: r1(pc.y + (bulle && bulle.ty === '0%' ? 44 : 11)), y2: r1(bord(pc.x) - 4) }
  const pan = { fond: '#1b1d1f', halo: '0', chevron: '#ffee8c', chiffre: '#f1f4fb', unite: '#ffee8c', etiquette: '#989da6' }

  const cl = {
    trace: enDessin ? 'o3-trace' + sc : enOnde ? 'o3-onde' + sc : '',
    onde: enOnde ? 'o3-onde' + sc : '',
    // découpe de la poussière : en CSS là où l'onde est en CSS, sinon menée image par image avec le reste (animerOndeSansCss)
    decoupe: enOnde && SAIT_D ? 'o3-decoupe' + sc : '',
    remplit: enDessin ? 'o3-remplit' + sc : '',
    drapeau: enDessin || enOnde ? 'o3-drapeau' + sc : '',
    apparait: enDessin || enOnde ? 'o3-apparait' + sc : '',
    compte: 'o3-n' + (enDessin || enOnde ? ' o3-compte' + sc : ''),
  }
  const xs = r1(S.x), ysPied = r1(S.y - 9), ysMat = r1(S.y - 40)
  const fanion = 'M' + r1(S.x) + ' ' + r1(S.y - 40) + ' C' + r1(S.x + 6) + ' ' + r1(S.y - 42) + ' ' + r1(S.x + 10) + ' ' + r1(S.y - 36) + ' ' + r1(S.x + 17) + ' ' + r1(S.y - 36.5) + ' C' + r1(S.x + 11) + ' ' + r1(S.y - 33) + ' ' + r1(S.x + 6) + ' ' + r1(S.y - 30) + ' ' + r1(S.x) + ' ' + r1(S.y - 30) + ' Z'
  const tDrapeau = (enOnde ? 0.5 : tS).toFixed(2), tE = tEtiquette.toFixed(2), tChiffres = enOnde ? '0.08' : '0.45'
  const compte = { fin: Math.floor(G.vmax), dec: G.vmax % 1 ? '.' + Math.round((G.vmax % 1) * 10) : '', de: Math.floor(enOnde && GA ? GA.vmax : P0.v) }
  const stats = { prog: '+' + fmt(G.vmax - P0.v), records: G.nRec, seances: pts.length }
  const chiffre = { fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 32, letterSpacing: '-0.96px', color: pan.chiffre }

  return (
    // Calque permanent (will-change) : sinon Safari crée un calque au début de chaque glissé d'onglet et le
    // détruit à la fin, et repeint à chaque fois la crête avec ses filtres (deux images de 150 ms).
    <div {...attributsPanneau(p.panneau, { willChange: 'transform, opacity' })}>
      <div className="o3-puces" style={{ display: 'flex', gap: 8, padding: '16px 16px 0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {p.exos.map((e) => {
          const actif = e.nom === ex.nom
          return (
            <button key={e.nom} type="button" tabIndex={p.panneau.actif ? undefined : -1} className={actif ? '' : 'o3-presse'} onClick={() => { if (!actif) p.onChoisirExo(e.nom) }} style={{ flexShrink: 0, margin: 0, padding: '6px 12px', borderRadius: 8, border: `1px solid ${actif ? '#ffee8c' : 'transparent'}`, backgroundColor: actif ? 'rgba(255,238,140,0.25)' : '#3d4149', color: actif ? '#ffee8c' : '#989da6', fontFamily: 'Figtree, system-ui, sans-serif', fontWeight: 600, fontSize: 12, lineHeight: '18px', textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: 'pointer' }}>{e.nom}</button>
          )
        })}
      </div>

      <div style={{ position: 'absolute', top: 48, left: 0, width: 370, height: 330 }}>
        <svg viewBox="0 0 370 330" width="370" height="330" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="o3Degrade" gradientUnits="userSpaceOnUse" x1="0" y1="84" x2="0" y2="238"><stop offset="0" stopColor="#ffee8c" stopOpacity=".26" /><stop offset="1" stopColor="#ffee8c" stopOpacity="0" /></linearGradient>
            <linearGradient id="o3Poussiere" gradientUnits="userSpaceOnUse" x1="0" y1="84" x2="0" y2="238"><stop offset="0" stopColor="#ffee8c" stopOpacity=".42" /><stop offset="1" stopColor="#ffee8c" stopOpacity="0" /></linearGradient>
            {/* Pointillé de G-PaysageWinter : un dégradé de transparence devient une poussière de points.
                Régions des filtres resserrées sur ce qui se voit (même rendu au pixel près, moins de pixels à calculer) :
                le panneau à encoche, opaque, couvre tout sous y = 238 ; la crête ne monte jamais au-dessus de y = 84 (YS).
                Les points gardent leur origine en 0,0 (Safari tire le bruit à partir de l'origine de la région) ;
                le flou garde 3 écarts-types (36) de marge autour de la zone des points. */}
            <filter id="o3Points" filterUnits="userSpaceOnUse" x="0" y="0" width="370" height="242" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves={1} seed={7} result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.3" result="na" />
              <feComposite in="SourceAlpha" in2="na" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0.5" result="d" />
              <feComponentTransfer in="d" result="m"><feFuncA type="discrete" tableValues="0 1" /></feComponentTransfer>
              <feComposite in="SourceGraphic" in2="m" operator="in" result="c" />
              <feColorMatrix in="c" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 0" />
            </filter>
            <filter id="o3Flou" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
            <filter id="o3FlouLarge" filterUnits="userSpaceOnUse" x="-40" y="40" width="450" height="240"><feGaussianBlur stdDeviation="12" /></filter>
            <filter id="o3Halo" filterUnits="userSpaceOnUse" x="-40" y="150" width="450" height="230"><feGaussianBlur stdDeviation="9" /></filter>
            <clipPath id="o3Sous"><path ref={(el) => { refs.current.clip = el }} className={cl.onde} d={C.sous} style={cssOnde('sous')} /></clipPath>
          </defs>

          {/* la crête remplie : dégradé doux, poussière de points, points serrés le long de l'arête */}
          {/* clip-path neutre au repos (inset 0) : le remplissage se dessine en animant ce clip-path ; le faire passer de
              « none » à un inset et retour jetait le cache des filtres de tout le groupe dans Safari (100 ms). */}
          <g className={cl.remplit} style={{ clipPath: 'inset(0 0 0 0)' }}>
            <path ref={(el) => { refs.current.sous1 = el }} className={cl.onde} d={C.sous} fill="url(#o3Degrade)" style={cssOnde('sous')} />
            {/* La poussière ne dépend pas de la forme (seuil du dégradé contre un bruit fixe) : on la calcule une fois
                sur toute la zone et la crête la découpe (clip-path CSS, pas un <clipPath> : changer un style garde le
                cache du filtre dans Safari, changer le tracé d'un <clipPath> le jette). Même rendu, mais son filtre
                n'est plus recalculé quand la crête ondule. */}
            <g ref={(el) => { refs.current.decoupe = el }} className={cl.decoupe} style={{ clipPath: `path('${C.sous}')`, ...cssOnde('sous') }}><rect x="0" y="0" width="370" height="330" fill="url(#o3Poussiere)" filter="url(#o3Points)" opacity=".55" /></g>
            <g clipPath="url(#o3Sous)">
              <g filter="url(#o3Points)" opacity=".9">
                <path ref={(el) => { refs.current.longue = el }} className={cl.onde} d={C.longue} fill="none" stroke="#ffee8c" strokeWidth="44" strokeOpacity=".62" strokeLinejoin="round" filter="url(#o3FlouLarge)" style={cssOnde('longue')} />
              </g>
            </g>
          </g>

          {/* le tracé fait : lueur floutée + trait */}
          <path ref={(el) => { refs.current.trace1 = el }} className={cl.trace} pathLength={100} d={C.trace} fill="none" stroke="#ffee8c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#o3Flou)" opacity=".75" style={{ strokeDasharray: '100 100', ...cssOnde('trace') }} />
          <path ref={(el) => { refs.current.trace2 = el }} className={cl.trace} pathLength={100} d={C.trace} fill="none" stroke="#ffee8c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: '100 100', ...cssOnde('trace') }} />

          {/* fil à plomb du point choisi */}
          <g className={cl.apparait} style={{ animationDelay: `${tE}s` }}><line x1={fil.x} y1={fil.y1} x2={fil.x} y2={fil.y2} stroke="#ffee8c" strokeWidth="1" strokeDasharray="3 3" opacity=".5" /></g>

          {/* drapeau planté au sommet */}
          <g className={cl.drapeau} style={{ transformBox: 'view-box', transformOrigin: `${xs}px ${ysPied}px`, animationDelay: `${tDrapeau}s` }}>
            <line x1={xs} y1={ysPied} x2={xs} y2={ysMat} stroke="#ffee8c" strokeWidth="1.5" strokeLinecap="round" />
            <path d={fanion} fill="#ffee8c" />
          </g>

          {/* panneau à encoche : bosse arrondie au centre du bord haut */}
          <path d="M0 238 H143 C161 238 163 220 185 220 C207 220 209 238 227 238 H370 V350 H0 Z" fill={pan.fond} opacity={pan.halo} filter="url(#o3Halo)" />
          <path d="M0 238 H143 C161 238 163 220 185 220 C207 220 209 238 227 238 H370 V350 H0 Z" fill={pan.fond} />
          <path d="M179 231 L185 225 L191 231" fill="none" stroke={pan.chevron} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* la valeur du sommet : la date, puis le chiffre qui compte jusqu'au record */}
        <div className={cl.apparait} style={{ position: 'absolute', top: lab.top, left: lab.left, right: lab.right, textAlign: lab.align, animationDelay: `${tE}s`, pointerEvents: 'none' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, lineHeight: '16px', color: '#989da6', whiteSpace: 'nowrap' }}>{S.date}</p>
          <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'nowrap', fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 48, color: '#f1f4fb' }}>
            <span className={cl.compte} style={{ ...vars({ '--n': String(compte.fin), '--n0': String(compte.de), '--n1': String(compte.fin) }), counterReset: 'o3n var(--n)', animationDelay: `${tE}s` }} />
            {compte.dec}
            <span style={{ fontFamily: 'Figtree, system-ui, sans-serif', fontWeight: 600, fontSize: 12, color: '#ffee8c' }}> kg</span>
          </p>
        </div>

        {/* chaque nouveau record : un point sur la crête */}
        {records.map((q) => (
          <button key={q.i} type="button" tabIndex={p.panneau.actif ? undefined : -1} className="o3-point" onClick={q.choisir} aria-label={q.aria} style={{ position: 'absolute', left: q.x, top: q.y, width: 32, height: 32, margin: '-16px 0 0 -16px', padding: 0, border: 0, borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
            <span className={q.cls} style={{ display: 'block', width: q.t, height: q.t, borderRadius: '50%', background: '#ffee8c', boxShadow: q.ombre, animationDelay: `${q.delai}s` }} />
          </button>
        ))}

        {/* bulle du point touché, en ressort */}
        {bulle && (
          <div className={p.bulleCls} style={{ position: 'absolute', left: bulle.x, top: bulle.y, ...vars({ '--ty': bulle.ty }), transform: `translate(-50%, ${bulle.ty})`, transformOrigin: bulle.origine, zIndex: 3, pointerEvents: 'none', whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: 9999, background: '#ffee8c', boxShadow: '0px 0px 16px 0px rgba(255,238,140,0.4)', fontSize: 12, lineHeight: '16px', color: '#1b1d1f' }}>
            <strong style={{ fontWeight: 800 }}>{bulle.val} kg</strong><span style={{ fontWeight: 600, color: '#49452c' }}> · {bulle.date}</span>
          </div>
        )}

        {/* trois chiffres, une étiquette chacun */}
        <div className={cl.apparait} style={{ position: 'absolute', left: 0, right: 0, top: 258, padding: '0 16px', display: 'flex', gap: 40, animationDelay: `${tChiffres}s` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'nowrap' }}><span style={chiffre}>{stats.prog}</span><span style={{ fontWeight: 600, fontSize: 12, color: pan.unite }}> kg</span></p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', color: pan.etiquette }}>Progression</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'nowrap' }}><span style={chiffre}>{stats.records}</span></p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', color: pan.etiquette }}>Records</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, lineHeight: 1, whiteSpace: 'nowrap' }}><span style={chiffre}>{stats.seances}</span></p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', color: pan.etiquette }}>Séances</p>
          </div>
        </div>
      </div>
    </div>
  )
}
