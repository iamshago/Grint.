import { useState } from 'react'
import type { WeekDay } from '@/hooks/useStreak'

const lire = (cle: string) => {
  try { return localStorage.getItem(cle) } catch { return null }
}

/**
 * Quelle journée de la carte streak doit se cocher toute seule : la dernière séance de la
 * semaine, une seule fois (mémorisée dans localStorage `grint-streak-fete:<id>` = son heure).
 * Si plusieurs séances sont tombées depuis la dernière visite, seule la dernière est fêtée.
 */
export function useJourAFeter(userId: string | null, weekDays: WeekDay[]) {
  const [, setVu] = useState(0)
  let dernier: number | null = null
  weekDays.forEach((d, i) => {
    if (d.category && d.completedAt && (dernier === null || d.completedAt > (weekDays[dernier].completedAt as string))) dernier = i
  })
  const heure = dernier !== null ? (weekDays[dernier].completedAt as string) : null
  const cle = userId ? `grint-streak-fete:${userId}` : null
  const fetee = cle ? lire(cle) : null
  const aFeter = heure && cle && (!fetee || Date.parse(heure) > Date.parse(fetee)) ? dernier : null

  const marquerFete = () => {
    if (!cle || !heure) return
    try { localStorage.setItem(cle, heure) } catch { /* stockage indisponible : la coche se rejouera */ }
    setVu((n) => n + 1)
  }
  return { aFeter, dernier, marquerFete }
}
