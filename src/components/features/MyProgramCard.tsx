import { ChevronRight, PencilLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_ACCENT } from '@/lib/categoryColors'
import type { UserProgram } from '@/types'

const CATEGORY_LABEL: Record<string, string> = {
  upper: 'Haut du corps',
  lower: 'Bas du corps',
  bbl: 'BBL',
}

interface MyProgramCardProps {
  program: UserProgram
  onClick?: () => void
  className?: string
}

/**
 * Carte d'un programme perso dans le hub `/my-programs`.
 * Visuel « perso » distinctif du catalogue : carte claire, accent pr-1 (rose si
 * le programme contient une séance BBL — easter egg), pictogramme crayon.
 */
export default function MyProgramCard({ program, onClick, className }: MyProgramCardProps) {
  // `categories` est fourni par fetchUserPrograms (catégories des séances liées).
  const categories: string[] = (program as { categories?: string[] }).categories ?? []
  const hasBBL = categories.includes('bbl')
  const accent = hasBBL ? CATEGORY_ACCENT.bbl : '#ffee8c'
  const count = categories.length

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ouvrir le programme ${program.name}`}
      className={cn(
        'w-full text-left bg-tx-1 rounded-16 p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform',
        className,
      )}
    >
      {/* Pictogramme accent — signale l'espace perso */}
      <div
        className="w-12 h-12 rounded-12 flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent }}
      >
        <PencilLine size={20} className="text-tx-1" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-serif font-bold text-lg text-bg-1 tracking-tight truncate leading-tight">
          {program.name}
        </h3>
        {program.focus && (
          <p className="font-sans text-sm text-tx-3 truncate">{program.focus}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-sans font-semibold text-xs text-tx-3">
            {count} séance{count > 1 ? 's' : ''}
          </span>
          {count > 0 && (
            <div className="flex items-center gap-1">
              {categories.slice(0, 5).map((cat, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_ACCENT[cat] || '#ffee8c' }}
                  aria-label={`Séance ${CATEGORY_LABEL[cat]}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ChevronRight size={20} className="text-tx-3 shrink-0" />
    </button>
  )
}
