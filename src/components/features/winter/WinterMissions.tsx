import type { ReactNode } from 'react'
import { Award, CalendarCheck, Check, Trophy, Users } from 'lucide-react'
import type { WeeklyMissions } from '@/hooks/useWeeklyMissions'
import { cn } from '@/lib/utils'

interface WinterMissionsProps {
  missions: WeeklyMissions
  className?: string
}

/** Missions de la semaine : aucune ne donne de points, chacune débloque une médaille (C5). */
export default function WinterMissions({ missions, className }: WinterMissionsProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-[8px]', className)}>
      <Mission icone={<Users size={16} strokeWidth={2} />} nom="En duo" info="Invite un pote" fait={missions.duo} />
      <Mission
        icone={<CalendarCheck size={16} strokeWidth={2} />}
        nom="Haut + bas"
        info={missions.hautBas ? 'Semaine validée' : `${missions.hautBasCount} / 2`}
        fait={missions.hautBas}
      />
      <Mission
        icone={<Trophy size={16} strokeWidth={2} />}
        nom="Nouveau record"
        info={missions.record ? (missions.recordLabel ?? 'Record battu') : '0 / 1'}
        fait={missions.record}
      />
    </div>
  )
}

function Mission({ icone, nom, info, fait }: { icone: ReactNode; nom: string; info: string; fait: boolean }) {
  return (
    <div
      className="winter-mission h-[112px] p-[12px] rounded-[12px] bg-white flex flex-col justify-between"
      style={{ boxShadow: fait ? '0 0 0 2px #ffee8c' : 'none' }}
    >
      <div className="flex items-center justify-between">
        <span className="size-[32px] rounded-full bg-tx-1 text-pr-1 flex items-center justify-center" aria-hidden="true">
          {icone}
        </span>
        {fait ? (
          <span className="winter-coche size-[22px] rounded-full bg-pr-1 flex items-center justify-center">
            <Check size={13} strokeWidth={3} className="text-tx-1" aria-label="Fait" />
          </span>
        ) : (
          <span className="size-[22px] rounded-full bg-bg-1 flex items-center justify-center">
            <Award size={13} strokeWidth={2.4} className="text-tx-3" aria-label="Médaille" />
          </span>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <b className="font-sans text-[14px] font-bold leading-[18px] text-tx-1">{nom}</b>
        <span className="font-sans text-[12px] text-tx-3 leading-[16px] truncate">{info}</span>
      </div>
    </div>
  )
}
