import type { Challenge, ChallengeRanking } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Vrai pour un défi « chacun pour soi » avec sommet (Winter). */
export function isSummitChallenge(challenge: Challenge | null | undefined): boolean {
  return !!challenge && typeof challenge.summit_points === 'number' && challenge.summit_points > 0
}

/** Nombre de semaines du défi, arrondi (Winter : 12). */
export function challengeWeeks(challenge: Challenge): number {
  const ms = new Date(challenge.ends_at).getTime() - new Date(challenge.starts_at).getTime()
  return Math.max(1, Math.round(ms / (7 * DAY_MS)))
}

/** Place dans la course : 1 + nombre de participants qui ont plus de points (ex æquo partagés). */
export function placeOf(ranking: ChallengeRanking[], userId: string | null): number | null {
  const me = ranking.find((r) => r.user_id === userId)
  if (!me) return null
  return 1 + ranking.filter((r) => r.pts > me.pts).length
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
