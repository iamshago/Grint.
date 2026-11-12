import type { ReactNode } from 'react'
import { formatShortDate } from '@/lib/formatRelativeTime'
import { placeParts } from '@/lib/winter'
import type { Challenge } from '@/types'
import WinterMountainScene from './WinterMountainScene'
import type { Grimpeur } from './WinterPile'

interface WinterMountainCardProps {
  challenge: Challenge
  /** Avant le départ : jours restants (remplace ta place). */
  daysToStart: number | null
  place: number | null
  /** Points affichés (changent à l'arrivée) et points de ta dernière visite. */
  pts: number
  prevPts: number
  /** Top de la semaine ; avant le départ, on montre le nombre d'inscrits. */
  top: { nom: string; pts: number } | null
  inscrits: number
  moiAvatar: string | null
  autres: Grimpeur[]
  foule: boolean
}

/** Carte sombre de la page défi Winter : en tête ta place, tes points, le top de la semaine ; dessous la montagne (C5). */
export default function WinterMountainCard({
  challenge, daysToStart, place, pts, prevPts, top, inscrits, moiAvatar, autres, foule,
}: WinterMountainCardProps) {
  const summit = challenge.summit_points ?? 24
  const avant = daysToStart !== null
  const gagne = pts > prevPts

  return (
    <div className="bg-tx-1 rounded-[24px] pt-[16px] flex flex-col overflow-hidden text-bg-1">
      <div className="px-[24px] flex items-start justify-between gap-[12px]">
        <p className="flex-1 font-serif font-bold text-[20px] tracking-[-0.6px] leading-[1.5]">{challenge.name}</p>
        <div className="shrink-0 flex flex-col items-end gap-[2px] mt-[2px]">
          <span className="font-sans text-[12px] text-bg-2 leading-none">{avant ? 'Dès le' : "Jusqu'au"}</span>
          <span className="font-sans font-bold text-[16px] leading-none">
            {formatShortDate(avant ? challenge.starts_at : challenge.ends_at)}
          </span>
        </div>
      </div>

      <div className="px-[24px] mt-[12px] grid gap-[8px]" style={{ gridTemplateColumns: '1fr 1fr 1.6fr' }}>
        {avant ? (
          <Stat value={<span className="text-pr-1">J-{daysToStart}</span>} label="départ" />
        ) : (
          <Stat
            value={
              <span className={gagne ? 'winter-saute text-pr-1' : 'text-pr-1'}>
                {place ? placeParts(place).n : '–'}
                {place && <sup className="text-[14px]">{placeParts(place).suffix}</sup>}
              </span>
            }
            label="ta place"
          />
        )}
        <Stat value={<span className={gagne ? 'winter-saute' : undefined}>{pts}</span>} label="pts" />
        {avant ? (
          <Stat value={inscrits} label="inscrits" />
        ) : (
          <Stat
            value={top && top.pts > 0 ? `+${top.pts}` : '0'}
            label={top && top.pts > 0 ? `${top.nom}, top semaine` : 'top semaine'}
          />
        )}
      </div>

      <div className="mt-[14px]">
        <WinterMountainScene
          summit={summit}
          milestones={challenge.milestones ?? []}
          moi={moiAvatar ? { avatar: moiAvatar, pts, prevPts } : null}
          autres={autres}
          foule={foule}
        />
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-[2px] min-w-0">
      <b className="font-serif font-bold text-[28px] leading-none">{value}</b>
      <span className="font-sans text-[12px] text-tx-3 leading-[1.5] truncate">{label}</span>
    </div>
  )
}
