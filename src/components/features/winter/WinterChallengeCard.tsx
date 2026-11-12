import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Challenge, ChallengeProgress, ProfileSummary } from '@/types'
import { resolveAvatarSrc } from '@/lib/avatars'
import { formatShortDate } from '@/lib/formatRelativeTime'
import { cn } from '@/lib/utils'
import { challengeWeeks, daysUntil, imageDeJour, placeOf } from '@/lib/winter'
import WinterSnow from './WinterSnow'
import FondJourNuit from './FondJourNuit'
import WinterJoinRow from './WinterJoinRow'
import WinterCardStats from './WinterCardStats'

interface WinterChallengeCardProps {
  challenge: Challenge
  isParticipant: boolean
  progress: ChallengeProgress | null
  me: ProfileSummary | null
  missionsDone: number
  missionsTotal: number
  /** Inscription (insert en base) ; la carte joue l'animation pendant ce temps. */
  onJoin: () => Promise<void>
}

const OVERLAY =
  'linear-gradient(0deg, rgba(13,16,36,.78) 0%, rgba(13,16,36,0) 52%), linear-gradient(90deg, rgba(13,16,36,.82) 0%, rgba(13,16,36,.5) 42%, rgba(13,16,36,0) 72%)'
/** Le même voile en plein jour : même forme, bleu de jour au lieu du bleu nuit (texte blanc lisible
 *  sur le ciel clair), plus un léger dégradé en haut pour la date. */
const OVERLAY_JOUR =
  'linear-gradient(0deg, rgba(24,48,112,.74) 0%, rgba(24,48,112,0) 56%), linear-gradient(90deg, rgba(24,48,112,.72) 0%, rgba(24,48,112,.4) 42%, rgba(24,48,112,0) 72%), linear-gradient(180deg, rgba(24,48,112,.3) 0%, rgba(24,48,112,0) 40%)'

/**
 * Carte du défi Winter sur /community (maquettes G-CarteDefiWinter, D1 → D2).
 * Avant inscription : pile d'avatars + « Rejoindre », qui inscrit directement depuis la carte.
 * Au toucher : « Inscrit », ton avatar entre dans la pile, puis ta place, tes points et tes missions.
 * Toucher la carte : page Rejoindre si tu n'es pas inscrit, page du défi sinon.
 */
export default function WinterChallengeCard({
  challenge, isParticipant, progress, me, missionsDone, missionsTotal, onJoin,
}: WinterChallengeCardProps) {
  const navigate = useNavigate()
  const [joinedHere, setJoinedHere] = useState(false)
  const [justJoined, setJustJoined] = useState(false)
  const joined = isParticipant || joinedHere

  // Fin de l'animation d'inscription (dernier mouvement à 2,75 s)
  useEffect(() => {
    if (!justJoined) return
    const t = window.setTimeout(() => setJustJoined(false), 2800)
    return () => window.clearTimeout(t)
  }, [justJoined])

  const notStarted = new Date(challenge.starts_at).getTime() > Date.now()
  const ranking = progress?.ranking ?? []
  const others = ranking.filter((r) => r.user_id !== me?.id)
  const summit = challenge.summit_points ?? 0
  const myPts = ranking.find((r) => r.user_id === me?.id)?.pts ?? 0
  const cover = challenge.cover_image_url
  const coverJour = cover ? imageDeJour(cover) : null

  const handleJoin = async () => {
    setJoinedHere(true)
    setJustJoined(true)
    try {
      await onJoin()
    } catch {
      setJoinedHere(false)
      setJustJoined(false)
    }
  }

  const goToTarget = () => {
    navigate(joined ? `/community/challenges/${challenge.id}` : `/community/challenges/${challenge.id}/join`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToTarget}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') goToTarget()
      }}
      aria-label={`Défi ${challenge.name}`}
      className={cn(
        'relative w-full h-[161px] rounded-[12px] bg-[#0d1024] shadow-[0px_0px_24px_0px_rgba(31,32,33,0.12)] overflow-hidden text-left cursor-pointer',
        justJoined && 'winter-fete',
      )}
    >
      {cover && coverJour ? (
        // Easter egg : la carte suit l'heure, comme la montagne de la page défi
        <FondJourNuit jour={coverJour} nuit={cover} voile={{ jour: OVERLAY_JOUR, nuit: OVERLAY }}>
          <WinterSnow fall={175} />
        </FondJourNuit>
      ) : (
        <>
          {cover && <img src={cover} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />}
          <WinterSnow fall={175} />
          <div aria-hidden="true" className="absolute inset-0" style={{ background: OVERLAY }} />
        </>
      )}

      <p className="absolute left-[16px] top-[16px] font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px] leading-[1.5] whitespace-nowrap">
        {challenge.name}
      </p>
      <div className="absolute right-[16px] top-[16px] flex flex-col items-end gap-[2px]">
        <span className="font-sans text-[12px] text-bg-2 leading-none">{notStarted ? 'Dès le' : "Jusqu'au"}</span>
        <span className="font-sans font-bold text-[16px] text-bg-1 leading-none">
          {formatShortDate(notStarted ? challenge.starts_at : challenge.ends_at)}
        </span>
      </div>
      <p className="absolute left-[16px] top-[44px] font-sans text-[12px] text-bg-2 leading-[1.5] whitespace-nowrap">
        <strong className="font-bold text-bg-1">Chacun pour soi</strong>
        <span> · {challengeWeeks(challenge)} semaines</span>
      </p>

      {(!joined || justJoined) && (
        <WinterJoinRow
          others={others.slice(0, 3).map((r) => resolveAvatarSrc(r.profile))}
          extra={Math.max(0, others.length - 3)}
          meAvatar={me ? resolveAvatarSrc(me) : null}
          joined={joined}
          justJoined={justJoined}
          onJoin={handleJoin}
          className={justJoined ? 'winter-part' : undefined}
        />
      )}
      {joined && (
        <WinterCardStats
          place={placeOf(ranking, me?.id ?? null)}
          daysToStart={notStarted ? daysUntil(challenge.starts_at) : null}
          pts={myPts}
          summit={summit}
          missionsDone={missionsDone}
          missionsTotal={missionsTotal}
          className={justJoined ? 'winter-suivi' : undefined}
        />
      )}
    </div>
  )
}
