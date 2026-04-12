// @ts-nocheck
import { Play, Clock, Dumbbell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type WorkoutCategory = 'upper' | 'lower' | 'bbl'

interface WorkoutCardProps {
  title: string
  difficulty?: string
  durationMin?: number
  exerciseCount?: number
  imageUrl?: string | null
  category?: WorkoutCategory
  isCompleted?: boolean
  onPlay?: () => void
  variant?: 'light' | 'dark'
  className?: string
}

/** Couleurs par catégorie — badge, play button */
const CATEGORY_STYLES: Record<WorkoutCategory, { badgeBg: string; badgeBorder: string; badgeText: string; playBg: string; playIcon: string }> = {
  upper: {
    badgeBg: 'rgba(255,238,140,0.25)',
    badgeBorder: '#ffee8c',
    badgeText: '#ffee8c',
    playBg: '#ffee8c',
    playIcon: '#1f2021',
  },
  lower: {
    badgeBg: 'rgba(80,127,255,0.25)',
    badgeBorder: '#507fff',
    badgeText: '#507fff',
    playBg: '#507fff',
    playIcon: '#1f2021',
  },
  bbl: {
    badgeBg: 'rgba(255,99,179,0.25)',
    badgeBorder: '#ff63b3',
    badgeText: '#ff63b3',
    playBg: '#ff63b3',
    playIcon: '#1f2021',
  },
}

/** Carte séance — Figma node 212:1241 */
export default function WorkoutCard({
  title,
  difficulty,
  durationMin,
  exerciseCount,
  imageUrl,
  category = 'upper',
  isCompleted = false,
  onPlay,
  variant = 'light',
  className,
}: WorkoutCardProps) {
  const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES.upper

  return (
    <div
      className={cn(
        'relative rounded-[16px] overflow-hidden h-[168px]',
        className,
      )}
    >
      {/* Image de fond */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradient gauche pour lisibilité du texte */}
      <div
        className="absolute inset-y-0 left-0 w-[240px]"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgba(31,32,33,0.9) 0%, rgba(31,32,33,0) 100%)',
        }}
      />

      {/* Badge difficulté */}
      {difficulty && (
        <div
          className="absolute top-6 left-6 px-3 py-1.5 rounded-lg border flex items-center"
          style={{
            backgroundColor: styles.badgeBg,
            borderColor: styles.badgeBorder,
          }}
        >
          <span
            className="font-sans font-semibold text-xs uppercase"
            style={{ color: styles.badgeText }}
          >
            {difficulty}
          </span>
        </div>
      )}

      {/* Titre */}
      <p className="absolute bottom-[87px] left-6 font-serif font-bold text-[32px] text-bg-1 tracking-[-0.96px] translate-y-full whitespace-nowrap">
        {title}
      </p>

      {/* Infos durée + exercices */}
      <div className="absolute bottom-[22px] left-6 flex items-center gap-4">
        {durationMin != null && (
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: styles.badgeText }} />
            <span className="font-sans text-base text-bg-1">{durationMin} min</span>
          </div>
        )}
        {exerciseCount != null && (
          <div className="flex items-center gap-2">
            <Dumbbell size={16} style={{ color: styles.badgeText }} />
            <span className="font-sans text-base text-bg-1">{exerciseCount} exercices</span>
          </div>
        )}
      </div>

      {/* Bouton play / coche (si terminée) — toujours cliquable */}
      {onPlay && (
        <button
          onClick={onPlay}
          className="absolute right-4 bottom-4 w-12 h-12 rounded-12 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          style={{ backgroundColor: styles.playBg }}
          aria-label={isCompleted ? `Revoir ${title}` : `Lancer ${title}`}
        >
          {isCompleted ? (
            <Check size={20} strokeWidth={3} style={{ color: styles.playIcon }} />
          ) : (
            <Play size={18} fill={styles.playIcon} style={{ color: styles.playIcon }} />
          )}
        </button>
      )}
    </div>
  )
}
