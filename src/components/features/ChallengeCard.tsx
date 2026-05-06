import { useNavigate } from 'react-router-dom'
import type { Challenge, ChallengeProgress, ProfileSummary } from '@/types'
import { resolveAvatarSrc } from '@/lib/avatars'
import { formatShortDate } from '@/lib/formatRelativeTime'
import { cn } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'

interface ChallengeCardProps {
  challenge: Challenge
  isParticipant: boolean
  progress: ChallengeProgress | null
  participantProfiles?: ProfileSummary[]
}

/** Carte unique du défi actif sur /community. Deux barres collectives :
 *  hebdo (reset lundi local, masquée si terminé) + totale (durée complète). */
export default function ChallengeCard({
  challenge,
  isParticipant,
  progress,
  participantProfiles = [],
}: ChallengeCardProps) {
  const navigate = useNavigate()
  const N = progress?.participantCount ?? 0
  const sessionsPerWeek = challenge.sessions_per_week_per_member

  const weeklyCompleted = progress?.weeklyCompleted ?? 0
  const weeklyTarget = progress?.weeklyTarget ?? 0
  const weeklyReached = weeklyTarget > 0 && weeklyCompleted >= weeklyTarget
  const isExpired = progress?.isExpired ?? false
  const showWeekly = !isExpired

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
      className={cn(
        'relative w-full text-left bg-tx-1 rounded-[12px] shadow-[0px_0px_24px_0px_rgba(31,32,33,0.12)] overflow-hidden active:scale-[0.99] transition-transform',
        showWeekly ? 'h-[210px]' : 'h-[161px]',
      )}
    >
      <p className="absolute left-[16px] top-[16px] font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px] whitespace-nowrap">
        {challenge.name}
      </p>

      <div className="absolute right-[16px] top-[16px] flex flex-col items-end gap-[2px]">
        <span className="font-sans text-[12px] text-bg-2 leading-none">
          {isExpired ? 'Statut' : "Jusqu'au"}
        </span>
        <span
          className={cn(
            'font-sans font-bold text-[16px] leading-none',
            isExpired ? 'text-tx-3' : 'text-bg-1',
          )}
        >
          {isExpired ? 'Défi terminé' : formatShortDate(challenge.ends_at)}
        </span>
      </div>

      <p className="absolute left-[16px] top-[44px] font-sans text-[12px] text-bg-2 whitespace-nowrap">
        <strong className="font-sans font-bold text-bg-1">{sessionsPerWeek} séances</strong>
        <span> par semaine</span>
      </p>

      {showWeekly && (
        <>
          <span
            className="absolute left-[16px] top-[78px] font-sans font-semibold text-[12px] text-bg-2 leading-none"
            aria-hidden="true"
          >
            Cette semaine
          </span>
          <span
            className={cn(
              'absolute right-[16px] top-[78px] font-sans font-bold text-[12px] leading-none tabular-nums transition-colors',
              weeklyReached ? 'text-pr-1' : 'text-bg-2',
            )}
            aria-hidden="true"
          >
            {weeklyCompleted} / {weeklyTarget}
          </span>
          <ProgressBar
            value={weeklyCompleted}
            max={weeklyTarget}
            ariaLabel="Progression hebdomadaire collective du défi"
            className="absolute left-[16px] right-[16px] top-[100px]"
          />
        </>
      )}

      <ProgressBar
        value={progress?.totalCompleted ?? 0}
        max={progress?.totalGoal ?? 0}
        ariaLabel="Progression totale du défi"
        className={cn(
          'absolute left-[16px] right-[16px]',
          showWeekly ? 'top-[128px]' : 'top-[74px]',
        )}
      />

      <div className="absolute left-[16px] bottom-[17px] flex items-center pr-[20px]">
        {visibleAvatars.map((p) => {
          const avSrc = resolveAvatarSrc(p)
          return (
            <div
              key={p.id}
              className="relative size-[40px] rounded-[23.226px] border-[1.5px] border-tx-1 shadow-[0px_0px_16px_0px_rgba(31,32,33,0.4)] overflow-hidden -mr-[20px]"
            >
              <img src={avSrc} alt="" className="absolute inset-0 size-full object-cover" />
            </div>
          )
        })}
        {extra > 0 && (
          <div className="relative size-[40px] rounded-[23.226px] border-[1.5px] border-tx-1 bg-tx-2 text-bg-1 flex items-center justify-center font-sans font-bold text-[12px] -mr-[20px]">
            +{extra}
          </div>
        )}
      </div>

      <div
        className={cn(
          'absolute bottom-[16px] right-[16px] rounded-[8px] flex items-center justify-center px-[16px] py-[12px]',
          isParticipant ? 'bg-tx-2 cursor-not-allowed opacity-80' : 'bg-pr-1',
        )}
        onClick={(e) => {
          if (isParticipant) e.stopPropagation()
        }}
        aria-disabled={isParticipant}
      >
        <span
          className={cn(
            'font-sans font-semibold text-[16px]',
            isParticipant ? 'text-tx-3' : 'text-tx-1',
          )}
        >
          {isParticipant ? 'Déjà rejoint' : 'Rejoindre'}
        </span>
      </div>
    </button>
  )
}
