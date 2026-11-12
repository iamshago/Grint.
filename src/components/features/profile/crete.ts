/**
 * Le record en profil d'altitude (maquette O3 v2) : géométrie de la crête, reprise telle quelle du
 * script de la planche (canevas/project/O3-Profil-altitude.dc.html). Zone de 370 × 330 sous les
 * puces d'exercice. Historique d'un exercice = poids max de chaque séance ; chaque nouveau record
 * est un point, le meilleur est le sommet.
 */

export interface SeanceRecord {
  /** Jour de la séance (numéro de jour, pour l'écart entre séances) */
  j: number
  /** Poids max de la séance (kg) */
  v: number
  /** « 23 oct. » */
  date: string
}

export interface ExoRecord {
  nom: string
  seances: SeanceRecord[]
}

export interface Point { x: number; y: number }
export interface PointRecord extends Point { i: number; j: number; v: number; rec: boolean; date: string; k?: number }
interface Noeud extends Point { data: number }
type Segment = [Point, Point, Point, Point]

export const W = 370, X0 = 24, X1 = 322, YS = 84, YB = 200, T = 238, CX = 185, NG = 41
export const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
export const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))
export const r1 = (v: number) => Math.round(v * 10) / 10

/** Courbe monotone (aucun dépassement : le sommet reste le point le plus haut). */
export function segments(P: Point[]): Segment[] {
  const n = P.length, m: number[] = [], t: number[] = []
  for (let i = 0; i < n - 1; i++) m.push((P[i + 1].y - P[i].y) / (P[i + 1].x - P[i].x))
  t[0] = m[0]; t[n - 1] = m[n - 2]
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i] }
  }
  const out: Segment[] = []
  for (let i = 0; i < n - 1; i++) {
    const dx = P[i + 1].x - P[i].x
    out.push([P[i], { x: P[i].x + dx / 3, y: P[i].y + t[i] * dx / 3 }, { x: P[i + 1].x - dx / 3, y: P[i + 1].y - t[i + 1] * dx / 3 }, P[i + 1]])
  }
  return out
}

export const bez = (s: Segment, u: number): Point => {
  const a = 1 - u
  return {
    x: a * a * a * s[0].x + 3 * a * a * u * s[1].x + 3 * a * u * u * s[2].x + u * u * u * s[3].x,
    y: a * a * a * s[0].y + 3 * a * a * u * s[1].y + 3 * a * u * u * s[2].y + u * u * u * s[3].y,
  }
}

export interface Geo {
  ex: ExoRecord
  pts: PointRecord[]
  iS: number
  vmax: number
  nRec: number
  noeuds: Noeud[]
}

/**
 * Géométrie d'un exercice : une grille fixe de ng nœuds (même structure pour tous, pour que la crête
 * ondule d'une forme à l'autre) ; chaque séance prend la place du nœud le plus proche ; petits
 * accidents entre deux séances.
 */
export function geo(ex: ExoRecord, ng: number = NG): Geo {
  const nom = ex.nom
  let max = -1, nRec = 0
  const pts: PointRecord[] = ex.seances.map((s, i) => {
    const rec = s.v > max
    if (rec) { max = s.v; nRec++ }
    return { i, j: s.j, v: s.v, rec, date: s.date, x: 0, y: 0 }
  })
  const vals = pts.map((p) => p.v)
  const vmin = Math.min(...vals), vmax = Math.max(...vals)
  const j0 = pts[0].j, j1 = pts[pts.length - 1].j
  // Une seule séance, ou toutes au même poids : la crête reste à mi-hauteur (absent de la planche)
  pts.forEach((p) => {
    p.x = j1 > j0 ? X0 + (p.j - j0) / (j1 - j0) * (X1 - X0) : (X0 + X1) / 2
    p.y = vmax > vmin ? YB - (p.v - vmin) / (vmax - vmin) * (YB - YS) : (YS + YB) / 2
  })
  const grille: Noeud[] = []
  for (let k = 0; k < ng; k++) grille.push({ x: X0 + (X1 - X0) * k / (ng - 1), y: 0, data: -1 })
  pts.forEach((p, i) => {
    let k = Math.round((p.x - X0) / (X1 - X0) * (ng - 1))
    while (grille[k].data >= 0 && k < ng - 1) k++
    grille[k].x = p.x; grille[k].data = i; p.k = k
  })
  if (pts.length < 2) {
    grille.forEach((g) => { g.y = pts[0].y })
  } else {
    const base = segments(pts)
    const hasard = (k: number) => { const s = Math.sin(k * 12.9898 + nom.length * 78.233) * 43758.5453; return (s - Math.floor(s)) * 2 - 1 }
    grille.forEach((g, k) => {
      if (g.data >= 0) { g.y = pts[g.data].y; return }
      let i = 0
      while (i < pts.length - 2 && pts[i + 1].x < g.x) i++
      const sg = base[i], a = sg[0], b = sg[3]
      let y = bez(sg, (g.x - a.x) / (b.x - a.x)).y + hasard(k) * 1.7
      y = Math.max(Math.min(a.y, b.y) - 1.6, Math.min(Math.max(a.y, b.y) + 1.6, y))
      g.y = Math.max(y, YS + 3)
    })
  }
  return { ex, pts, iS: vals.indexOf(vmax), vmax, nRec, noeuds: grille }
}

