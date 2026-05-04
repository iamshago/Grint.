import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LightLayout from '@/components/layout/LightLayout'
import ChallengePodium from '@/components/features/ChallengePodium'
import ParticipantRow from '@/components/features/ParticipantRow'
import ChallengeMenuSheet from '@/components/features/ChallengeMenuSheet'
import { useChallengeProgress } from '@/hooks/useChallengeProgress'
import { useChallengeParticipation } from '@/hooks/useChallengeParticipation'

/** Page Détail défi (déjà rejoint) — light mode, podium + classement. */
export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { challenge, progress, loading } = useChallengeProgress(id)
  const { leave } = useChallengeParticipation(id)
  const [menuOpen, setMenuOpen] = useState(false)

  // Redirection si invalide
  useEffect(() => {
    if (!loading && !challenge) {
      navigate('/community', { replace: true })
    }
  }, [loading, challenge, navigate])

  if (!challenge || !progress) {
    return (
      <LightLayout scrollable hideTabBar>
        <div className="pt-[200px] text-center font-sans text-tx-3">Chargement…</div>
      </LightLayout>
    )
  }

  const top3 = progress.ranking.slice(0, 3)
  const total = progress.totalGoal
  const done = progress.totalCompleted
  const ratio = total > 0 ? Math.min(1, done / total) : 0

  const handleLeave = async () => {
    await leave()
    navigate('/community', { replace: true })
  }

  return (
    <LightLayout scrollable hideTabBar className="flex flex-col">
      <div className="relative w-full max-w-[402px] mx-auto pb-[80px]">
        {/* Header — bouton retour, titre, sous-titre, bouton menu (Figma y=72→144) */}
        <div className="relative h-[144px]">
          <button
            type="button"
            aria-label="Retour"
            onClick={() => navigate(-1)}
            className="absolute left-[16px] top-[72px] size-[40px] rounded-[24px] bg-white flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8L10 4" stroke="#1b1d1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Menu défi"
            onClick={() => setMenuOpen(true)}
            className="absolute right-[16px] top-[72px] size-[40px] rounded-[24px] bg-white flex items-center justify-center"
          >
            <span className="flex gap-[3px]">
              <span className="size-[2.5px] rounded-full bg-tx-1" />
              <span className="size-[2.5px] rounded-full bg-tx-1" />
              <span className="size-[2.5px] rounded-full bg-tx-1" />
            </span>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 top-[81px] flex flex-col items-center gap-[1px]">
            <p className="font-serif font-bold text-[20px] text-tx-1 tracking-[-0.6px] leading-normal whitespace-nowrap">
              Défis
            </p>
            <p className="font-sans text-[12px] text-tx-3 text-center whitespace-nowrap">
              <strong className="font-sans font-bold text-tx-3">{progress.weeklyTarget} séances</strong>
              <span> par semaine</span>
            </p>
          </div>
        </div>

        {/* Carte progression noire */}
        <div className="mx-[16px] bg-tx-1 rounded-[24px] px-[24px] py-[16px] flex flex-col gap-[4px]">
          <p className="font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px] leading-normal">
            {challenge.name}
          </p>
          <div className="relative h-[46px]">
            <p className="absolute right-0 top-[8px] font-sans font-bold text-[12px] leading-none">
              <span className="text-pr-1">{done}</span>
              <span className="text-tx-3">/{total}</span>
            </p>
            <div className="absolute left-0 right-0 top-[26px] h-[12px] rounded-[8px] bg-tx-2 overflow-hidden">
              <div
                className="h-full rounded-[8px] bg-pr-1 shadow-[0px_0px_24px_0px_rgba(31,32,33,0.12),0px_0px_15.5px_5px_rgba(255,255,255,0.2)]"
                style={{ width: `${Math.max(4, ratio * 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-tx-1 rounded-[12px] flex gap-[12px] items-center px-[8px] py-[4px]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
              <circle cx="10" cy="10" r="9" stroke="#f1f4fb" strokeWidth="1.5" />
              <circle cx="10" cy="6" r="0.9" fill="#f1f4fb" />
              <rect x="9.1" y="8.5" width="1.8" height="6" rx="0.9" fill="#f1f4fb" />
            </svg>
            <p className="flex-1 font-sans text-[15px] text-bg-1 leading-normal">
              Attention, le nombre à atteindre change selon le nombre de participants au défi !
            </p>
          </div>
        </div>

        {/* Podium */}
        <div className="mx-[16px] mt-[24px]">
          <ChallengePodium top={top3} />
        </div>

        {/* Liste classement */}
        <div className="mx-[16px] mt-[24px] flex flex-col gap-[12px] drop-shadow-[0px_0px_12px_rgba(31,32,33,0.12)]">
          {progress.ranking.map((p, idx) => (
            <ParticipantRow key={p.user_id} rank={idx + 1} participant={p} />
          ))}
          {progress.ranking.length === 0 && (
            <p className="font-sans text-[14px] text-tx-3 text-center py-[24px]">
              Aucun participant pour l'instant.
            </p>
          )}
        </div>
      </div>

      <ChallengeMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} onConfirmLeave={handleLeave} />
    </LightLayout>
  )
}
