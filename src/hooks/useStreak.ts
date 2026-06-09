import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const
export { DAY_LABELS }

export interface WeekDay {
  category: string | null
}

/**
 * Ligne de completed_workouts pour le streak (category dénormalisée + fallback
 * sur le join to-one `workouts`). On caste via `as unknown as` car supabase-js
 * (sans types générés) infère l'embed to-one comme un tableau alors qu'au
 * runtime PostgREST renvoie un objet.
 */
interface CompletedCategoryRow {
  completed_at: string
  category: string | null
  workouts: { category: string | null } | null
}

export interface StreakData {
  streakCount: number
  weekDays: WeekDay[]
  loading: boolean
}

/**
 * Hook partagé pour calculer le streak d'un utilisateur.
 *
 * Règle métier : une semaine est validée si l'utilisateur a fait
 * ≥1 séance upper ET ≥1 séance lower/bbl dans la même semaine.
 * Le streak = nombre TOTAL de semaines validées sur la fenêtre glissante de
 * 52 semaines (cumulatif). Une semaine de pause (trou) ne remet PAS le compteur
 * à zéro : on compte simplement toutes les semaines validées, trous inclus.
 * (Décision produit du 2026-06-09 : on abandonne le streak « consécutif » au
 * profit du cumul, pour ne pas effacer l'historique sur une semaine off.)
 *
 * @param userId - UUID de l'utilisateur (null = pas de fetch)
 */
export function useStreak(userId: string | null | undefined): StreakData {
  const [streakCount, setStreakCount] = useState(0)
  const [weekDays, setWeekDays] = useState<WeekDay[]>(
    Array.from({ length: 7 }, () => ({ category: null }))
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    computeStreak(userId)
  }, [userId])

  async function computeStreak(uid: string) {
    try {
      setLoading(true)

      // Bornes de la semaine courante (lundi → dimanche)
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      // Séances de la semaine courante. `category` est dénormalisée sur
      // completed_workouts (séances perso + catalogue récent) ; fallback sur le
      // join `workouts` pour les anciennes lignes catalogue non backfillées.
      const { data: weekCompleted } = await supabase
        .from('completed_workouts')
        .select('completed_at, category, workouts(category)')
        .eq('user_id', uid)
        .gte('completed_at', monday.toISOString())
        .lte('completed_at', sunday.toISOString())

      const days: WeekDay[] = Array.from({ length: 7 }, () => ({ category: null }))
      let upperCount = 0
      let lowerCount = 0

      const weekRows = (weekCompleted ?? []) as unknown as CompletedCategoryRow[]
      weekRows.forEach((cw) => {
        const d = new Date(cw.completed_at)
        const dow = (d.getDay() + 6) % 7
        const cat = cw.category || cw.workouts?.category || null
        if (cat) {
          days[dow] = { category: cat }
          if (cat === 'upper') upperCount++
          if (cat === 'lower' || cat === 'bbl') lowerCount++
        }
      })
      setWeekDays(days)

      // Calcul du streak : nombre TOTAL de semaines validées (upper ET lower)
      // sur la fenêtre glissante de 52 semaines. Cumulatif — un trou ne casse pas
      // la série, on continue à compter (pas de `break`). Semaine courante (si
      // validée) + 51 semaines passées = 52 semaines au plus → streak ≤ 52.
      let streak = 0
      if (upperCount > 0 && lowerCount > 0) streak++

      for (let w = 1; w <= 51; w++) {
        const wMon = new Date(monday)
        wMon.setDate(monday.getDate() - 7 * w)
        const wSun = new Date(wMon)
        wSun.setDate(wMon.getDate() + 6)
        wSun.setHours(23, 59, 59, 999)

        const { data: pastWeek } = await supabase
          .from('completed_workouts')
          .select('category, workouts(category)')
          .eq('user_id', uid)
          .gte('completed_at', wMon.toISOString())
          .lte('completed_at', wSun.toISOString())

        let hasUpper = false
        let hasLower = false
        const pastRows = (pastWeek ?? []) as unknown as CompletedCategoryRow[]
        pastRows.forEach((cw) => {
          const c = cw.category || cw.workouts?.category
          if (c === 'upper') hasUpper = true
          if (c === 'lower' || c === 'bbl') hasLower = true
        })

        if (hasUpper && hasLower) streak++
      }

      setStreakCount(streak)
    } catch (e) {
      console.error('Erreur useStreak:', e)
    } finally {
      setLoading(false)
    }
  }

  return { streakCount, weekDays, loading }
}

/**
 * Fonction utilitaire (non-hook) pour calculer le streak d'un utilisateur.
 * Utilisable dans des boucles / Promise.all contrairement au hook.
 *
 * Même règle que `useStreak` : streak = nombre TOTAL de semaines validées sur
 * la fenêtre glissante de 52 semaines (cumulatif, les trous ne resettent pas).
 * w=0 = semaine courante → 52 semaines au plus (w=0..51).
 */
export async function computeStreakForUser(userId: string): Promise<number> {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  let streak = 0
  for (let w = 0; w <= 51; w++) {
    const wMon = new Date(monday)
    wMon.setDate(monday.getDate() - 7 * w)
    const wSun = new Date(wMon)
    wSun.setDate(wMon.getDate() + 6)
    wSun.setHours(23, 59, 59, 999)

    const { data: weekData } = await supabase
      .from('completed_workouts')
      .select('category, workouts(category)')
      .eq('user_id', userId)
      .gte('completed_at', wMon.toISOString())
      .lte('completed_at', wSun.toISOString())

    let hasUpper = false
    let hasLower = false
    const weekRows = (weekData ?? []) as unknown as CompletedCategoryRow[]
    weekRows.forEach((cw) => {
      const c = cw.category || cw.workouts?.category
      if (c === 'upper') hasUpper = true
      if (c === 'lower' || c === 'bbl') hasLower = true
    })

    if (hasUpper && hasLower) streak++
  }

  return streak
}
