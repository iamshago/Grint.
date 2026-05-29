import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface ActionSheetAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive' | 'cancel'
  disabled?: boolean
  /** Icône optionnelle affichée à gauche du label (ignorée pour la variante cancel). */
  icon?: ReactNode
}

interface ActionSheetProps {
  open: boolean
  onClose: () => void
  /** aria-label du dialog (lecteurs d'écran). */
  ariaLabel: string
  /** Liste d'actions affichées en colonne. La dernière est typiquement "cancel". */
  actions: ActionSheetAction[]
  /** Bloc additionnel optionnel rendu au-dessus des actions (ex. titre de confirmation). */
  header?: ReactNode
}

const variantClass: Record<NonNullable<ActionSheetAction['variant']>, string> = {
  default: 'bg-bg-1 text-tx-1',
  destructive: 'bg-bg-1 text-[#e8413a]',
  cancel: 'bg-tx-1 text-pr-1',
}

/**
 * Bottom sheet style iOS — backdrop semi-opaque + carte slide-up depuis le bas.
 * Primitif réutilisable : passer une liste d'`actions` et un `header` optionnel.
 */
export default function ActionSheet({ open, onClose, ariaLabel, actions, header }: ActionSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-[24px] w-full max-w-[402px] flex flex-col gap-[12px] p-[20px] pb-[32px]">
        {header}
        {actions.map((action, idx) => (
          <button
            key={idx}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              'w-full font-sans font-semibold text-[16px] rounded-[12px] py-[14px] px-[16px] disabled:opacity-60',
              action.variant === 'cancel'
                ? 'text-center'
                : action.icon
                  ? 'flex items-center gap-[12px] text-left'
                  : 'text-left',
              variantClass[action.variant ?? 'default'],
            )}
          >
            {action.variant !== 'cancel' && action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
