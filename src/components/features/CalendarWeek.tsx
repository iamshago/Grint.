import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAccent } from '@/lib/AccentContext'

interface CalendarWeekProps {
  selectedDay: number
  onSelectDay: (day: number) => void
  workoutDays?: number[]
  accentColor?: string
  className?: string
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getWeekDates(): { dayOfWeek: number; dayNum: number }[] {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { dayOfWeek: i, dayNum: d.getDate() }
  })
}

/** Bandeau calendrier semaine — Figma node 405:1593 */
export default function CalendarWeek({
  selectedDay,
  onSelectDay,
  workoutDays = [],
  accentColor,
  className,
}: CalendarWeekProps) {
  const dates = getWeekDates()
  const { accent } = useAccent()
  const pillColor = accentColor || accent
  const containerRef = useRef<HTMLDivElement>(null)
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button')
    const btn = buttons[selectedDay]
    if (!btn) return
    setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [selectedDay])

  return (
    <div ref={containerRef} className={cn('flex gap-1.5 items-center w-full relative', className)}>
      {/* Pill animé unique */}
      {pillStyle && (
        <div
          className="absolute top-0 h-[66px] rounded-12 z-0"
          style={{
            left: pillStyle.left,
            width: pillStyle.width,
            backgroundColor: pillColor,
            transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      {dates.map(({ dayOfWeek, dayNum }) => {
        const isSelected = dayOfWeek === selectedDay

        return (
          <button
            key={dayOfWeek}
            onClick={() => onSelectDay(dayOfWeek)}
            aria-label={`${DAY_LABELS[dayOfWeek]} ${dayNum}`}
            className={cn(
              'flex-1 h-[66px] rounded-12 relative cursor-pointer transition-colors z-10',
              isSelected ? 'text-tx-1' : 'text-bg-1',
            )}
          >
            <span className="absolute left-1/2 -translate-x-1/2 top-[12px] font-sans font-semibold text-xs">
              {DAY_LABELS[dayOfWeek]}
            </span>
            <span className="absolute left-1/2 -translate-x-1/2 top-[30px] font-sans font-bold text-2xl uppercase">
              {dayNum}
            </span>
          </button>
        )
      })}
    </div>
  )
}
