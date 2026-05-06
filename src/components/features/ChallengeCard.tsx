import { useNavigate } from 'react-router-dom'
import type { Challenge, ChallengeProgress, ProfileSummary } from '@/types'
import { resolveAvatarSrc } from '@/lib/avatars'
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
 *   - participant     → page Détail (où vivent les barres détaillées hebdo + totale)
 *  Sur cette carte d'aperçu, on n'affiche QU'UNE seule barre (la totale)
 *  pour ne pas surcharger l'aperçu. Le détail vit sur ChallengeDetail.
 */
export default function ChallengeCard({ challenge, isParticipant, progress, participantProfiles = [] }: ChallengeCardProps) {
  const navigate = useNavigate()
  const N = progress?.participantCount ?? 0
  const sessionsPerWeek = challenge.sessions_per_week_per_member
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
      className="relative w-full text-left bg-tx-1 rounded-[12px] shadow-[0px_0px_24px_0px_rgba(31,32,33,0.12)] h-[161px] overflow-hidden active:scale-[0.99] transition-transform"
    >
      {/* Titre */}
      <p className="absolute left-[16px] top-[16px] font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px] whitespace-nowrap">
        {challenge.name}
      </p>

      {/* Date à droite */}
      <div className="absolute right-[16px] top-[16px] flex flex-col items-end gap-[2px]">
        <span className="font-sans text-[12px] text-bg-2 leading-none">Jusqu'au</span>
        <span className="font-sans font-bold text-[16px] text-bg-1 leading-none">
          {formatShortDate(challenge.ends_at)}
        </span>
      </div>

      {/* Sous-titre : "{S} séances par semaine" (par personne — source unique
       *  challenges.sessions_per_week_per_member). */}
      <p className="absolute left-[16px] top-[44px] font-sans text-[12px] text-bg-2 whitespace-nowrap">
        <strong className="font-sans font-bold text-bg-1">{sessionsPerWeek} séances</strong>
        <span> par semaine</span>
      </p>

      {/* Barre de progression */}
      <div className="absolute left-[16px] right-[16px] top-[74px] h-[12px] rounded-[8px] bg-tx-2 overflow-hidden">
        <div
          className="h-full rounded-[8px] bg-pr-1 shadow-[0px_0px_15.5px_5px_rgba(255,255,255,0.2)]"
          style={{ width: ratio > 0 ? `max(16px, ${Math.min(100, ratio * 100)}%)` : '0%' }}
        />
      </div>

      {/* Avatars participants overlap */}
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

      {/* CTA Rejoindre / Déjà rejoint */}
      <div
        className={cn(
          'absolute bottom-[16px] right-[16px] rounded-[8px] flex items-center justify-center px-[16px] py-[12px]',
          isParticipant
            ? 'bg-tx-2 cursor-not-allowed opacity-80'
            : 'bg-pr-1',
        )}
        onClick={(e) => {
          if (isParticipant) e.stopPropagation()
        }}
        aria-disabled={isParticipant}
      >
        <span className={cn('font-sans font-semibold text-[16px]', isParticipant ? 'text-tx-3' : 'text-tx-1')}>
          {isParticipant ? 'Déjà rejoint' : 'Rejoindre'}
        </span>
      </div>
    </button>
  )
}
