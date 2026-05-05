import { Info, X } from 'lucide-react'

interface ChallengeInfoPopupProps {
  /** Fréquence par personne (source unique : challenges.sessions_per_week_per_member). */
  sessionsPerWeek: number
  onClose: () => void
  /** Action optionnelle pour quitter le défi (bouton tertiaire en bas). */
  onLeaveChallenge?: () => void
}

/**
 * Popup d'explication du fonctionnement d'un défi.
 * Style aligné avec LockedAvatarPopup (carte sombre centrée, icône ronde
 * jaune en header, CTA "Compris"). Le bouton "Quitter le défi" est
 * optionnel et tertiaire — délègue à un sheet de confirmation externe.
 */
export default function ChallengeInfoPopup({ sessionsPerWeek, onClose, onLeaveChallenge }: ChallengeInfoPopupProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-[24px]"
      role="dialog"
      aria-modal="true"
      aria-label="Comment fonctionne le défi"
    >
      {/* Backdrop cliquable */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      {/* Carte popup */}
      <div className="relative bg-[#1b1d1f] rounded-[24px] w-full max-w-[354px] p-[24px] flex flex-col gap-[16px]">
        {/* Header — icône info + titre + close */}
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-col gap-[8px] flex-1">
            <div className="w-[48px] h-[48px] rounded-full bg-[rgba(255,238,140,0.15)] flex items-center justify-center mb-[4px]">
              <Info size={20} className="text-[#ffee8c]" strokeWidth={2.5} />
            </div>
            <h2 className="font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px]">
              Comment fonctionne le défi ?
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="bg-[#3d4149] p-[12px] rounded-[24px] shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={16} className="text-bg-1" />
          </button>
        </div>

        {/* Texte explicatif */}
        <p className="font-sans text-[16px] text-bg-1 leading-[22px]">
          Chaque participant doit faire en moyenne{' '}
          <span className="font-bold text-[#ffee8c]">{sessionsPerWeek} séances par semaine</span>.
          L'objectif total du défi est calculé sur cette base.
        </p>
        <p className="font-sans text-[14px] text-tx-3 leading-[20px]">
          Mais c'est un{' '}
          <span className="font-semibold text-bg-1">effort collectif</span> — si une personne en
          fait plus et une autre moins sur la semaine, ça compte pareil. Vous validez le défi ensemble.
        </p>

        {/* CTA principal */}
        <button
          onClick={onClose}
          className="rounded-[12px] p-[16px] w-full font-sans font-semibold text-[16px] bg-[#ffee8c] text-[#1b1d1f] active:scale-95 transition-transform mt-[8px]"
        >
          Compris
        </button>

        {/* Lien tertiaire — quitter le défi (optionnel) */}
        {onLeaveChallenge && (
          <button
            onClick={onLeaveChallenge}
            className="font-sans text-[14px] text-tx-3 underline-offset-2 hover:underline active:underline cursor-pointer"
          >
            Quitter le défi
          </button>
        )}
      </div>
    </div>
  )
}
