import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Challenge, ChallengeProgress, ChallengeRanking, ProfileSummary } from '@/types'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

interface UseChallengeProgressResult {
  challenge: Challenge | null
  progress: ChallengeProgress | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Calcule la progression d'un défi (équipe + classement individuel).
 *
 * Variables :
 *  - N = nombre de participants
 *  - S = sessions_per_week_per_member
 *  - W_total = ceil((ends_at - starts_at) / 7j)
 *  - W_elapsed = clamp(now - starts_at, 0..W_total)
 *  - totalGoal = S × N × W_total
 *  - totalCompleted = SUM completed_workouts de tous les participants entre starts_at et min(now, ends_at)
 *  - pts(p) = nb completed_workouts entre joined_at(p) et min(now, ends_at)
 *  - sessionsPerWeek(p) = pts / max(1, semaines depuis joined_at)
 */
export function useChallengeProgress(challengeId: string | null | undefined): UseChallengeProgressResult {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [progress, setProgress] = useState<ChallengeProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!challengeId) {
      setChallenge(null)
      setProgress(null)
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { data: ch, error: e1 } = await supabase
        .from('challenges')
        .select('id, name, description, hero_image_url, cover_image_url, starts_at, ends_at, sessions_per_week_per_member, is_active')
        .eq('id', challengeId)
        .maybeSingle()

      if (e1) throw e1
      if (!ch) {
        setChallenge(null)
        setProgress(null)
        return
      }
      const challengeRow = ch as Challenge
      setChallenge(challengeRow)

      const startsAt = new Date(challengeRow.starts_at)
      const endsAt = new Date(challengeRow.ends_at)
      const now = new Date()
      const windowEnd = endsAt < now ? endsAt : now

      // Participants + leur profile (jointure manuelle, pas de FK déclarée vers profiles)
      const { data: parts, error: e2 } = await supabase
        .from('challenge_participants')
        .select('user_id, joined_at')
        .eq('challenge_id', challengeRow.id)

      if (e2) throw e2
      const participants = (parts ?? []) as Array<{ user_id: string; joined_at: string }>
      const N = participants.length

      // Profils
      const userIds = participants.map((p) => p.user_id)
      let profilesById: Record<string, ProfileSummary> = {}
      if (userIds.length > 0) {
        const { data: profs, error: e3 } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_id, avatar_url, username')
          .in('id', userIds)
        if (e3) throw e3
        profilesById = Object.fromEntries(
          (profs ?? []).map((p: ProfileSummary) => [p.id, p]),
        )
      }

      // Séances complétées par tous les participants dans la fenêtre du défi
      let totalCompleted = 0
      const ptsByUser: Record<string, number> = {}
      if (userIds.length > 0) {
        const { data: cw, error: e4 } = await supabase
          .from('completed_workouts')
          .select('user_id, completed_at')
          .in('user_id', userIds)
          .gte('completed_at', startsAt.toISOString())
          .lte('completed_at', windowEnd.toISOString())

        if (e4) throw e4
        for (const row of cw ?? []) {
          if (!row.user_id) continue
          // pts par utilisateur : on ne compte qu'à partir de son joined_at
          const part = participants.find((p) => p.user_id === row.user_id)
          if (!part) continue
          const completedAt = new Date(row.completed_at as string)
          if (completedAt < new Date(part.joined_at)) continue
          ptsByUser[row.user_id] = (ptsByUser[row.user_id] ?? 0) + 1
          totalCompleted += 1
        }
      }

      const weeksTotal = Math.max(1, Math.ceil((endsAt.getTime() - startsAt.getTime()) / ONE_WEEK_MS))
      const elapsedMs = Math.min(now.getTime(), endsAt.getTime()) - startsAt.getTime()
      const weeksElapsed = Math.max(0, Math.min(weeksTotal, elapsedMs / ONE_WEEK_MS))

      const S = challengeRow.sessions_per_week_per_member
      const weeklyTarget = S * N
      const totalGoal = weeklyTarget * weeksTotal

      const ranking: ChallengeRanking[] = participants
        .map((p) => {
          const pts = ptsByUser[p.user_id] ?? 0
          const joinedMs = new Date(p.joined_at).getTime()
          const personalElapsedWeeks = Math.max(
            1,
            (Math.min(now.getTime(), endsAt.getTime()) - joinedMs) / ONE_WEEK_MS,
          )
          const sessionsPerWeek = pts / personalElapsedWeeks
          return {
            user_id: p.user_id,
            joined_at: p.joined_at,
            profile: profilesById[p.user_id],
            pts,
            sessionsPerWeek,
          }
        })
        .sort((a, b) => b.pts - a.pts)

      setProgress({
        totalCompleted,
        totalGoal,
        participantCount: N,
        weeklyTarget,
        weeksTotal,
        weeksElapsed,
        ranking,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [challengeId])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { challenge, progress, loading, error, refresh: fetch }
}
