import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Plus, Dumbbell } from 'lucide-react'
import { fetchSelectableWorkouts, type SelectableWorkout } from '@/lib/myPrograms'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'

const CATEGORY_LABEL: Record<string, string> = {
  upper: 'Haut du corps',
  lower: 'Bas du corps',
  bbl: 'BBL',
}

interface SeancePickerProps {
  open: boolean
  onClose: () => void
  userId: string
  /** Renvoie la séance choisie (catalogue ou perso) à lier au programme. */
  onSelect: (ref: { source: 'catalog' | 'user'; id: string }) => void
}

/**
 * Bottom sheet (dark) de sélection d'une séance EXISTANTE à ajouter au programme :
 * catalogue + séances perso déjà créées (réutilisables). Au clic → renvoie la réf.
 */
export default function SeancePicker({ open, onClose, userId, onSelect }: SeancePickerProps) {
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState<SelectableWorkout[]>([])
  const [mine, setMine] = useState<SelectableWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    let active = true
    setLoading(true)
    fetchSelectableWorkouts(userId)
      .then((res) => {
        if (!active) return
        setCatalog(res.catalog)
        setMine(res.mine)
      })
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
  }, [open, userId, onClose])

  const filterFn = (w: SelectableWorkout) =>
    w.name.toLowerCase().includes(query.trim().toLowerCase())
  const cat = useMemo(() => catalog.filter(filterFn), [catalog, query])
  const own = useMemo(() => mine.filter(filterFn), [mine, query])

  if (!open) return null

  const renderRow = (w: SelectableWorkout) => {
    const accent = CATEGORY_ACCENT[w.category] || '#ffee8c'
    return (
      <button
        key={`${w.source}-${w.id}`}
        type="button"
        onClick={() => {
          onSelect({ source: w.source, id: w.id })
          onClose()
        }}
        className="w-full flex items-center justify-between gap-3 bg-tx-1 rounded-12 px-4 py-3 text-left cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="min-w-0">
          <span className="block font-sans font-semibold text-base text-bg-1 truncate">
            {w.name}
          </span>
          <span className="flex items-center gap-2 mt-0.5">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold uppercase"
              style={{ backgroundColor: `${accent}40`, color: accent }}
            >
              {CATEGORY_LABEL[w.category]}
            </span>
            <span className="flex items-center gap-1 font-sans text-xs text-tx-3">
              <Dumbbell size={12} />
              {w.exerciseCount} exo{w.exerciseCount > 1 ? 's' : ''}
            </span>
          </span>
        </div>
        <span className="w-8 h-8 rounded-full bg-pr-1 flex items-center justify-center shrink-0">
          <Plus size={16} className="text-tx-1" />
        </span>
      </button>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter une séance existante"
    >
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#1c1c1e] rounded-t-[24px] w-full max-w-[402px] flex flex-col max-h-[82vh] pb-[env(safe-area-inset-bottom,16px)]">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3d4149]" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <h3 className="font-serif font-bold text-xl text-bg-1">Séance existante</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="bg-[#3d4149] rounded-full p-2 active:scale-95 transition-transform"
          >
            <X size={18} className="text-bg-1" />
          </button>
        </div>

        <div className="px-5 pb-3 shrink-0">
          <div className="relative flex items-center gap-3 bg-[#3d4149] rounded-12 px-4 py-3.5">
            <Search size={16} className="text-tx-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher une séance"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-base font-sans text-bg-1 placeholder-tx-3 focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Effacer" className="text-tx-3">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto no-scrollbar px-5 pb-6 flex flex-col gap-4">
          {loading ? (
            <p className="text-center text-tx-3 font-sans text-sm py-10">Chargement…</p>
          ) : (
            <>
              {own.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-sans font-semibold text-xs uppercase text-tx-3 tracking-wide">
                    Mes séances
                  </span>
                  {own.map(renderRow)}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <span className="font-sans font-semibold text-xs uppercase text-tx-3 tracking-wide">
                  Catalogue
                </span>
                {cat.length === 0 ? (
                  <p className="text-tx-3 font-sans text-sm py-4">Aucune séance ne correspond.</p>
                ) : (
                  cat.map(renderRow)
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
