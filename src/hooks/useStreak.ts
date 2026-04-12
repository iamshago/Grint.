import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

/** Couleur d'accent par catégorie de séance */
export const CATEGORY_ACCENT: Record<string, string> = {
  upper: '#ffee8c',
  lower: '#507fff',
  bbl: '#ff63b3',
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const
export { DAY_LABELS }

export interface WeekDay {
  category: string | null
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
 * Le streak = nombre de semaines consécutives validées.
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

      // Séances de la semaine courante
      const { data: weekCompleted } = await supabase
        .from('completed_workouts')
        .select('completed_at, workouts(category)')
        .eq('user_id', uid)
        .gte('completed_at', monday.toISOString())
        .lte('completed_at', sunday.toISOString())

      const days: WeekDay[] = Array.from({ length: 7 }, () => ({ category: null }))
      let upperCount = 0
      let lowerCount = 0

      weekCompleted?.forEach((cw: any) => {
        const d = new Date(cw.completed_at)
        const dow = (d.getDay() + 6) % 7
        const cat = cw.workouts?.category || null
        if (cat) {
          days[dow] = { category: cat }
          if (cat === 'upper') upperCount++
          if (cat === 'lower' || cat === 'bbl') lowerCount++
        }
      })
      setWeekDays(days)

      // Calcul du streak : semaines consécutives avec upper ET lower
      let streak = 0
      if (upperCount > 0 && lowerCount > 0) streak++

      for (let w = 1; w <= 52; w++) {
        const wMon = new Date(monday)
        wMon.setDate(monday.getDate() - 7 * w)
        const wSun = new Date(wMon)
        wSun.setDate(wMon.getDate() + 6)
        wSun.setHours(23, 59, 59, 999)

        const { data: pastWeek } = await supabase
          .from('completed_workouts')
          .select('workouts(category)')
          .eq('user_id', uid)
          .gte('completed_at', wMon.toISOString())
          .lte('completed_at', wSun.toISOString())

        let hasUpper = false
        let hasLower = false
        pastWeek?.forEach((cw: any) => {
          const c = cw.workouts?.category
          if (c === 'upper') hasUpper = true
          if (c === 'lower' || c === 'bbl') hasLower = true
        })

        if (hasUpper && hasLower) streak++
        else break
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
 */
export async function computeStreakForUser(userId: string): Promise<number> {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  let streak = 0
  for (let w = 0; w <= 52; w++) {
    const wMon = new Date(monday)
    wMon.setDate(monday.getDate() - 7 * w)
    const wSun = new Date(wMon)
    wSun.setDate(wMon.getDate() + 6)
    wSun.setHours(23, 59, 59, 999)

    const { data: weekData } = await supabase
      .from('completed_workouts')
      .select('workouts(category)')
      .eq('user_id', userId)
      .gte('completed_at', wMon.toISOString())
      .lte('completed_at', wSun.toISOString())

    let hasUpper = false
    let hasLower = false
    weekData?.forEach((cw: any) => {
      const c = cw.workouts?.category
      if (c === 'upper') hasUpper = true
      if (c === 'lower' || c === 'bbl') hasLower = true
    })

    if (hasUpper && hasLower) streak++
    else if (w > 0) break
  }

  return streak
}
