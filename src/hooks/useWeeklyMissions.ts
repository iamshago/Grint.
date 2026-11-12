import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentLocalWeekBounds } from '@/lib/weekBounds'

/** Missions de la semaine du défi Winter (aucune ne donne de points, chacune une médaille). */
export interface WeeklyMissions {
  /** En duo : pas encore branché (invitation à construire), toujours faux. */
  duo: boolean
  /** Au moins une séance haut du corps ET une séance bas du corps (BBL compte en bas). */
  hautBas: boolean
  /** Un record battu cette semaine (post « pr » automatique). */
  record: boolean
  done: number
  total: number
}

const EMPTY: WeeklyMissions = { duo: false, hautBas: false, record: false, done: 0, total: 3 }

interface CategoryRow {
  category: string | null
  workouts: { category: string | null } | null
}

/**
 * Missions de la semaine en cours (lundi 00:00 → dimanche, heure locale).
 * Comme les points, rien ne compte avant `countFrom` = max(starts_at, joined_at) :
 * on lit à partir de max(lundi, countFrom).
 */
export function useWeeklyMissions(userId: string | null, countFrom: string | null, enabled: boolean) {
  const [missions, setMissions] = useState<WeeklyMissions>(EMPTY)

  const fetch = useCallback(async () => {
    if (!enabled || !userId || !countFrom) {
      setMissions(EMPTY)
      return
    }
    const now = new Date()
    if (now < new Date(countFrom)) {
      setMissions(EMPTY)
      return
    }
    const week = getCurrentLocalWeekBounds(now)
    const from = new Date(Math.max(new Date(week.startISO).getTime(), new Date(countFrom).getTime())).toISOString()

    const [{ data: cw }, { data: prs }] = await Promise.all([
      supabase
        .from('completed_workouts')
        .select('category, workouts(category)')
        .eq('user_id', userId)
        .gte('completed_at', from)
        .lte('completed_at', week.endISO),
      supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'pr')
        .gte('created_at', from)
        .lte('created_at', week.endISO),
    ])

    let hasUpper = false
    let hasLower = false
    for (const row of (cw ?? []) as unknown as CategoryRow[]) {
      const c = row.category || row.workouts?.category
      if (c === 'upper') hasUpper = true
      if (c === 'lower' || c === 'bbl') hasLower = true
    }
    const hautBas = hasUpper && hasLower
    const record = (prs ?? []).length > 0
    setMissions({ duo: false, hautBas, record, done: Number(hautBas) + Number(record), total: 3 })
  }, [userId, countFrom, enabled])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { missions, refresh: fetch }
}
