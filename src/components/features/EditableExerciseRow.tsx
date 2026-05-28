import { type ReactNode } from 'react'
import { Minus, Plus, Trash2, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DraftExercise } from '@/lib/myPrograms'

interface EditableExerciseRowProps {
  draft: DraftExercise
  accent: string
  /** Libellé de slot guide (ex. « Contraction »). Absent pour un exo libre. */
  label?: string
  /** Slot recommandé (optionnel) : cadre teinté + tag « Recommandé ». */
  recommended?: boolean
  onChange: (patch: Partial<DraftExercise>) => void
  onRemove: () => void
  /** Ouvre le picker pour remplacer l'exercice. */
  onReplace?: () => void
  /** Poignée de drag (exos libres réordonnables). */
  dragHandle?: ReactNode
  className?: string
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Ligne d'exercice paramétrable (séries / reps / repos) — slots guides et exos libres. */
export default function EditableExerciseRow({
  draft,
  accent,
  label,
  recommended,
  onChange,
  onRemove,
  onReplace,
  dragHandle,
  className,
}: EditableExerciseRowProps) {
  const repsNum = parseInt(draft.reps, 10) || 0

  return (
    <div
      className={cn(
        'bg-white rounded-12 p-3 shadow-[0px_0px_24px_0px_rgba(31,32,33,0.08)]',
        className,
      )}
      style={recommended ? { border: `1.5px solid ${accent}55` } : undefined}
    >
      <div className="flex items-center gap-2">
        {dragHandle}
        {label && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold uppercase shrink-0"
            style={{ backgroundColor: `${accent}40`, color: accent }}
          >
            {label}
          </span>
        )}
        {recommended && (
          <span className="font-sans text-[11px] text-tx-3 shrink-0">Recommandé</span>
        )}
        <button
          type="button"
          onClick={onReplace}
          className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer"
          aria-label={`Remplacer ${draft.exercise?.name ?? "l'exercice"}`}
        >
          <span className="font-sans font-semibold text-base text-tx-1 truncate">
            {draft.exercise?.name ?? 'Exercice'}
          </span>
          {onReplace && <Repeat size={13} className="text-tx-3 shrink-0" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Retirer l'exercice"
          className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <Trash2 size={16} className="text-[#e62d2d]" />
        </button>
      </div>

      <div className="flex items-stretch gap-2 mt-3">
        <Stepper
          caption="Séries"
          value={draft.sets}
          onChange={(v) => onChange({ sets: clamp(v, 1, 12) })}
        />
        <Stepper
          caption="Reps"
          value={repsNum}
          onChange={(v) => onChange({ reps: String(clamp(v, 1, 50)) })}
        />
        <Stepper
          caption="Repos (s)"
          value={draft.rest_seconds}
          step={15}
          onChange={(v) => onChange({ rest_seconds: clamp(v, 0, 300) })}
        />
      </div>
    </div>
  )
}

function Stepper({
  caption,
  value,
  step = 1,
  onChange,
}: {
  caption: string
  value: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex-1 bg-bg-1 rounded-12 py-2 flex flex-col items-center gap-1">
      <span className="font-sans font-semibold text-[10px] uppercase text-tx-3 tracking-wide">
        {caption}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(value - step)}
          aria-label={`Diminuer ${caption}`}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform shadow-[0px_1px_3px_rgba(0,0,0,0.08)]"
        >
          <Minus size={14} className="text-tx-1" />
        </button>
        <span className="w-8 text-center font-sans font-bold text-base text-tx-1 tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          aria-label={`Augmenter ${caption}`}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform shadow-[0px_1px_3px_rgba(0,0,0,0.08)]"
        >
          <Plus size={14} className="text-tx-1" />
        </button>
      </div>
    </div>
  )
}
