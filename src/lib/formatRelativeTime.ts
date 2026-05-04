/** Formatage français d'un horodatage relatif : "À l'instant", "Il y a 3 heures", "Il y a 2 jours"... */
export function formatRelativeTime(input: string | Date, now: Date = new Date()): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 45) return "À l'instant"

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `Il y a ${diffMin} min`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `Il y a ${diffHour} ${diffHour === 1 ? 'heure' : 'heures'}`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `Il y a ${diffDay} ${diffDay === 1 ? 'jour' : 'jours'}`

  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 5) return `Il y a ${diffWeek} ${diffWeek === 1 ? 'semaine' : 'semaines'}`

  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `Il y a ${diffMonth} ${diffMonth === 1 ? 'mois' : 'mois'}`

  const diffYear = Math.floor(diffDay / 365)
  return `Il y a ${diffYear} ${diffYear === 1 ? 'an' : 'ans'}`
}

const SHORT_MONTHS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

/** "4 juil." — calé sur UTC pour rester cohérent avec les valeurs stockées en base. */
export function formatShortDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]}`
}

/** "4 juillet" — calé sur UTC. */
const LONG_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
export function formatLongDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return `${date.getUTCDate()} ${LONG_MONTHS[date.getUTCMonth()]}`
}
