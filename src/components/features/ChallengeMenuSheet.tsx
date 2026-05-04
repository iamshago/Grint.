import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ChallengeMenuSheetProps {
  open: boolean
  onClose: () => void
  onConfirmLeave: () => Promise<void> | void
}

/** Sheet du menu "..." de la page Détail défi.
 *  Une seule action : Quitter le défi. Confirmation modale obligatoire avant DELETE.
 */
export default function ChallengeMenuSheet({ open, onClose, onConfirmLeave }: ChallengeMenuSheetProps) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) {
      setConfirming(false)
      setPending(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleLeave = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    try {
      setPending(true)
      await onConfirmLeave()
    } finally {
      setPending(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={confirming ? 'Confirmer la sortie du défi' : 'Menu défi'}
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-[24px] w-full max-w-[402px] flex flex-col gap-[12px] p-[20px] pb-[32px]">
        {confirming ? (
          <>
            <h2 className="font-serif font-bold text-[20px] text-tx-1">Quitter le défi ?</h2>
            <p className="font-sans text-[14px] text-tx-2">
              Tu pourras toujours le rejoindre à nouveau plus tard.
            </p>
            <button
              type="button"
              onClick={handleLeave}
              disabled={pending}
              className="mt-[8px] w-full bg-[#e8413a] text-white font-sans font-semibold text-[16px] rounded-[12px] py-[14px] disabled:opacity-60"
            >
              {pending ? 'Sortie en cours…' : 'Quitter'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-bg-1 text-tx-1 font-sans font-semibold text-[16px] rounded-[12px] py-[14px]"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleLeave}
              className="w-full text-left bg-bg-1 rounded-[12px] py-[14px] px-[16px] font-sans font-semibold text-[16px] text-[#e8413a]"
            >
              Quitter le défi
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-tx-1 text-pr-1 font-sans font-semibold text-[16px] rounded-[12px] py-[14px]"
            >
              Annuler
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
