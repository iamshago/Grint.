// @ts-nocheck
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check } from 'lucide-react'
import DarkLayout from '@/components/layout/DarkLayout'
import { AVATARS } from '@/lib/avatars'

/**
 * AvatarPicker — Écran plein écran de sélection d'avatar (dark mode).
 * Lit l'avatar courant depuis localStorage, permet de prévisualiser
 * un avatar avant de confirmer. Sauvegarde sur validation, annule sur X.
 */
export default function AvatarPicker() {
  const navigate = useNavigate()

  const currentAvatarId = localStorage.getItem('selectedAvatarId') || 'superman'
  const [tempSelection, setTempSelection] = useState<string>(currentAvatarId)

  const hasChanged = tempSelection !== currentAvatarId

  function handleValidate() {
    localStorage.setItem('selectedAvatarId', tempSelection)
    navigate('/profile')
  }

  function handleClose() {
    navigate('/profile')
  }

  return (
    <DarkLayout scrollable hideTabBar className="flex flex-col px-[20px] pb-[32px]">
      {/* Barre top */}
      <div className="pt-2 pb-[8px]">
        <button
          onClick={handleClose}
          aria-label="Fermer sans sauvegarder"
          className="bg-[#1b1d1f] p-[12px] rounded-[24px] flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <X size={20} color="#f1f4fb" strokeWidth={2} />
        </button>
      </div>

      {/* Titre */}
      <h1 className="font-serif font-bold text-[24px] text-bg-1 mt-[20px] mb-[28px] leading-tight">
        Choisis ton avatar
      </h1>

      {/* Grille d'avatars */}
      <div className="grid grid-cols-4 gap-[12px] flex-1">
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

      {/* Bouton Valider */}
      <div className="mt-[32px]">
        <button
          onClick={handleValidate}
          disabled={!hasChanged}
          aria-label="Valider la sélection d'avatar"
          className="w-full rounded-[12px] p-[16px] font-sans font-semibold text-[16px] transition-opacity"
          style={{
            backgroundColor: hasChanged ? '#ffee8c' : 'rgba(255,238,140,0.25)',
            color: hasChanged ? '#1b1d1f' : 'rgba(27,29,31,0.5)',
            cursor: hasChanged ? 'pointer' : 'default',
          }}
        >
          Valider
        </button>
      </div>
    </DarkLayout>
  )
}
