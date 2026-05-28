import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Plus } from 'lucide-react'
import type { Exercise } from '@/types'

interface ExercisePickerSheetProps {
  open: boolean
  onClose: () => void
  catalog: Exercise[]
  onSelect: (exercise: Exercise) => void
  /** Titre contextuel (ex. « Exercice de contraction » ou « Ajouter un exercice »). */
  title?: string
}

/**
 * Bottom sheet de sélection d'un exercice dans le catalogue (`exercises`, read-only).
 * Recherche en haut + liste scrollable. Au clic, renvoie l'exercice choisi.
 */
export default function ExercisePickerSheet({
  open,
  onClose,
  catalog,
  onSelect,
  title = 'Ajouter un exercice',
}: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    // Focus différé après l'animation d'ouverture — évite le saut de viewport
    // iOS Safari provoqué par autoFocus dans un portal.
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 250)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((e) => e.name.toLowerCase().includes(q))
  }, [catalog, query])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-[#1c1c1e] rounded-t-[24px] w-full max-w-[402px] flex flex-col max-h-[78vh] pb-[env(safe-area-inset-bottom,16px)]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3d4149]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <h3 className="font-serif font-bold text-xl text-bg-1">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="bg-[#3d4149] rounded-full p-2 active:scale-95 transition-transform"
          >
            <X size={18} className="text-bg-1" />
          </button>
        </div>

        {/* Recherche */}
        <div className="px-5 pb-3 shrink-0">
          <div className="relative flex items-center gap-3 bg-[#3d4149] rounded-12 px-4 py-3.5">
            <Search size={16} className="text-tx-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher un exercice"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-base font-sans text-bg-1 placeholder-tx-3 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Effacer"
                className="text-tx-3"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto no-scrollbar px-5 pb-6 flex flex-col gap-2">
          {results.length === 0 ? (
            <p className="text-center text-tx-3 font-sans text-sm py-10">
              Aucun exercice ne correspond.
            </p>
          ) : (
            results.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => {
                  onSelect(exercise)
                  onClose()
                }}
                className="w-full flex items-center justify-between gap-3 bg-tx-1 rounded-12 px-4 py-4 text-left cursor-pointer active:scale-[0.98] transition-transform"
              >
                <span className="font-sans font-semibold text-base text-bg-1 truncate">
                  {exercise.name}
                </span>
                <span className="w-8 h-8 rounded-full bg-pr-1 flex items-center justify-center shrink-0">
                  <Plus size={16} className="text-tx-1" />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
