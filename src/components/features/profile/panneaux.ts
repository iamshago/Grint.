/** État d'un panneau de la carte performance (O3) : visible ou non, et son animation d'entrée / sortie. */
export interface PanneauProps {
  vis: 'visible' | 'hidden'
  op: number
  clic: 'auto' | 'none'
  /** Décalage du glissé (« 36px » ou « -36px ») */
  sens: string
  cls: string
}

const SAIT_D = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('d', 'path("M0 0")')

/**
 * Onde de la crête pour les navigateurs qui n'animent pas la propriété CSS `d` (Safari) :
 * mêmes neuf images clés, même durée (0,95 s, linéaire), interpolées image par image.
 * Retourne de quoi l'arrêter. Ne fait rien là où le CSS de la planche s'en charge.
 */
export function animerOndeSansCss(cibles: Array<[SVGPathElement | null | undefined, string[]]>, duree = 950): (() => void) | undefined {
  if (SAIT_D) return undefined
  const nombres = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const morceaux = (d: string) => d.split(/-?\d*\.?\d+/g)
  const prep = cibles
    .filter((c): c is [SVGPathElement, string[]] => !!c[0])
    .map(([el, images]) => ({ el, images, n: images.map(nombres), m: morceaux(images[images.length - 1]) }))
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
      c.el.setAttribute('d', d)
    }
    if (u < 1) id = requestAnimationFrame(pas)
  }
  pas(debut)
  return () => {
    cancelAnimationFrame(id)
    for (const c of prep) c.el.setAttribute('d', c.images[c.images.length - 1])
  }
}
