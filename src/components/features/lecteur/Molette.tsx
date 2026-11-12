import { useEffect, useRef, type UIEvent } from 'react'

interface PickerProps {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  /** Change à chaque série : recale la molette sur la valeur. */
  stepKey: string
}

interface MoletteProps extends PickerProps {
  libelle: string
  /** Position dans la vue de saisie (maquette H1 : 266 et 431). */
  top: number
}

/** Molette du lecteur (G-Molette) : libellé + chiffres qui défilent à l'horizontale. */
export default function Molette({ libelle, top, ...picker }: MoletteProps) {
  return (
    <div className="absolute left-[32px] right-[32px] h-[141px] bg-tx-1 rounded-[24px] overflow-hidden" style={{ top }}>
      <p className="text-center text-tx-3 text-[12px] font-sans font-semibold uppercase mt-6">{libelle}</p>
      <HorizontalPicker {...picker} />
    </div>
  )
}

// Molette horizontale (déplacée telle quelle de WorkoutSession.tsx)
function HorizontalPicker({ value, onChange, min, max, stepKey }: PickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const itemWidth = 80
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const isManualScroll = useRef(false)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (scrollRef.current && !isManualScroll.current) {
      scrollRef.current.scrollLeft = (value - min) * itemWidth
    }
  }, [value, min, stepKey])

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    isManualScroll.current = true
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      isManualScroll.current = false
    }, 150)
    const scrollLeft = e.currentTarget.scrollLeft
    const index = Math.round(scrollLeft / itemWidth)
    const newValue = min + index
    if (newValue !== value && newValue >= min && newValue <= max) onChange(newValue)
  }

  return (
    <div
      className="relative w-full h-20 overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 40%, black 60%, transparent)',
      }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex overflow-x-auto overflow-y-hidden touch-pan-x snap-x snap-mandatory no-scrollbar items-center"
        style={{
          paddingLeft: 'calc(50% - 40px)',
          paddingRight: 'calc(50% - 40px)',
        }}
      >
        {items.map((num) => (
          <div
            key={num}
            className={`shrink-0 w-20 h-20 flex items-center justify-center snap-center transition-all duration-300 cursor-grab active:cursor-grabbing ${
              value === num ? 'scale-110 opacity-100' : 'scale-90 opacity-30'
            }`}
          >
            <span
              className={`transition-colors ${
                value === num
                  ? 'text-5xl font-bold text-white'
                  : 'text-3xl font-bold text-gray-500'
              }`}
            >
              {num}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
