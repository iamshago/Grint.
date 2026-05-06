import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export type FriendshipStatus =
  | 'not_friend'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'friends'
  | 'self'
  | 'unknown'

interface FriendshipRow {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'rejected'
}

/**
 * Calcule le `status` relationnel entre l'utilisateur courant et `otherUserId`,
 * et expose les actions asynchrones (envoyer / accepter / refuser / retirer).
 *
 * Schéma BDD existant (migration 20260402_friendships.sql) :
 *   - `requester_id` = demandeur, `addressee_id` = destinataire
 *   - `status` ∈ {'pending', 'accepted', 'rejected'} — on n'utilise jamais
 *     'rejected' depuis le front (refus = DELETE de la ligne, cf. brief
 *     profile-add-friend-flow). Si une ligne 'rejected' existe en BDD, on la
 *     traite comme `not_friend`.
 *
 * Les RLS Supabase imposent : INSERT seul si auth.uid() = requester_id ;
 * UPDATE seul si auth.uid() = addressee_id ; DELETE par les deux côtés.
 */
export function useFriendshipStatus(otherUserId: string | undefined | null) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [row, setRow] = useState<FriendshipRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!otherUserId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const me = user?.id ?? null
      setCurrentUserId(me)
      if (!me || me === otherUserId) {
        setRow(null)
        return
      }
      const { data } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(
          `and(requester_id.eq.${me},addressee_id.eq.${otherUserId}),` +
            `and(requester_id.eq.${otherUserId},addressee_id.eq.${me})`,
        )
        .maybeSingle()
      setRow((data as FriendshipRow | null) ?? null)
    } finally {
      setIsLoading(false)
    }
  }, [otherUserId])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const status = computeStatus(currentUserId, otherUserId, row)

  /** Envoie une demande d'ami. Race condition : si l'autre nous a déjà
   *  envoyé une demande, on promeut directement à `accepted` (pas de doublon). */
  const sendRequest = useCallback(async (): Promise<boolean> => {
    if (!currentUserId || !otherUserId) return false
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('requester_id', otherUserId)
      .eq('addressee_id', currentUserId)
      .eq('status', 'pending')
      .maybeSingle()
    if (existing) {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', existing.id)
      if (error) return false
      await fetchAll()
      return true
    }
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: otherUserId, status: 'pending' })
    if (error) return false
    await fetchAll()
    return true
  }, [currentUserId, otherUserId, fetchAll])

  const acceptRequest = useCallback(async (): Promise<boolean> => {
    // Garde défensive : seul le destinataire peut accepter (RLS Supabase
    // l'impose côté serveur — on évite l'aller-retour côté client).
    if (!row || row.status !== 'pending') return false
    if (!currentUserId || row.addressee_id !== currentUserId) return false
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', row.id)
    if (error) return false
    await fetchAll()
    return true
  }, [row, currentUserId, fetchAll])

  /** Refuser ou retirer : DELETE la ligne (pas de statut 'declined' — cf. brief). */
  const removeRelation = useCallback(async (): Promise<boolean> => {
    if (!row) return false
    const { error } = await supabase.from('friendships').delete().eq('id', row.id)
    if (error) return false
    await fetchAll()
    return true
  }, [row, fetchAll])

  return {
    status,
    isLoading,
    currentUserId,
    sendRequest,
    acceptRequest,
    declineRequest: removeRelation,
    removeFriend: removeRelation,
    refresh: fetchAll,
  }
}

/** Pure helper : décide du status à partir des données. Exporté pour les tests. */
export function computeStatus(
  currentUserId: string | null,
  otherUserId: string | null | undefined,
  row: FriendshipRow | null,
): FriendshipStatus {
  if (!otherUserId) return 'unknown'
  if (!currentUserId) return 'unknown'
  if (currentUserId === otherUserId) return 'self'
  if (!row) return 'not_friend'
  if (row.status === 'accepted') return 'friends'
  if (row.status === 'pending') {
    return row.requester_id === currentUserId ? 'pending_outgoing' : 'pending_incoming'
  }
  return 'not_friend'
}