export interface Chemins { trace: string; longue: string; sous: string; segs: Segment[] }

/** Les trois chemins tirés des nœuds : le tracé fait, la crête prolongée par ses flancs, et la surface dessous. */
export function chemins(N: Point[]): Chemins {
  const segs = segments(N)
  const corps = segs.map((s) => 'C' + r1(s[1].x) + ' ' + r1(s[1].y) + ' ' + r1(s[2].x) + ' ' + r1(s[2].y) + ' ' + r1(s[3].x) + ' ' + r1(s[3].y)).join(' ')
  const P0 = N[0], PN = N[N.length - 1]
  const yA = Math.min(P0.y + 16, T - 6), yE = Math.min(PN.y + 36, T - 10)
  const longue = 'M0 ' + r1(yA) + ' C8 ' + r1(yA - 2) + ' ' + (X0 - 10) + ' ' + r1(P0.y + 3) + ' ' + r1(P0.x) + ' ' + r1(P0.y) + ' ' + corps + ' C' + r1(PN.x + 14) + ' ' + r1(PN.y + 2) + ' ' + (W - 14) + ' ' + r1(yE - 6) + ' ' + W + ' ' + r1(yE)
  return { trace: 'M' + r1(P0.x) + ' ' + r1(P0.y) + ' ' + corps, longue, sous: longue + ' L' + W + ' 350 L0 350 Z', segs }
}

/** L'onde : neuf images clés du chemin, chaque nœud part à son tour de gauche à droite et dépasse un peu. */
export function ondeImages(A: Noeud[], B: Noeud[], fin: Chemins): Record<'trace' | 'sous' | 'longue', string[]> {
  const ressort = (u: number) => 1 + 2.3 * Math.pow(u - 1, 3) + 1.3 * Math.pow(u - 1, 2)
  const v: Record<'trace' | 'sous' | 'longue', string[]> = { trace: [], sous: [], longue: [] }
  for (let f = 0; f <= 8; f++) {
    const t = f / 8
    const N = B.map((b, k) => {
      const a = A[k]
      const u = Math.min(1, Math.max(0, (t - 0.35 * b.x / W) / 0.65))
      const p = u <= 0 ? 0 : ressort(u)
      return { x: a.x + (b.x - a.x) * Math.min(1, p), y: a.y + (b.y - a.y) * p }
    })
    const ch = f === 8 ? fin : chemins(N)
    v.trace.push(ch.trace); v.sous.push(ch.sous); v.longue.push(ch.longue)
  }
  return v
}

/** Longueurs cumulées du tracé, et moment où le trait (dessiné en 1,1 s, sortie douce) atteint une fraction. */
export function minuteur(segs: Segment[]) {
  const longueurs = [0]
  let L = 0
  segs.forEach((s) => { let prec = s[0]; for (let k = 1; k <= 16; k++) { const q = bez(s, k / 16); L += Math.hypot(q.x - prec.x, q.y - prec.y); prec = q } longueurs.push(L) })
  const cb = (s: number, p1: number, p2: number) => 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s
  const quand = (f: number) => { let lo = 0, hi = 1; for (let k = 0; k < 28; k++) { const mi = (lo + hi) / 2; if (cb(mi, 1, 1) < f) lo = mi; else hi = mi } return 0.15 + 1.1 * cb((lo + hi) / 2, 0.22, 0.36) }
  return { longueurs, L, quand }
}
