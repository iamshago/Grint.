// @ts-nocheck
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check } from 'lucide-react'
import DarkLayout from '@/components/layout/DarkLayout'
import { AVATARS } from '@/lib/avatars'
import { useCurrentUserProfile, persistCurrentAvatar } from '@/hooks/useCurrentUserProfile'

/**
 * AvatarPicker — Écran plein écran de sélection d'avatar (dark mode).
 * Source de vérité : Supabase profiles.avatar_id. Le cache localStorage est
 * mis à jour en miroir pour les composants pas encore migrés.
 */
export default function AvatarPicker() {
  const navigate = useNavigate()
  const { profile } = useCurrentUserProfile()

  const initialAvatarId =
    profile?.avatar_id || localStorage.getItem('selectedAvatarId') || 'superman'
  const [tempSelection, setTempSelection] = useState<string>(initialAvatarId)
  const [saving, setSaving] = useState(false)

  // Quand le profil arrive après mount, recaler la sélection
  useEffect(() => {
    if (profile?.avatar_id) setTempSelection(profile.avatar_id)
  }, [profile?.avatar_id])

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
      {/* Header sticky — croix + titre alignés, fond opaque pour masquer le scroll dessous */}
      <div
        className="sticky top-0 z-20 -mx-[20px] px-[20px] pt-2 pb-[12px] bg-[#0c0c0c] flex items-center gap-[12px]"
      >
        <button
          onClick={handleClose}
          aria-label="Fermer sans sauvegarder"
          className="bg-[#1b1d1f] p-[12px] rounded-[24px] flex items-center justify-center shrink-0"
          style={{ width: 44, height: 44 }}
        >
          <X size={20} color="#f1f4fb" strokeWidth={2} />
        </button>
        <h1 className="font-serif font-bold text-[24px] text-bg-1 leading-tight">
          Choisis ton avatar
        </h1>
      </div>

      {/* Grille d'avatars — paddingBottom large pour ne pas être cachée par le CTA fixed */}
      <div
        className="grid grid-cols-4 gap-[12px] mt-[24px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)' }}
      >
        {AVATARS.map((avatar) => {
          const isSelected = tempSelection === avatar.id
          return (
            <button
              key={avatar.id}
              onClick={() => setTempSelection(avatar.id)}
              aria-label={avatar.label}
              className="relative aspect-square rounded-full overflow-hidden focus:outline-none"
              style={
                isSelected
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
              />

              {/* Overlay coche si sélectionné */}
              {isSelected && (
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
    </DarkLayout>
  )
}
