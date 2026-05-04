import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { ProfileSummary } from '@/types'

const AVATAR_LS_KEY = 'selectedAvatarId'

interface UseCurrentUserProfileResult {
  profile: ProfileSummary | null
  loading: boolean
  refresh: () => Promise<void>
}

/**
 * Récupère le profil de l'utilisateur courant depuis Supabase (source de vérité).
 * Synchronise `localStorage.selectedAvatarId` comme cache (pour les composants
 * pas encore migrés) mais NE le lit pas en priorité — Supabase reste autoritatif.
 *
 * Retourne `null` tant que la session n'est pas chargée ou si pas connecté.
 */
export function useCurrentUserProfile(): UseCurrentUserProfileResult {
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_id, username')
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw error
      const p = (data as ProfileSummary | null) ?? null
      setProfile(p)
      if (p?.avatar_id) {
        try {
          window.localStorage.setItem(AVATAR_LS_KEY, p.avatar_id)
        } catch {
          // localStorage indisponible (mode privé Safari) — silencieux
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { profile, loading, refresh: fetch }
}

/** Met à jour `profiles.avatar_id` pour l'utilisateur courant + cache local. */
export async function persistCurrentAvatar(avatarId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_id: avatarId, updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) throw error
  try {
    window.localStorage.setItem(AVATAR_LS_KEY, avatarId)
  } catch {
    // ignore
  }
}
