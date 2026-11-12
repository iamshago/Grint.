import type { CSSProperties } from 'react'

/**
 * État d'un panneau de la carte performance (O3) : actif ou non, et son animation d'entrée / sortie.
 *
 * Fluidité (Safari) : un panneau inactif n'est masqué ni par visibility ni par pointer-events (propriétés héritées :
 * les changer touche le style de chaque élément du SVG de la crête et jette le cache de ses filtres), ni par une
 * opacité nulle (à 0, Safari jette le dessin du calque et doit tout repeindre, filtres compris, quand il réapparaît).
 * Il reste peint à une opacité invisible (OPACITE_CACHEE), passe sous le panneau actif (z-index) et sort de la
 * lecture d'écran (aria-hidden). Avant : deux images de 100 à 150 ms à chaque passage par « Record personnel ».
 */
export interface PanneauProps {
  actif: boolean
  /** Décalage du glissé (« 36px » ou « -36px ») */
  sens: string
  cls: string
}

/** Opacité d'un panneau caché : invisible à l'œil (moins d'un niveau sur 255), mais jamais 0 (voir plus haut). */
export const OPACITE_CACHEE = 0.001

/** Style et attributs communs du conteneur d'un panneau. */
export function attributsPanneau(p: PanneauProps, style: CSSProperties = {}) {
  return {
    className: p.cls,
    'aria-hidden': !p.actif || undefined,
    style: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: p.actif ? 1 : OPACITE_CACHEE, zIndex: p.actif ? 1 : 0, ...style, ...({ '--sens': p.sens } as CSSProperties) } as CSSProperties,
  }
}

/** Le navigateur anime la propriété CSS `d` (Chrome) ; sinon (Safari) l'onde est jouée image par image en JS. */
export const SAIT_D = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('d', 'path("M0 0")')

/**
 * Onde de la crête pour les navigateurs qui n'animent pas la propriété CSS `d` (Safari) :
 * mêmes neuf images clés, même durée (0,95 s, linéaire), interpolées image par image.
 * Retourne de quoi l'arrêter. Ne fait rien là où le CSS de la planche s'en charge.
 */
export function animerOndeSansCss(cibles: Array<[SVGElement | null | undefined, string[], ('d' | 'clip')?]>, duree = 950): (() => void) | undefined {
  if (SAIT_D) return undefined
  const nombres = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const morceaux = (d: string) => d.split(/-?\d*\.?\d+/g)
  // « d » : l'attribut du tracé ; « clip » : la découpe CSS clip-path: path() d'un groupe
  const poser = (el: SVGElement, quoi: 'd' | 'clip', d: string) => { if (quoi === 'clip') el.style.clipPath = `path('${d}')`; else el.setAttribute('d', d) }
  const prep = cibles
    .filter((c): c is [SVGElement, string[], ('d' | 'clip')?] => !!c[0])
    .map(([el, images, quoi]) => ({ el, images, quoi: quoi ?? 'd', n: images.map(nombres), m: morceaux(images[images.length - 1]) }))
  let id = 0
  const debut = performance.now()
  const pas = (t: number) => {
    const u = Math.min(1, (t - debut) / duree)
    const f = u * 8, k = Math.min(7, Math.floor(f)), v = f - k
    for (const c of prep) {
      const a = c.n[k], b = c.n[k + 1]
      if (a.length !== b.length) continue
      let d = c.m[0]
      for (let i = 0; i < a.length; i++) d += String(Math.round((a[i] + (b[i] - a[i]) * v) * 10) / 10) + c.m[i + 1]
      poser(c.el, c.quoi, d)
    }
    if (u < 1) id = requestAnimationFrame(pas)
  }
  pas(debut)
  return () => {
    cancelAnimationFrame(id)
    for (const c of prep) poser(c.el, c.quoi, c.images[c.images.length - 1])
  }
}
