// @ts-nocheck
import { Clock, Dumbbell, Flame } from 'lucide-react'

/** Formate une date en "20 FÉV" */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
  return `${day} ${month}`
}

interface SessionCardProps {
  title: string
  date: string
  durationMin: number
  exerciseCount: number
  calories: number
  prCount: number
  className?: string
}

/** Carte séance réutilisable — Figma node 372:1125 (identique sur Profil et Historique) */
export default function SessionCard({
  title,
  date,
  durationMin,
  exerciseCount,
  calories,
  prCount,
  className,
}: SessionCardProps) {
  const dateLabel = formatShortDate(date)

  return (
    <div className={`bg-[#1b1d1f] rounded-[16px] h-[157px] relative overflow-hidden ${className || ''}`}>
      {/* Titre */}
      <p className="absolute top-[16px] left-[16px] right-[80px] font-serif font-bold text-[24px] text-bg-1 leading-tight truncate">
        {title}
      </p>

      {/* Date en haut à droite */}
      <p className="absolute top-[16px] right-[16px] font-sans font-bold text-[12px] text-tx-3 uppercase">
        {dateLabel}
      </p>

      {/* Durée + Exercices */}
      <div className="absolute top-[55px] left-[16px] flex items-center gap-[16px]">
        <div className="flex items-center gap-[8px]">
          <Clock size={16} className="text-tx-3" />
          <span className="font-sans text-[16px] text-bg-1">
            {durationMin > 0 ? `${durationMin} min` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-[8px]">
          <Dumbbell size={16} className="text-tx-3" />
          <span className="font-sans text-[16px] text-bg-1">
            {exerciseCount > 0 ? `${exerciseCount} exercices` : '—'}
          </span>
        </div>
      </div>

      {/* Barre inférieure — Calories + Record */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[67px] flex items-center justify-between px-[16px]"
        style={{ backgroundColor: 'rgba(12,12,12,0.5)' }}
      >
        {/* Calories */}
        <div className="flex items-center gap-[8px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,238,140,0.25)' }}
          >
            <Flame size={16} className="text-[#ffee8c]" />
          </div>
          <div className="flex flex-col gap-[2px]">
            <span className="font-sans font-semibold text-[12px] text-tx-3 uppercase">Calories</span>
            <span className="font-sans font-semibold text-[16px] text-bg-1">
              {calories > 0 ? `${calories} Kcal` : '— Kcal'}
            </span>
          </div>
        </div>

        {/* Record */}
        <div className="flex items-center gap-[8px]">
          <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 bg-[#ffee8c]">
            <img
              src="/assets/biceps-icon.svg"
              alt=""
              className="w-[16px] h-[16px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(10%) sepia(10%) saturate(200%) hue-rotate(180deg)' }}
            />
          </div>
          <div className="flex flex-col gap-[2px]">
            <span className="font-sans font-semibold text-[12px] text-tx-3 uppercase">Record</span>
            <span className="font-sans font-semibold text-[16px] text-[#ffee8c]">
              {prCount > 0 ? `+${prCount} PR` : '— PR'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
