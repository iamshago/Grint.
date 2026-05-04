import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Challenge } from '@/types'

interface UseActiveChallengeResult {
  challenge: Challenge | null
  isParticipant: boolean
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/** Récupère le défi actif courant + indique si l'utilisateur connecté y participe. */
export function useActiveChallenge(): UseActiveChallengeResult {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setError(null)
    try {
      const { data, error: e1 } = await supabase
        .from('challenges')
        .select('id, name, description, hero_image_url, cover_image_url, starts_at, ends_at, sessions_per_week_per_member, is_active')
        .eq('is_active', true)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (e1) throw e1

      const ch = (data as Challenge | null) ?? null
      setChallenge(ch)

      if (!ch) {
        setIsParticipant(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsParticipant(false)
        return
      }

      const { data: part, error: e2 } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', ch.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (e2) throw e2
      setIsParticipant(!!part)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { challenge, isParticipant, loading, error, refresh: fetch }
}
