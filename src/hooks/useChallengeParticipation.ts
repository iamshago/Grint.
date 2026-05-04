import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface UseChallengeParticipationResult {
  join: () => Promise<void>
  leave: () => Promise<void>
  loading: boolean
  error: string | null
}

/** Mutations rejoindre / quitter un défi pour l'utilisateur courant. */
export function useChallengeParticipation(challengeId: string | null | undefined): UseChallengeParticipationResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const join = useCallback(async () => {
    if (!challengeId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const { error: e } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: challengeId, user_id: user.id })
      // Tolérer le cas "déjà rejoint" (unique violation)
      if (e && e.code !== '23505') throw e
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      throw err
    } finally {
      setLoading(false)
    }
  }, [challengeId])

  const leave = useCallback(async () => {
    if (!challengeId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const { error: e } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
      if (e) throw e
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      throw err
    } finally {
      setLoading(false)
    }
  }, [challengeId])

  return { join, leave, loading, error }
}
