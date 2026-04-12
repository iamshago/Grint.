import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExerciseRowProps {
  index: number
  name: string
  sets: number
  reps: string
  onPlay?: () => void
  onClick?: () => void
  completed?: boolean
  selected?: boolean
  variant?: 'light' | 'dark'
  accent?: string
  className?: string
}

/**
 * Ligne d'exercice — 3 états en dark mode (Figma node 312:885)
 * - Default : fond tx-1, texte accent, play accent semi-transparent
 * - Selected : bordure accent, fond avec tint accent, texte accent
 * - Completed : fond tx-1 + opacity 40%, texte gris, play gris
 */
export default function ExerciseRow({
  index,
  name,
  sets,
  reps,
  onPlay,
  onClick,
  completed = false,
  selected = false,
  variant = 'dark',
  accent,
  className,
}: ExerciseRowProps) {
  const isLight = variant === 'light'
  const accentColor = accent || '#ffee8c'

  // Couleurs séries/réps selon l'état
  const metaColor = completed ? '#989da6' : isLight ? undefined : accentColor
  // Couleur bouton play selon l'état
  const playBg = completed ? '#3d4149' : isLight ? '#1b1d1f' : `${accentColor}40`
  const playColor = completed ? '#989da6' : isLight ? accentColor : accentColor

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'flex items-center gap-3 p-3 rounded-12 transition-all duration-200',
        isLight ? 'bg-bg-1 shadow-[0px_0px_24px_0px_rgba(31,32,33,0.08)]' : 'bg-tx-1',
        completed && 'opacity-40',
        onClick && 'cursor-pointer active:scale-[0.98]',
        className,
      )}
      style={{
        // Selected : bordure accent + fond avec tint accent
        ...(selected && !isLight
          ? {
              border: `1px solid ${accentColor}`,
              backgroundImage: `linear-gradient(90deg, ${accentColor}0A 0%, ${accentColor}0A 100%), linear-gradient(90deg, #1b1d1f 0%, #1b1d1f 100%)`,
            }
          : {}),
      }}
    >
      {/* Numéro */}
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
          isLight ? 'bg-bg-2' : 'bg-[#3d4149]',
        )}
      >
        <span
          className={cn(
            'font-sans font-semibold text-base',
            isLight ? 'text-tx-1' : 'text-bg-1',
          )}
        >
          {index}
        </span>
      </div>

      {/* Infos exercice */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p
          className={cn(
            'font-sans font-semibold text-base leading-6 truncate',
            isLight ? 'text-tx-1' : 'text-bg-1',
          )}
        >
          {name}
        </p>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'font-sans font-semibold text-xs',
              isLight ? 'text-tx-3' : '',
            )}
            style={!isLight ? { color: metaColor } : undefined}
          >
            {sets} séries
          </span>
          <span className={cn('text-xs', isLight ? 'text-bg-2' : 'text-[#3d4149]')}>
            •
          </span>
          <span
            className={cn(
              'font-sans font-semibold text-xs',
              isLight ? 'text-tx-3' : '',
            )}
            style={!isLight ? { color: metaColor } : undefined}
          >
            {reps} réps
          </span>
        </div>
      </div>

      {/* Bouton play */}
      {onPlay && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPlay()
          }}
          aria-label={`Lancer ${name}`}
          className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 cursor-pointer active:scale-95 transition-transform"
          style={{ backgroundColor: playBg }}
        >
          <Play size={14} fill={playColor} color={playColor} />
        </button>
      )}

      {/* Play icon sans action pour completed */}
      {!onPlay && (
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
          style={{ backgroundColor: playBg }}
        >
          <Play size={14} fill={playColor} color={playColor} />
        </div>
      )}
    </div>
  )
}
