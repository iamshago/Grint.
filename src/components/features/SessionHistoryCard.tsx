import { Clock, Dumbbell, Flame, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'

interface SessionHistoryCardProps {
  title: string
  date: string
  durationMin: number
  exerciseCount: number
  calories: number
  prCount?: number
  className?: string
}

/** Carte historique de séance — Figma node 372:961 */
export default function SessionHistoryCard({
  title,
  date,
  durationMin,
  exerciseCount,
  calories,
  prCount = 0,
  className,
}: SessionHistoryCardProps) {
  return (
    <Card variant="dark" className={cn('h-[157px] relative', className)}>
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <h3 className="font-serif font-bold text-2xl text-bg-1">{title}</h3>
          <span className="font-sans font-bold text-xs text-[#989da6] uppercase">
            {date}
          </span>
        </div>

        {/* Durée + Exercices */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-bg-1" />
            <span className="font-sans text-base text-bg-1">{durationMin} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-bg-1" />
            <span className="font-sans text-base text-bg-1">{exerciseCount} exercices</span>
          </div>
        </div>
      </div>

      {/* Footer — Calories + PR */}
      <div className="absolute bottom-0 left-0 right-0 h-[67px] bg-[rgba(12,12,12,0.5)] flex items-center px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(255,238,140,0.25)]">
            <Flame size={16} className="text-pr-1" />
          </div>
          <div>
            <p className="font-sans font-semibold text-xs text-[#989da6]">CALORIES</p>
            <p className="font-sans font-semibold text-base text-bg-1">{calories} Kcal</p>
          </div>
        </div>

        {prCount > 0 && (
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pr-1">
              <Trophy size={16} className="text-tx-1" />
            </div>
            <div>
              <p className="font-sans font-semibold text-xs text-[#989da6]">RECORD</p>
              <p className="font-sans font-semibold text-base text-pr-1">+{prCount} PR</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
