import { useState } from 'react'
import { Check, X, UserPlus } from 'lucide-react'
import type { FriendshipStatus } from '@/hooks/useFriendshipStatus'
import { cn } from '@/lib/utils'

interface FriendStatusButtonProps {
  status: FriendshipStatus
  /** Nom affiché — utilisé pour les aria-labels. */
  displayName: string
  onSend: () => Promise<boolean>
  onAccept: () => Promise<boolean>
  onDecline: () => Promise<boolean>
}

/**
 * Bouton (ou paire de boutons) à afficher sur la page profil ami selon le
 * status relationnel. 4 cas :
 *   - `not_friend`         → "Ajouter en ami" (primary gold)
 *   - `pending_outgoing`   → "Demande envoyée" (disabled grisé)
 *   - `pending_incoming`   → "Accepter" (primary) + "Refuser" (ghost)
 *   - `friends` / `self` / `unknown` → null (l'appelant gère sa propre UI)
 *
 * Optimistic UI : on flippe le visuel localement avant la confirmation serveur.
 * En cas d'échec, l'override local retombe via le retour `false` de l'action.
 */
export default function FriendStatusButton({
  status,
  displayName,
  onSend,
  onAccept,
  onDecline,
}: FriendStatusButtonProps) {
  const [override, setOverride] = useState<FriendshipStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const effective = override ?? status

  const wrap = async (
    optimistic: FriendshipStatus,
    fn: () => Promise<boolean>,
  ) => {
    if (busy) return
    setBusy(true)
    setOverride(optimistic)
    const ok = await fn()
    if (!ok) setOverride(null)
    setBusy(false)
  }

  if (effective === 'friends' || effective === 'self' || effective === 'unknown') {
    return null
  }

  if (effective === 'pending_outgoing') {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-label={`Demande d'ami envoyée à ${displayName}`}
        className="w-full h-[48px] rounded-[12px] bg-tx-2 text-tx-3 font-sans font-semibold text-[16px] cursor-not-allowed"
      >
        Demande envoyée
      </button>
    )
  }

  if (effective === 'pending_incoming') {
    return (
      <div className="flex gap-[12px] w-full">
        <button
          type="button"
          disabled={busy}
          aria-label={`Accepter la demande d'ami de ${displayName}`}
          onClick={() => wrap('friends', onAccept)}
          className="flex-1 h-[48px] rounded-[12px] bg-pr-1 text-tx-1 font-sans font-semibold text-[16px] flex items-center justify-center gap-[8px] active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <Check size={18} strokeWidth={2.5} />
          Accepter
        </button>
        <button
          type="button"
          disabled={busy}
          aria-label={`Refuser la demande d'ami de ${displayName}`}
          onClick={() => wrap('not_friend', onDecline)}
          className="flex-1 h-[48px] rounded-[12px] bg-transparent border border-tx-2 text-text-light font-sans font-semibold text-[16px] flex items-center justify-center gap-[8px] active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <X size={18} strokeWidth={2.5} />
          Refuser
        </button>
      </div>
    )
  }

  // not_friend
  return (
    <button
      type="button"
      disabled={busy}
      aria-label={`Envoyer une demande d'ami à ${displayName}`}
      onClick={() => wrap('pending_outgoing', onSend)}
      className={cn(
        'w-full h-[48px] rounded-[12px] bg-pr-1 text-tx-1 font-sans font-semibold text-[16px]',
        'flex items-center justify-center gap-[8px] active:scale-[0.98] transition-transform',
        'disabled:opacity-60',
      )}
    >
      <UserPlus size={18} strokeWidth={2.5} />
      Ajouter en ami
    </button>
  )
}
