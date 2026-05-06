import { useMemo } from 'react'
import type { Post, ReactionEmoji } from '@/types'
import { REACTION_EMOJIS } from '@/types'
import { resolveAvatarSrc } from '@/lib/avatars'
import { firstNameOnly } from '@/lib/displayName'
import { cn } from '@/lib/utils'

interface FeedPostCardProps {
  post: Post
  currentUserId: string | null
  /** Toggle d'une réaction. */
  onReact: (emoji: ReactionEmoji) => void
  /** Ouvre la modale réacteurs. */
  onShowReactors: () => void
}

/** Card de post simplifiée (V2) — épurée, badge valeur droit, réactions sous la card. */
export default function FeedPostCard({ post, currentUserId, onReact, onShowReactors }: FeedPostCardProps) {
  const author = post.profile
  const avatarSrc = resolveAvatarSrc(author)
  const name = firstNameOnly(author?.display_name) || author?.username || '—'

  const reactions = post.reactions ?? []
  const myReactions = useMemo(
    () => new Set(reactions.filter((r) => r.user_id === currentUserId).map((r) => r.emoji)),
    [reactions, currentUserId],
  )
  const otherReactors = useMemo(
    () => reactions.filter((r) => r.user_id !== currentUserId),
    [reactions, currentUserId],
  )

  const previewReactor = otherReactors[0]?.profile
  const previewName = firstNameOnly(previewReactor?.display_name) || previewReactor?.username || ''
  const previewAvatarSrc = resolveAvatarSrc(previewReactor)

  const weight = post.payload.weight
  const exerciseName = post.payload.exercise_name

  return (
    <div className="flex flex-col gap-[8px] items-start w-full">
      {/* Card principale 72px */}
      <div className="bg-white h-[72px] relative rounded-[12px] w-full">
        {/* Avatar */}
        <div className="absolute left-[12px] top-[12px] size-[48px] rounded-full bg-white overflow-hidden">
          <img src={avatarSrc} alt="" className="size-full object-cover" />
        </div>

        {/* Nom */}
        <p className="absolute left-[72px] top-[14px] font-serif font-bold text-[20px] text-tx-1 leading-normal whitespace-nowrap">
          {name}
        </p>

        {/* Contenu (template PR) — left+right pour contraindre la zone et truncate
            avec ellipsis si l'exercice est trop long (cf. "Développé couché altère"). */}
        <p className="absolute left-[72px] top-[44px] right-[100px] font-sans text-[12px] text-tx-1 leading-normal truncate">
          Passe les <strong className="font-sans font-bold">{weight}kg</strong> au{' '}
          <strong className="font-sans font-bold">{exerciseName}</strong>.
        </p>

        {/* Badge valeur (pilule jaune) */}
        <div className="absolute bottom-[15px] right-[15px] bg-pr-1 rounded-[8px] flex items-center justify-center px-[16px] py-[12px]">
          <span className="font-sans font-bold text-[16px] text-tx-1">{weight}kg</span>
        </div>
      </div>

      {/* Réactions + ligne "Aimé par" */}
      <div className="flex flex-col gap-[8px] items-start pl-[8px] w-full">
        <div className="flex gap-[4px] items-center">
          {REACTION_EMOJIS.map((emoji) => {
            const active = myReactions.has(emoji)
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                aria-label={`Réagir avec ${emoji}`}
                aria-pressed={active}
                className={cn(
                  'flex items-center justify-center px-[10px] py-[6px] rounded-[8px] border border-bg-2 text-[20px] leading-none',
                  active ? 'bg-bg-2' : 'bg-white',
                )}
              >
                <span aria-hidden="true">{emoji}</span>
              </button>
            )
          })}
        </div>

        {/* Ligne "Aimé par" — seulement si ≥1 réaction d'autres personnes */}
        {previewReactor && (
          <button
            type="button"
            onClick={onShowReactors}
            className="flex gap-[8px] items-center text-left"
            aria-label="Voir tous les réacteurs"
          >
            <div className="size-[24px] rounded-full bg-tx-2 overflow-hidden shrink-0">
              <img src={previewAvatarSrc} alt="" className="size-full object-cover" />
            </div>
            <p className="font-sans text-[12px] text-tx-2">
              Aimé par <strong className="font-sans font-bold">{previewName}</strong>
              {otherReactors.length > 1 && (
                <>
                  {' '}et <strong className="font-sans font-bold">d’autres personnes</strong>
                </>
              )}
            </p>
          </button>
        )}
      </div>
    </div>
  )
}
