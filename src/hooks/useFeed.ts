import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Post, PostReaction, ProfileSummary, ReactionEmoji, PRPostPayload } from '@/types'

interface UseFeedResult {
  posts: Post[]
  currentUserId: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Fetch les posts visibles (RLS = soi-même + amis acceptés), avec pour chacun :
 *  - le profil de l'auteur
 *  - les réactions associées (avec profils des réacteurs)
 */
export function useFeed(): UseFeedResult {
  const [posts, setPosts] = useState<Post[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const { data: rawPosts, error: e1 } = await supabase
        .from('posts')
        .select('id, user_id, type, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (e1) throw e1

      const list = (rawPosts ?? []) as Array<{
        id: string
        user_id: string
        type: string
        payload: PRPostPayload
        created_at: string
      }>

      if (list.length === 0) {
        setPosts([])
        return
      }

      const postIds = list.map((p) => p.id)
      const userIds = Array.from(new Set(list.map((p) => p.user_id)))

      const [reactionsRes, profilesRes] = await Promise.all([
        supabase
          .from('post_reactions')
          .select('id, post_id, user_id, emoji, created_at')
          .in('post_id', postIds),
        supabase
          .from('profiles')
          .select('id, display_name, avatar_id, avatar_url, username')
          .in('id', userIds),
      ])
      if (reactionsRes.error) throw reactionsRes.error
      if (profilesRes.error) throw profilesRes.error

      const reactions = (reactionsRes.data ?? []) as PostReaction[]

      // Compléter les profils avec ceux des réacteurs (peuvent ne pas être amis)
      const reactorIds = Array.from(new Set(reactions.map((r) => r.user_id)))
      const missing = reactorIds.filter((id) => !userIds.includes(id))
      let extraProfiles: ProfileSummary[] = []
      if (missing.length > 0) {
        const { data: extra } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_id, avatar_url, username')
          .in('id', missing)
        extraProfiles = (extra ?? []) as ProfileSummary[]
      }

      const allProfiles = [
        ...((profilesRes.data ?? []) as ProfileSummary[]),
        ...extraProfiles,
      ]
      const profileMap = new Map(allProfiles.map((p) => [p.id, p]))

      const reactionsByPost = reactions.reduce<Record<string, PostReaction[]>>((acc, r) => {
        const enriched: PostReaction = { ...r, profile: profileMap.get(r.user_id) }
        ;(acc[r.post_id] ??= []).push(enriched)
        return acc
      }, {})

      const enriched: Post[] = list
        .filter((p) => p.type === 'pr')
        .map((p) => ({
          id: p.id,
          user_id: p.user_id,
          type: 'pr',
          payload: p.payload,
          created_at: p.created_at,
          profile: profileMap.get(p.user_id),
          reactions: reactionsByPost[p.id] ?? [],
        }))

      setPosts(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { posts, currentUserId, loading, error, refresh: fetch }
}

/** Toggle d'une réaction emoji par l'utilisateur courant sur un post. */
export async function togglePostReaction(
  postId: string,
  emoji: ReactionEmoji,
  hasReacted: boolean,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')

  if (hasReacted) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('post_reactions')
      .insert({ post_id: postId, user_id: user.id, emoji })
    if (error && error.code !== '23505') throw error
  }
}
