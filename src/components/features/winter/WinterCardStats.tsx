import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { placeParts } from '@/lib/winter'

interface WinterCardStatsProps {
  /** Ta place dans la course ; null avant le départ (on montre alors le compte à rebours). */
  place: number | null
  /** Jours avant le départ, si le défi n'a pas commencé. */
  daysToStart: number | null
  pts: number
  summit: number
  missionsDone: number
  missionsTotal: number
  className?: string
}

/** Bas de la carte Winter une fois inscrit : ta place, tes points, tes missions (maquette D2). */
export default function WinterCardStats({
  place, daysToStart, pts, summit, missionsDone, missionsTotal, className,
}: WinterCardStatsProps) {
  const first =
    daysToStart !== null ? (
      <Stat value={<span className="text-pr-1">J-{daysToStart}</span>} label="départ" />
    ) : place !== null ? (
      <Stat
        value={
          <span className="text-pr-1">
            {placeParts(place).n}
            <sup className="text-[14px]">{placeParts(place).suffix}</sup>
          </span>
        }
        label="ta place"
      />
    ) : (
      <Stat value={<span className="text-pr-1">–</span>} label="ta place" />
    )

  return (
    <div className={cn('absolute left-[16px] right-[16px] bottom-[16px] grid grid-cols-3 gap-[8px]', className)}>
      {first}
      <Stat value={<>{pts}<Of n={summit} /></>} label="pts" />
      <Stat value={<>{missionsDone}<Of n={missionsTotal} /></>} label="missions" />
    </div>
  )
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col">
      <b className="font-serif font-bold text-[28px] leading-none text-bg-1">{value}</b>
      <span className="font-sans text-[12px] text-bg-2 leading-[1.5]">{label}</span>
    </div>
  )
}

function Of({ n }: { n: number }) {
  return <small className="font-sans text-[12px] font-semibold text-tx-3"> / {n}</small>
}
