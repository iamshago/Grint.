import type { ChallengeRanking } from '@/types'
import { getAvatarById } from '@/lib/avatars'

interface ParticipantRowProps {
  rank: number
  participant: ChallengeRanking
}

/** Une ligne du classement défi : avatar + badge rang + nom + séances/sem + pts. */
export default function ParticipantRow({ rank, participant }: ParticipantRowProps) {
  const avatar = getAvatarById(participant.profile?.avatar_id || 'superman')
  const name = participant.profile?.display_name || participant.profile?.username || '—'
  const sessionsPerWeek = participant.sessionsPerWeek.toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return (
    <div className="bg-white h-[72px] relative rounded-[12px] w-full">
      {/* Avatar */}
      <div className="absolute left-[12px] top-[12px] size-[48px] rounded-full bg-white overflow-hidden">
        {avatar && <img src={avatar.src} alt="" className="size-full object-cover" />}
      </div>

      {/* Badge rang en bas-gauche de l'avatar */}
      <div className="absolute bottom-[12px] left-[40px] bg-pr-1 border-[0.8px] border-white rounded-[8px] px-[8px] py-[4px] flex items-center justify-center">
        <span className="font-sans font-semibold text-[8px] text-tx-1">{rank}</span>
      </div>

      {/* Nom */}
      <p className="absolute left-[72px] top-[14px] font-serif font-bold text-[20px] text-tx-1 whitespace-nowrap">
        {name}
      </p>

      {/* Sous-ligne séances/sem */}
      <div className="absolute left-[72px] top-[44px] flex gap-[2px] items-center">
        <span className="font-sans font-semibold text-[12px] text-tx-1">{sessionsPerWeek}</span>
        <span className="font-sans text-[12px] text-tx-3">séances par semaine</span>
      </div>

      {/* Badge pts à droite */}
      <div className="absolute bottom-[15px] right-[15px] bg-pr-1 rounded-[8px] flex items-center justify-center px-[16px] py-[12px]">
        <span className="font-sans font-semibold text-[16px] text-tx-1 leading-none text-center whitespace-nowrap">
          {participant.pts} pts
        </span>
      </div>
    </div>
  )
}
