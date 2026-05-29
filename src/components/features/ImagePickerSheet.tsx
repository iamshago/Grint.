import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { fetchWorkoutImages } from '@/lib/myPrograms'
import type { ImageLibraryCategory, WorkoutImage } from '@/types'

interface ImagePickerSheetProps {
  open: boolean
  onClose: () => void
  /** Catégorie de la séance — filtre la galerie (generic en complément). */
  category?: ImageLibraryCategory
  /** URL actuellement sélectionnée (coche). */
  selectedUrl?: string | null
  onSelect: (url: string) => void
}

/**
 * Bottom sheet plein écran de choix d'image de couverture (workout_image_library).
 * Grille 3 colonnes filtrée par catégorie. Au clic, renvoie l'URL et se ferme.
 */
export default function ImagePickerSheet({
  open,
  onClose,
  category,
  selectedUrl,
  onSelect,
}: ImagePickerSheetProps) {
  const [images, setImages] = useState<WorkoutImage[]>([])
  const [loading, setLoading] = useState(false)

  // Recharge la galerie à l'ouverture et à chaque changement de catégorie.
  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    fetchWorkoutImages(category)
      .then((imgs) => active && setImages(imgs))
      .catch((e) => console.error(e))
      .finally(() => active && setLoading(false))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      active = false
      document.removeEventListener('keydown', onKey)
    }
  }, [open, category, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Choisir une image"
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-[#1c1c1e] rounded-t-[24px] w-full max-w-[402px] flex flex-col max-h-[88vh] pb-[env(safe-area-inset-bottom,16px)]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3d4149]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <h3 className="font-serif font-bold text-xl text-bg-1">Choisir une image</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="bg-[#3d4149] rounded-full p-2 active:scale-95 transition-transform"
          >
            <X size={18} className="text-bg-1" />
          </button>
        </div>

        {/* Grille 3 colonnes */}
        <div className="overflow-y-auto no-scrollbar px-5 pb-6">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-12 bg-[#3d4149] animate-pulse" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <p className="text-center text-tx-3 font-sans text-sm py-10">
              Aucune image disponible pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => {
                const isSelected = selectedUrl === img.image_url
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      onSelect(img.image_url)
                      onClose()
                    }}
                    aria-label={img.label ?? 'Image'}
                    aria-pressed={isSelected}
                    className="relative aspect-square rounded-12 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                  >
                    <img
                      src={img.image_url}
                      alt={img.label ?? ''}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {isSelected && (
                      <span className="absolute inset-0 ring-2 ring-pr-1 rounded-12 flex items-center justify-center bg-black/30">
                        <span className="w-8 h-8 rounded-full bg-pr-1 flex items-center justify-center">
                          <Check size={18} strokeWidth={3} className="text-tx-1" />
                        </span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
