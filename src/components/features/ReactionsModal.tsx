import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { PostReaction, ReactionEmoji } from '@/types'
import { REACTION_EMOJIS } from '@/types'
import { resolveAvatarSrc } from '@/lib/avatars'

interface ReactionsModalProps {
  reactions: PostReaction[]
  currentUserId: string | null
  /** IDs des amis acceptés du user courant (pour rendre les avatars cliquables). */
  friendIds: Set<string>
  onClose: () => void
}

/** Modale qui liste les réacteurs d'un post groupés par emoji. */
export default function ReactionsModal({ reactions, currentUserId, friendIds, onClose }: ReactionsModalProps) {
  const navigate = useNavigate()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // ESC pour fermer + focus initial sur le bouton de fermeture
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    closeBtnRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const grouped = useMemo(() => {
    const map = new Map<ReactionEmoji, PostReaction[]>()
    for (const e of REACTION_EMOJIS) map.set(e, [])
    for (const r of reactions) {
      const list = map.get(r.emoji) ?? []
      list.push(r)
      map.set(r.emoji, list)
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0)
  }, [reactions])

  const handleReactorClick = (userId: string) => {
    if (userId === currentUserId) {
      navigate('/profile')
      onClose()
    } else if (friendIds.has(userId)) {
      navigate(`/profile/friends/${userId}`)
      onClose()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Réacteurs"
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-[24px] sm:rounded-[24px] w-full max-w-[402px] max-h-[80vh] overflow-y-auto pb-safe">
        <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[12px] sticky top-0 bg-white">
          <h2 className="font-serif font-bold text-[20px] text-tx-1">Aimé par</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="size-[40px] rounded-full bg-bg-1 flex items-center justify-center font-sans text-[20px] text-tx-1"
            aria-label="Fermer la modale"
          >
            ×
          </button>
        </div>

        {grouped.length === 0 && (
          <p className="px-[20px] py-[24px] font-sans text-[14px] text-tx-3">
            Personne n'a encore réagi.
          </p>
        )}

        <div className="flex flex-col gap-[16px] px-[16px] pb-[24px]">
          {grouped.map(([emoji, list]) => (
            <section key={emoji} aria-label={`Réactions ${emoji}`}>
              <div className="flex items-center gap-[8px] mb-[8px]">
                <span className="text-[20px]" aria-hidden="true">{emoji}</span>
                <span className="font-sans font-semibold text-[14px] text-tx-2">{list.length}</span>
              </div>
              <ul className="flex flex-col gap-[8px]">
                {list.map((r) => {
                  const avSrc = resolveAvatarSrc(r.profile)
                  const name = r.profile?.display_name || r.profile?.username || 'Utilisateur'
                  const clickable = r.user_id === currentUserId || friendIds.has(r.user_id)
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => handleReactorClick(r.user_id)}
                        disabled={!clickable}
                        className="flex items-center gap-[12px] w-full text-left rounded-[12px] py-[6px] px-[8px] disabled:cursor-default enabled:hover:bg-bg-1 transition-colors"
                      >
                        <div className="size-[40px] rounded-full overflow-hidden bg-tx-2 shrink-0">
                          <img src={avSrc} alt="" className="size-full object-cover" />
                        </div>
                        <span className="font-serif font-bold text-[16px] text-tx-1">{name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
