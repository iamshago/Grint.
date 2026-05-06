import type { ChallengeRanking } from '@/types'
import { firstNameOnly } from '@/lib/displayName'

interface ChallengePodiumProps {
  /** Top 3 trié par pts desc — peut être de longueur 0..3. */
  top: ChallengeRanking[]
}

const COLUMN_HEIGHT_BY_RANK: Record<number, number> = { 1: 137, 2: 97, 3: 58 }
const COLUMN_BG_BY_RANK: Record<number, string> = {
  1: '#ffee8c',
  2: 'rgba(255,238,140,0.9)',
  3: 'rgba(255,238,140,0.7)',
}
const COLUMN_PILL_BG_BY_RANK: Record<number, string> = {
  1: '#ffee8c',
  2: 'rgba(255,238,140,0.9)',
  3: 'rgba(255,238,140,0.7)',
}
// Ordre d'affichage Figma : 2 | 1 | 3
const ORDER: Array<1 | 2 | 3> = [2, 1, 3]
const LEFT_BY_RANK: Record<1 | 2 | 3, number> = { 2: 23, 1: 135, 3: 247 }
const TOP_BY_RANK: Record<1 | 2 | 3, number> = { 1: 69, 2: 109, 3: 148 }

/** Podium 3 marches (1ère plus haute, 2/3 dégradées) en fond noir. */
export default function ChallengePodium({ top }: ChallengePodiumProps) {
  return (
    <div className="relative bg-tx-1 h-[278px] w-full rounded-[16px] overflow-hidden">
      {ORDER.map((rank) => {
        const participant = top[rank - 1]
        if (!participant) return null
        const name = firstNameOnly(participant.profile?.display_name) || participant.profile?.username || '—'
        return (
          <div
            key={rank}
            className="absolute flex flex-col items-center gap-[12px] w-[100px]"
            style={{ left: LEFT_BY_RANK[rank], top: TOP_BY_RANK[rank] }}
          >
            <div className="flex flex-col items-center gap-[4px]">
              <p className="font-serif font-bold text-[20px] text-bg-1 whitespace-nowrap">{name}</p>
              <div
                className="rounded-[8px] px-[18px] py-[8px] flex items-center justify-center"
                style={{ background: COLUMN_PILL_BG_BY_RANK[rank] }}
              >
                <span className="font-sans font-bold text-[12px] text-tx-1 leading-none whitespace-nowrap">
                  {participant.pts} pts
                </span>
              </div>
            </div>
            <div
              className="w-full rounded-tl-[16px] rounded-tr-[16px] drop-shadow-[0px_0px_10px_rgba(255,238,140,0.3)] relative"
              style={{
                background: COLUMN_BG_BY_RANK[rank],
                height: COLUMN_HEIGHT_BY_RANK[rank],
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif font-bold text-[24px] tracking-[-0.72px] text-tx-1 leading-none">
                  {rank}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
