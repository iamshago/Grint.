import { useEffect, useMemo, useState } from 'react'
import LightLayout from '@/components/layout/LightLayout'
import ChallengeCard from '@/components/features/ChallengeCard'
import FeedPostCard from '@/components/features/FeedPostCard'
import ReactionsModal from '@/components/features/ReactionsModal'
import { useActiveChallenge } from '@/hooks/useActiveChallenge'
import { useChallengeProgress } from '@/hooks/useChallengeProgress'
import { useFeed, togglePostReaction } from '@/hooks/useFeed'
import { supabase } from '@/lib/supabaseClient'
import type { Post, ProfileSummary, ReactionEmoji } from '@/types'

/** Page Communauté V2 — UN défi unique + feed PR auto. */
export default function Community() {
  const { challenge, isParticipant } = useActiveChallenge()
  const { progress } = useChallengeProgress(challenge?.id ?? null)
  const { posts, currentUserId, refresh: refreshFeed } = useFeed()

  // Profils des participants pour les avatars overlap
  const [participantProfiles, setParticipantProfiles] = useState<ProfileSummary[]>([])
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [openReactorsFor, setOpenReactorsFor] = useState<Post | null>(null)

  // Charger les profils des 3 premiers participants (pour les mini-avatars)
  useEffect(() => {
    if (!progress || progress.participantCount === 0) {
      setParticipantProfiles([])
      return
    }
    const ids = progress.ranking.slice(0, 3).map((r) => r.user_id)
    supabase
      .from('profiles')
      .select('id, display_name, avatar_id, avatar_url, username')
      .in('id', ids)
      .then(({ data }) => setParticipantProfiles((data ?? []) as ProfileSummary[]))
  }, [progress])

  // Charger la liste des amis (pour rendre les avatars de la modale réacteurs cliquables)
  useEffect(() => {
    if (!currentUserId) return
    supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
      .then(({ data }) => {
        const ids = new Set<string>()
        for (const row of data ?? []) {
          if (row.requester_id !== currentUserId) ids.add(row.requester_id)
          if (row.addressee_id !== currentUserId) ids.add(row.addressee_id)
        }
        setFriendIds(ids)
      })
  }, [currentUserId])

  const handleReact = async (post: Post, emoji: ReactionEmoji) => {
    const hasReacted = !!post.reactions?.some(
      (r) => r.user_id === currentUserId && r.emoji === emoji,
    )
    try {
      await togglePostReaction(post.id, emoji, hasReacted)
      await refreshFeed()
    } catch {
      // pas de toast bloquant — on ignore
    }
  }

  const openReactors = useMemo(() => {
    if (!openReactorsFor) return null
    // Recharger via la liste posts en cas de refresh
    return posts.find((p) => p.id === openReactorsFor.id) ?? openReactorsFor
  }, [openReactorsFor, posts])

  return (
    <LightLayout scrollable className="flex flex-col">
      <div className="relative w-full max-w-[402px] mx-auto pt-4">
        {/* Titre — même position verticale que "Hello" sur la Home (LightLayout
            applique déjà safe-area-top, pas besoin d'empiler) */}
        <h1 className="px-[16px] font-serif font-bold text-[32px] text-tx-1 tracking-[-0.96px] leading-normal">
          Communauté
        </h1>

        {/* Section Défis (masquée si aucun défi actif) */}
        {challenge && (
          <>
            <h2 className="mt-[15px] px-[16px] font-serif font-bold text-[24px] text-tx-1 tracking-[-0.72px] leading-normal">
              Défis
            </h2>
            <div className="mt-[19px] px-[16px]">
              <ChallengeCard
                challenge={challenge}
                isParticipant={isParticipant}
                progress={progress}
                participantProfiles={participantProfiles}
              />
            </div>
          </>
        )}

        {/* Section Tous les posts */}
        <h2 className="mt-[32px] px-[16px] font-serif font-bold text-[24px] text-tx-1 tracking-[-0.72px] leading-normal">
          Tous les posts
        </h2>

        <div className="mt-[19px] px-[16px] flex flex-col gap-[16px]">
          {posts.length === 0 ? (
            <p className="font-sans text-[14px] text-tx-3 leading-snug">
              Tes amis n'ont pas encore battu de records, accroche-toi à ton banc 💪
            </p>
          ) : (
            posts.map((p) => (
              <FeedPostCard
                key={p.id}
                post={p}
                currentUserId={currentUserId}
                onReact={(emoji) => handleReact(p, emoji)}
                onShowReactors={() => setOpenReactorsFor(p)}
              />
            ))
          )}
        </div>
      </div>

      {openReactors && (
        <ReactionsModal
          reactions={openReactors.reactions ?? []}
          currentUserId={currentUserId}
          friendIds={friendIds}
          onClose={() => setOpenReactorsFor(null)}
        />
      )}
    </LightLayout>
  )
}
