// @ts-nocheck
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { X, Check, Lock } from 'lucide-react'
import DarkLayout from '@/components/layout/DarkLayout'
import { AVATARS, isAvatarLocked } from '@/lib/avatars'
import { useCurrentUserProfile, persistCurrentAvatar } from '@/hooks/useCurrentUserProfile'
import { useStreak } from '@/hooks/useStreak'

/**
 * AvatarPicker — Écran plein écran de sélection d'avatar (dark mode).
 * Source de vérité : Supabase profiles.avatar_id. Le cache localStorage est
 * mis à jour en miroir pour les composants pas encore migrés.
 */
export default function AvatarPicker() {
  const navigate = useNavigate()
  const { profile } = useCurrentUserProfile()
  const { streakCount } = useStreak(profile?.id ?? null)

  const initialAvatarId =
    profile?.avatar_id || localStorage.getItem('selectedAvatarId') || 'superman'
  const [tempSelection, setTempSelection] = useState<string>(initialAvatarId)
  const [saving, setSaving] = useState(false)
  const [lockedPopupOpen, setLockedPopupOpen] = useState(false)

  // Quand le profil arrive après mount, recaler la sélection — mais jamais sur
  // un avatar verrouillé (cas tordu : streak retombé alors que l'avatar
  // sauvegardé est de la catégorie real). On ne touche pas à la base, on évite
  // juste de pré-sélectionner un avatar non re-sélectionnable.
  useEffect(() => {
    if (profile?.avatar_id) {
      const candidate = AVATARS.find((a) => a.id === profile.avatar_id)
      if (candidate && !isAvatarLocked(candidate, streakCount)) {
        setTempSelection(profile.avatar_id)
      }
    }
  }, [profile?.avatar_id, streakCount])

  const hasChanged = tempSelection !== initialAvatarId

  async function handleValidate() {
    if (saving) return
    try {
      setSaving(true)
      await persistCurrentAvatar(tempSelection)
      navigate('/profile')
    } catch {
      // En cas d'erreur réseau, on garde l'utilisateur sur la page
      setSaving(false)
    }
  }

  function handleClose() {
    navigate('/profile')
  }

  return (
    <DarkLayout scrollable hideTabBar className="px-[20px]">
      {/* Header sticky — calqué sur le pattern PRPickerModal (cf. Profile.tsx) */}
      <div
        className="sticky top-0 z-20 -mx-[20px] px-4 pt-2 pb-4 bg-[#0c0c0c] flex items-center"
      >
        <button
          onClick={handleClose}
          aria-label="Fermer sans sauvegarder"
          className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform shrink-0"
        >
          <X size={16} className="text-bg-1" />
        </button>
        <h1 className="flex-1 text-center font-serif font-bold text-xl text-bg-1 tracking-[-0.6px]">
          Choisis ton avatar
        </h1>
        <div className="w-10 shrink-0" />
      </div>

      {/* Grille d'avatars — paddingBottom large pour ne pas être cachée par le CTA fixed */}
      <div
        className="grid grid-cols-4 gap-[12px] mt-[24px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)' }}
      >
        {AVATARS.map((avatar) => {
          const locked = isAvatarLocked(avatar, streakCount)
          const isSelected = tempSelection === avatar.id

          return (
            <button
              key={avatar.id}
              onClick={() => {
                if (locked) {
                  setLockedPopupOpen(true)
                } else {
                  setTempSelection(avatar.id)
                }
              }}
              aria-label={locked ? `${avatar.label} (verrouillé)` : avatar.label}
              className="relative aspect-square rounded-full overflow-hidden focus:outline-none"
              style={
                isSelected && !locked
                  ? {
                      border: '3px solid #ffee8c',
                      boxShadow: '0 0 16px rgba(255,238,140,0.4)',
                    }
                  : {
                      border: '3px solid transparent',
                    }
              }
            >
              <img
                src={avatar.src}
                alt={avatar.label}
                className="w-full h-full object-cover"
                draggable={false}
                style={locked ? { filter: 'grayscale(0.7) brightness(0.55)' } : undefined}
              />

              {/* Overlay cadenas si verrouillé */}
              {locked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                  <div className="bg-[#1b1d1f] rounded-full p-[8px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)]">
                    <Lock size={16} className="text-bg-1" strokeWidth={2.5} />
                  </div>
                </div>
              )}

              {/* Overlay coche si sélectionné — uniquement si pas verrouillé */}
              {isSelected && !locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <div className="bg-[#ffee8c] rounded-full p-[4px]">
                    <Check size={14} color="#1b1d1f" strokeWidth={3} />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* CTA sticky bottom — gradient fade pour masquer le contenu qui scrolle dessous */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(12,12,12,0) 0%, #0c0c0c 32%)',
        }}
      >
        <div className="px-[20px] pt-8 pointer-events-auto cta-bottom-safe">
          <button
            onClick={handleValidate}
            disabled={!hasChanged || saving}
            aria-label="Valider la sélection d'avatar"
            className="w-full rounded-[12px] p-[16px] font-sans font-semibold text-[16px] transition-opacity"
            style={{
              backgroundColor: hasChanged ? '#ffee8c' : 'rgba(255,238,140,0.25)',
              color: hasChanged ? '#1b1d1f' : 'rgba(27,29,31,0.5)',
              cursor: hasChanged && !saving ? 'pointer' : 'default',
            }}
          >
            {saving ? 'Enregistrement…' : 'Valider'}
          </button>
        </div>
      </div>

      {lockedPopupOpen && createPortal(
        <LockedAvatarPopup onClose={() => setLockedPopupOpen(false)} />,
        document.body
      )}
    </DarkLayout>
  )
}

function LockedAvatarPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-[24px]">
      {/* Backdrop cliquable */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      {/* Popup centré */}
      <div className="relative bg-[#1b1d1f] rounded-[24px] w-full max-w-[354px] p-[24px] flex flex-col gap-[16px]">
        {/* Header — icône cadenas + titre + close */}
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-col gap-[8px] flex-1">
            <div className="w-[48px] h-[48px] rounded-full bg-[rgba(255,238,140,0.15)] flex items-center justify-center mb-[4px]">
              <Lock size={20} className="text-[#ffee8c]" strokeWidth={2.5} />
            </div>
            <h2 className="font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px]">
              Avatar verrouillé
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
          Ces avatars se débloquent dès que tu valides{' '}
          <span className="font-bold text-[#ffee8c]">ta première semaine de streak</span>.
        </p>
        <p className="font-sans text-[14px] text-tx-3 leading-[20px]">
          Pour valider une semaine, fais{' '}
          <span className="font-semibold text-bg-1">au moins 1 séance haut du corps</span> et{' '}
          <span className="font-semibold text-bg-1">1 séance bas du corps</span> dans la même semaine.
          Tu débloqueras alors une flamme 🔥 et 10 nouveaux avatars.
        </p>

        {/* CTA — fermer */}
        <button
          onClick={onClose}
          className="rounded-[12px] p-[16px] w-full font-sans font-semibold text-[16px] bg-[#ffee8c] text-[#1b1d1f] active:scale-95 transition-transform mt-[8px]"
        >
          Compris
        </button>
      </div>
    </div>
  )
}
