import type { ReactNode } from 'react'
import type { WeeklyMissions } from '@/hooks/useWeeklyMissions'
import { cn } from '@/lib/utils'

interface WinterMissionsProps {
  missions: WeeklyMissions
  className?: string
}

// Icônes de la maquette C5 (tracés repris tels quels)
const trait = { fill: 'none', stroke: '#ffee8c', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const ICONE_DUO = (
  <svg viewBox="0 0 24 24" width="16" height="16" {...trait} aria-hidden="true" className="block">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const ICONE_SEMAINE = (
  <svg viewBox="0 0 24 24" width="16" height="16" {...trait} aria-hidden="true" className="block">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" />
  </svg>
)
const ICONE_RECORD = (
  <svg viewBox="0 0 24 24" width="16" height="16" {...trait} aria-hidden="true" className="block">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

/** Missions de la semaine : aucune ne donne de points, chacune débloque une médaille (C5). */
export default function WinterMissions({ missions, className }: WinterMissionsProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-[8px]', className)}>
      <Mission icone={ICONE_DUO} nom="En duo" info="Invite un pote" fait={missions.duo} />
      <Mission
        icone={ICONE_SEMAINE}
        nom="Haut + bas"
        info={missions.hautBas ? 'Semaine validée' : `${missions.hautBasCount} / 2`}
        fait={missions.hautBas}
      />
      <Mission
        icone={ICONE_RECORD}
        nom="Nouveau record"
        info={missions.record ? (missions.recordLabel ?? '1 / 1') : '0 / 1'}
        fait={missions.record}
      />
    </div>
  )
}

function Mission({ icone, nom, info, fait }: { icone: ReactNode; nom: string; info: string; fait: boolean }) {
  return (
    <div
      className="winter-mission box-border h-[112px] p-[12px] rounded-[12px] bg-white flex flex-col justify-between"
      style={{ boxShadow: fait ? '0 0 0 2px #ffee8c' : 'none' }}
    >
      <div className="flex items-center justify-between">
        <span className="size-[32px] rounded-full bg-tx-1 flex items-center justify-center">{icone}</span>
        {fait ? (
          <span className="winter-coche size-[22px] rounded-full bg-pr-1 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#1b1d1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="Fait" role="img" className="block">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        ) : (
          <span className="size-[22px] rounded-full bg-bg-1 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#989da6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-label="Médaille" role="img" className="block">
              <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
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
