// @ts-nocheck
import { Play, Clock, Dumbbell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_ACCENT, type WorkoutCategory } from '@/lib/categoryColors'

interface WorkoutCardProps {
  title: string
  difficulty?: string
  durationMin?: number
  exerciseCount?: number
  imageUrl?: string | null
  category?: WorkoutCategory
  isCompleted?: boolean
  /** Click sur la carte ou le bouton play — déclenche l'ouverture de la séance */
  onPlay?: () => void
  variant?: 'light' | 'dark'
  className?: string
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
  // Accent dérivé de la source unique ; le badge réutilise l'accent à 25% d'alpha (0x40).
  const accent = CATEGORY_ACCENT[category] ?? CATEGORY_ACCENT.upper
  const styles = {
    badgeBg: `${accent}40`,
    badgeBorder: accent,
    badgeText: accent,
    playBg: accent,
    playIcon: '#1f2021',
  }

  /** Si la carte est interactive, on rend un <button> pour avoir un seul handler
   *  qui s'applique à TOUT le clic (carte + zone du play). Évite les doubles handlers
   *  et garantit que tap sur l'image, le titre, la durée, etc. ouvre la séance. */
  const Wrapper: any = onPlay ? 'button' : 'div'
  const interactiveProps = onPlay
    ? {
        onClick: onPlay,
        type: 'button' as const,
        'aria-label': isCompleted ? `Revoir ${title}` : `Lancer ${title}`,
      }
    : {}

  return (
    <Wrapper
      {...interactiveProps}
      className={cn(
        'relative rounded-[16px] overflow-hidden h-[168px] block w-full text-left',
        !imageUrl && 'bg-tx-1',
        onPlay && 'cursor-pointer active:scale-[0.98] transition-transform',
        className,
      )}
    >
      {/* Image de fond — utilise la version `<slug>-card.png` (allégée pour
       *  thumbnail), avec fallback automatique sur la base si elle n'existe
       *  pas (cas lower-body, abs-killer). Le dataset.fallback évite la
       *  boucle infinie si la base 404 elle aussi. */}
      {imageUrl && (
        <img
          src={imageUrl.replace(/\.(png|jpg|jpeg|webp)$/i, '-card.$1')}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget
            if (img.dataset.fallback === '1') return
            img.dataset.fallback = '1'
            img.src = imageUrl
          }}
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

      {/* Indicateur play / coche — visuel uniquement (le clic est géré par le wrapper) */}
      {onPlay && (
        <div
          className="absolute right-4 bottom-4 w-12 h-12 rounded-12 flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: styles.playBg }}
          aria-hidden="true"
        >
          {isCompleted ? (
            <Check size={20} strokeWidth={3} style={{ color: styles.playIcon }} />
          ) : (
            <Play size={18} fill={styles.playIcon} style={{ color: styles.playIcon }} />
          )}
        </div>
      )}
    </Wrapper>
  )
}
