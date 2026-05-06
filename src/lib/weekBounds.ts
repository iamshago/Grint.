/**
 * Bornes de la semaine courante en heure locale utilisateur.
 * Lundi 00:00:00.000 → Dimanche 23:59:59.999.
 *
 * Utilisé pour le filtrage des séances de la semaine en cours dans le défi
 * collectif (cf. brief community-defi-weekly-bar). Les bornes sont calculées
 * côté client puis passées en ISO à Supabase, qui compare en UTC — c'est cohérent
 * tant qu'on respecte la même base (Date locale → toISOString()).
 */
export function getCurrentLocalWeekBounds(now: Date = new Date()): {
  startISO: string
  endISO: string
} {
  const start = new Date(now)
  // getDay() : 0=dim, 1=lun, ..., 6=sam. On veut lundi comme jour 0.
  const dayOfWeek = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  end.setMilliseconds(end.getMilliseconds() - 1)

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  }
}
