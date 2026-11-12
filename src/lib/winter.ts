import type { Challenge, ChallengeRanking } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Illustration de la montagne Winter (terrasses) et son chemin, calculé sur l'image
 *  (canevas/outils/terrasses.py, points de passage [[90,262],[240,230],[150,185],[160,102],[183,60]]).
 *  Le chemin est en unités de la carte 370 × 330.
 *  `image` = la nuit (lune), `imageJour` = la même image en plein jour (canevas/outils/jour.py :
 *  même rendu, même cadrage ; ciel, soleil à la place de la lune, nuages et lumière changés). */
export const WINTER_MONTAGNE = {
  image: '/assets/challenges/winter-montagne.jpg',
  imageJour: '/assets/challenges/winter-montagne-jour.jpg',
  tete: '/assets/challenges/winter-tete.jpg',
  largeur: 370,
  hauteur: 330,
  trace:
    'M90 262.7 C90.2 263.7 89.7 267.2 91 269 C92.2 270.8 95.2 272.6 97.5 273.5 C99.8 274.5 102.2 274.4 104.5 274.5 C106.8 274.6 109.2 274.5 111.5 274.4 C113.8 274.3 116.2 273.9 118.5 274 C120.8 274.1 123.2 274.7 125.5 275.2 C127.8 275.6 130.2 276.4 132.5 276.7 C134.8 277 137.2 276.9 139.5 277 C141.8 277.1 144.2 277 146.5 277 C148.8 277 151.2 277 153.5 277 C155.8 277 158.2 277.2 160.5 277 C162.8 276.8 165.2 276.7 167.5 276.1 C169.8 275.5 172.2 274.4 174.5 273.2 C176.8 272 179.2 270.2 181.5 268.8 C183.8 267.4 186.2 266.1 188.5 264.9 C190.8 263.8 193.2 262.8 195.5 261.9 C197.8 261 200.2 260.5 202.5 259.5 C204.8 258.5 207.2 257.3 209.5 256.1 C211.8 254.9 214.2 253.6 216.5 252.3 C218.8 250.9 221.2 249.3 223.5 247.9 C225.8 246.5 228.2 245.5 230.5 243.7 C232.8 241.9 235.9 239.3 237.5 237 C239.1 234.7 239.7 232.3 240.2 230 C240.7 227.7 240.5 225.3 240.5 223 C240.5 220.7 241.1 218.3 240 216 C239 213.7 236 211.3 234.3 209 C232.7 206.7 230.9 204.3 230.1 202 C229.3 199.7 230 197.3 229.5 195 C229 192.7 228.9 190.1 227.4 188 C225.9 185.9 222.8 183.5 220.5 182.6 C218.2 181.7 215.8 182.5 213.5 182.6 C211.2 182.7 208.8 183.1 206.5 183.3 C204.2 183.5 201.8 183.9 199.5 184 C197.2 184.1 194.8 184 192.5 184 C190.2 184 187.8 183.9 185.5 184 C183.2 184.1 180.8 184.5 178.5 184.8 C176.2 185 173.8 185.4 171.5 185.5 C169.2 185.6 166.8 185.5 164.5 185.3 C162.2 185.2 159.8 184.7 157.5 184.5 C155.2 184.3 152.8 184.6 150.5 184.4 C148.2 184.2 145.8 183.4 143.5 183.1 C141.2 182.8 138.8 182.8 136.5 182.4 C134.2 182 131.8 182.1 129.5 180.8 C127.2 179.5 124.5 176.7 122.5 174.5 C120.5 172.3 118.4 169.8 117.6 167.5 C116.8 165.2 116.7 162.8 117.6 160.5 C118.5 158.2 120.9 156 123 154 C125.1 152 127.7 150.2 130 148.5 C132.3 146.8 134.7 145.3 137 144 C139.3 142.6 141.7 141.6 144 140.6 C146.3 139.6 148.7 139.1 151 138.1 C153.3 137.1 155.7 135.7 158 134.6 C160.3 133.5 162.7 132.6 165 131.6 C167.3 130.6 169.7 129.9 172 128.6 C174.3 127.4 176.7 126 179 124.3 C181.3 122.6 183.7 120.5 186 118.5 C188.3 116.5 191.6 114.3 193 112.1 C194.3 110 195 107 194 105.5 C193.1 104 189.8 103.5 187.5 103 C185.2 102.5 182.8 102.6 180.5 102.5 C178.2 102.5 175.8 102.5 173.5 102.5 C171.2 102.5 168.6 102.7 166.5 102.5 C164.4 102.3 161 102.6 160.7 101.2 C160.4 99.9 163.7 96.8 164.7 94.5 C165.8 92.2 165.8 89.8 166.9 87.5 C168 85.2 169.9 82.8 171.5 80.5 C173.1 78.2 175.1 75.8 176.6 73.5 C178.1 71.2 179.3 68.6 180.5 66.5 C181.6 64.4 182.9 61.7 183.4 60.7',
}

