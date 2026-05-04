import { useNavigate } from 'react-router-dom'
import type { Challenge, ChallengeProgress, ProfileSummary } from '@/types'
import { getAvatarById } from '@/lib/avatars'
import { formatShortDate } from '@/lib/formatRelativeTime'
import { cn } from '@/lib/utils'

interface ChallengeCardProps {
  challenge: Challenge
  isParticipant: boolean
  progress: ChallengeProgress | null
  /** Profils des participants (pour les avatars) */
  participantProfiles?: ProfileSummary[]
}

/** Carte unique du défi actif sur /community.
 *  Toute la carte est cliquable :
 *   - non-participant → page Join
 *   - participant     → page Détail
 *  Le bouton CTA gère son propre clic (et propage stopPropagation pour éviter le double).
 */
export default function ChallengeCard({ challenge, isParticipant, progress, participantProfiles = [] }: ChallengeCardProps) {
  const navigate = useNavigate()
  const N = progress?.participantCount ?? 0
  const weeklyTarget = progress?.weeklyTarget ?? challenge.sessions_per_week_per_member * Math.max(N, 1)
  const totalCompleted = progress?.totalCompleted ?? 0
  const totalGoal = progress?.totalGoal ?? 0
  const ratio = totalGoal > 0 ? Math.min(1, totalCompleted / totalGoal) : 0

  const visibleAvatars = participantProfiles.slice(0, 3)
  const extra = Math.max(0, N - 3)

  const goToTarget = () => {
    if (isParticipant) navigate(`/community/challenges/${challenge.id}`)
    else navigate(`/community/challenges/${challenge.id}/join`)
  }

  return (
    <button
      type="button"
      onClick={goToTarget}
      aria-label={`Défi ${challenge.name}`}
      className="relative w-full text-left bg-white border border-bg-2 rounded-[12px] shadow-[0px_0px_24px_0px_rgba(31,32,33,0.12)] h-[161px] overflow-hidden active:scale-[0.99] transition-transform"
    >
      {/* Titre */}
      <p className="absolute left-[15px] top-[15px] font-serif font-bold text-[20px] text-tx-1 tracking-[-0.6px] whitespace-nowrap">
        {challenge.name}
      </p>

      {/* Date à droite */}
      <div className="absolute right-[16px] top-[15px] flex flex-col items-end gap-[2px]">
        <span className="font-sans text-[12px] text-tx-2 leading-none">Jusqu'au</span>
        <span className="font-sans font-bold text-[16px] text-tx-1 leading-none">
          {formatShortDate(challenge.ends_at)}
        </span>
      </div>

      {/* Sous-titre dynamique : "{S × N} séances par semaine" */}
      <p className="absolute left-1/2 -translate-x-1/2 top-[43px] font-sans text-[12px] text-tx-2 text-center whitespace-nowrap" style={{ left: 'calc(50% - 104px)' }}>
        <strong className="font-sans font-bold text-tx-1">{weeklyTarget} séances</strong>
        <span> par semaine</span>
      </p>

      {/* Barre de progression */}
      <div className="absolute left-[15px] top-[73px] w-[338px] h-[12px] rounded-[8px] bg-bg-2 overflow-hidden">
        <div
          className="h-full rounded-[8px] bg-tx-1 shadow-[0px_0px_24px_0px_rgba(31,32,33,0.12),0px_0px_15.5px_5px_rgba(255,255,255,0.2)]"
          style={{ width: `${Math.max(4, ratio * 100)}%` }}
        />
      </div>

      {/* Avatars participants overlap */}
      <div className="absolute left-[15px] bottom-[16px] flex items-center pr-[20px]">
        {visibleAvatars.map((p) => {
          const av = getAvatarById(p.avatar_id || 'superman')
          return (
            <div
              key={p.id}
              className="relative size-[40px] rounded-[23.226px] border-[1.5px] border-[#dde0e7] shadow-[0px_0px_16px_0px_rgba(31,32,33,0.4)] overflow-hidden -mr-[20px]"
            >
              <img src={av?.src} alt="" className="absolute inset-0 size-full object-cover" />
            </div>
          )
        })}
        {extra > 0 && (
          <div className="relative size-[40px] rounded-[23.226px] border-[1.5px] border-[#dde0e7] bg-tx-1 text-bg-1 flex items-center justify-center font-sans font-bold text-[12px] -mr-[20px]">
            +{extra}
          </div>
        )}
      </div>

      {/* CTA Rejoindre / Déjà rejoint */}
      <div
        className={cn(
          'absolute bottom-[15px] right-[15px] rounded-[8px] flex items-center justify-center px-[16px] py-[12px]',
          isParticipant
            ? 'bg-bg-2 cursor-not-allowed opacity-60'
            : 'bg-tx-1',
        )}
        onClick={(e) => {
          // Si pas participant : on laisse la propagation pour aussi naviguer vers /join
          // Si déjà participant : on stoppe pour que rien ne se passe (la carte reste cliquable elle-même)
          if (isParticipant) e.stopPropagation()
        }}
        aria-disabled={isParticipant}
      >
        <span className={cn('font-sans font-semibold text-[16px]', isParticipant ? 'text-tx-2' : 'text-pr-1')}>
          {isParticipant ? 'Déjà rejoint' : 'Rejoindre'}
        </span>
      </div>
    </button>
  )
}
