import { useEffect, useState } from 'react'
import ActionSheet, { type ActionSheetAction } from '@/components/ui/ActionSheet'

interface ChallengeMenuSheetProps {
  open: boolean
  onClose: () => void
  onConfirmLeave: () => Promise<void> | void
}

/** Sheet du menu "..." de la page Détail défi.
 *  Déclenche un flow en deux étapes (sheet d'actions → confirmation) car
 *  l'action quitte le défi côté Supabase (DELETE non réversible).
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

  const handleLeave = async () => {
    try {
      setPending(true)
      await onConfirmLeave()
    } finally {
      setPending(false)
    }
  }

  const initialActions: ActionSheetAction[] = [
    {
      label: 'Quitter le défi',
      onClick: () => setConfirming(true),
      variant: 'destructive',
    },
    {
      label: 'Annuler',
      onClick: onClose,
      variant: 'cancel',
    },
  ]

  const confirmActions: ActionSheetAction[] = [
    {
      label: pending ? 'Sortie en cours…' : 'Quitter',
      onClick: handleLeave,
      variant: 'destructive',
      disabled: pending,
    },
    {
      label: 'Annuler',
      onClick: onClose,
      variant: 'cancel',
    },
  ]

  return (
    <ActionSheet
      open={open}
      onClose={onClose}
      ariaLabel={confirming ? 'Confirmer la sortie du défi' : 'Menu défi'}
      actions={confirming ? confirmActions : initialActions}
      header={
        confirming ? (
          <div className="flex flex-col gap-[4px] mb-[4px]">
            <h2 className="font-serif font-bold text-[20px] text-tx-1">Quitter le défi&nbsp;?</h2>
            <p className="font-sans text-[14px] text-tx-2">
              Tu pourras toujours le rejoindre à nouveau plus tard.
            </p>
          </div>
        ) : null
      }
    />
  )
}