/** Au-delà de ce nombre de participants, la montagne passe en « foule » (C7) : visages des amis en piles. */
export const SEUIL_FOULE = 10

/** Vrai pour un défi « chacun pour soi » avec sommet (Winter). */
export function isSummitChallenge(challenge: Challenge | null | undefined): boolean {
  return !!challenge && typeof challenge.summit_points === 'number' && challenge.summit_points > 0
}

/** Nombre de semaines du défi, arrondi (Winter : 12). */
export function challengeWeeks(challenge: Challenge): number {
  const ms = new Date(challenge.ends_at).getTime() - new Date(challenge.starts_at).getTime()
  return Math.max(1, Math.round(ms / (7 * DAY_MS)))
}

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY)

/**
 * Ordre de la course : points décroissants ; à égalité, celui qui a eu son dernier
 * point le plus tôt reste devant (il y était avant), puis le premier inscrit.
 */
export function sortRace(ranking: ChallengeRanking[]): ChallengeRanking[] {
  return [...ranking].sort(
    (a, b) =>
      b.pts - a.pts ||
      time(a.lastPointAt) - time(b.lastPointAt) ||
      time(a.joined_at) - time(b.joined_at),
  )
}

/** Places de lundi (points d'avant la semaine), pour les flèches ▲ ▼ de chaque ligne. */
export function mondayRanks(ranking: ChallengeRanking[]): Record<string, number> {
  const lundi = [...ranking]
    .map((r) => ({ id: r.user_id, pts: r.pts - (r.ptsThisWeek ?? 0), joined: time(r.joined_at) }))
    .sort((a, b) => b.pts - a.pts || a.joined - b.joined)
  return Object.fromEntries(lundi.map((r, i) => [r.id, i + 1]))
}

/** Ta place dans la course (même ordre que la liste), null si tu n'y es pas. */
export function placeOf(ranking: ChallengeRanking[], userId: string | null): number | null {
  if (!userId) return null
  const i = sortRace(ranking).findIndex((r) => r.user_id === userId)
  return i >= 0 ? i + 1 : null
}

/** « 1er », « 2e »… découpé en chiffre + suffixe pour l'exposant. */
export function placeParts(place: number): { n: string; suffix: string } {
  return { n: String(place), suffix: place === 1 ? 'er' : 'e' }
}

/** Jours calendaires (heure locale) avant le départ : 4 le jeudi 12 pour un départ le lundi 16. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const start = new Date(iso)
  const a = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((a.getTime() - b.getTime()) / DAY_MS))
}

/** Ce qu'on retient de ta dernière visite de la page défi, pour animer l'arrivée. */
export interface WinterVisit {
  ranks: Record<string, number>
  pts: number
}

const visitKey = (challengeId: string) => `winter-visite:${challengeId}`

export function readVisit(challengeId: string): WinterVisit | null {
  try {
    const raw = window.localStorage.getItem(visitKey(challengeId))
    return raw ? (JSON.parse(raw) as WinterVisit) : null
  } catch {
    return null
  }
}

export function saveVisit(challengeId: string, visit: WinterVisit): void {
  try {
    window.localStorage.setItem(visitKey(challengeId), JSON.stringify(visit))
  } catch {
    // stockage indisponible (navigation privée) : l'animation partira de lundi
  }
}
