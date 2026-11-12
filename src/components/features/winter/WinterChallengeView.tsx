import { useEffect, useMemo, useState } from 'react'
import type { Challenge, ChallengeProgress, ProfileSummary } from '@/types'
import type { WeeklyMissions } from '@/hooks/useWeeklyMissions'
import { resolveAvatarSrc } from '@/lib/avatars'
import { firstNameOnly } from '@/lib/displayName'
import { formatLongDate } from '@/lib/formatRelativeTime'
import { SEUIL_FOULE, daysUntil, mondayRanks, readVisit, saveVisit, sortRace } from '@/lib/winter'
import WinterMountainCard from './WinterMountainCard'
import WinterMissions from './WinterMissions'
import WinterRace, { type LigneCourse } from './WinterRace'
import WinterPlaceBar from './WinterPlaceBar'
import Medaille, { SERIE_WINTER } from './Medaille'

interface WinterChallengeViewProps {
  challenge: Challenge
  progress: ChallengeProgress
  me: ProfileSummary | null
  friendIds: Set<string>
  missions: WeeklyMissions
}

const titre = 'font-serif font-bold text-[24px] leading-[32px] tracking-[-0.025em] text-tx-1'
const nomDe = (p?: ProfileSummary) => firstNameOnly(p?.display_name) || p?.username || '—'

/**
 * Page du défi Winter (maquettes C5 / C7) : la montagne, les missions de la semaine, la course
 * et la barre « ta place ». À l'arrivée, tout part de ta dernière visite (de lundi la première
 * fois) puis glisse vers maintenant : ton avatar monte le chemin, ta ligne change de place.
 */
export default function WinterChallengeView({ challenge, progress, me, friendIds, missions }: WinterChallengeViewProps) {
  const summit = challenge.summit_points ?? 24
  const notStarted = progress.notStarted
  const race = useMemo(() => sortRace(progress.ranking), [progress.ranking])
  const rang = useMemo(() => Object.fromEntries(race.map((r, i) => [r.user_id, i + 1])), [race])
  const lundi = useMemo(() => mondayRanks(progress.ranking), [progress.ranking])

  // Dernière visite, lue une seule fois avant d'être remplacée par celle-ci
  const [visite] = useState(() => readVisit(challenge.id))
  const [phase, setPhase] = useState<'avant' | 'maintenant'>('avant')
  useEffect(() => {
    const t = window.setTimeout(() => setPhase('maintenant'), 1200)
    return () => window.clearTimeout(t)
  }, [])

  const moi = race.find((r) => r.user_id === me?.id) ?? null
  const mesPts = moi?.pts ?? 0
  const ptsAvant = visite ? Math.min(visite.pts, mesPts) : mesPts - (moi?.ptsThisWeek ?? 0)

  useEffect(() => {
    if (moi) saveVisit(challenge.id, { ranks: rang, pts: mesPts })
  }, [challenge.id, rang, mesPts, moi])

  // Place de départ de chaque ligne : celle de ta dernière visite (ou de lundi), les nouveaux à leur place
  const avant = visite?.ranks ?? lundi
  const rangAvant = Object.fromEntries(
    [...race]
      .sort((a, b) => (avant[a.user_id] ?? rang[a.user_id] + 0.5) - (avant[b.user_id] ?? rang[b.user_id] + 0.5))
      .map((r, i) => [r.user_id, i + 1]),
  )

  const lignes: LigneCourse[] = race.map((r) => ({
    id: r.user_id,
    nom: nomDe(r.profile),
    avatar: resolveAvatarSrc(r.profile),
    pts: r.pts,
    moi: r.user_id === me?.id,
    rang: rang[r.user_id],
    rangAvant: rangAvant[r.user_id],
    evol: notStarted ? null : (lundi[r.user_id] ?? rang[r.user_id]) - rang[r.user_id],
  }))

  const maintenant = phase === 'maintenant'
  const maPlace = moi ? (maintenant ? rang[moi.user_id] : rangAvant[moi.user_id]) : null
  const ptsAffiches = maintenant ? mesPts : ptsAvant
  const daysToStart = notStarted ? daysUntil(challenge.starts_at) : null
  const topSemaine = race.reduce<(typeof race)[number] | null>((t, r) => ((r.ptsThisWeek ?? 0) > (t?.ptsThisWeek ?? 0) ? r : t), null)
  const devant = moi && rang[moi.user_id] > 1 ? race[rang[moi.user_id] - 2] : null
  const ecart = notStarted
    ? `départ le ${formatLongDate(challenge.starts_at)}`
    : devant
      ? `à ${devant.pts - mesPts} pt${devant.pts - mesPts > 1 ? 's' : ''} de ${nomDe(devant.profile)}`
      : 'en tête'

  return (
    <div className="relative w-full max-w-[402px] mx-auto pb-[112px]">
      <div className="mx-[16px]">
        <WinterMountainCard
          challenge={challenge}
          daysToStart={daysToStart}
          place={maPlace}
          pts={ptsAffiches}
          prevPts={ptsAvant}
          top={topSemaine ? { nom: nomDe(topSemaine.profile), pts: topSemaine.ptsThisWeek ?? 0 } : null}
          inscrits={progress.participantCount}
          moiAvatar={moi && me ? resolveAvatarSrc(me) : null}
          foule={progress.participantCount > SEUIL_FOULE}
          autres={race
            .filter((r) => r.user_id !== me?.id)
            .map((r) => ({
              id: r.user_id,
              nom: nomDe(r.profile),
              avatar: resolveAvatarSrc(r.profile),
              pts: r.pts,
              visage: friendIds.has(r.user_id) || rang[r.user_id] === 1,
              tete: rang[r.user_id] === 1 && r.pts > 0,
            }))}
        />
      </div>

      {moi && (
        <>
          <h2 className={`mx-[16px] mt-[24px] mb-[12px] ${titre}`}>Missions de la semaine</h2>
          <WinterMissions missions={missions} className="mx-[16px]" />
        </>
      )}

      <h2 className={`mx-[16px] mt-[28px] mb-[12px] ${titre}`}>La course</h2>
      <div className="mx-[16px]">
        <WinterRace lignes={lignes} summit={summit} />
      </div>

      {moi && (
        <>
          <div className="mx-[16px] mt-[28px] mb-[12px] flex items-baseline justify-between">
            <h2 className={titre}>À gagner</h2>
          </div>
          <div className="mx-[16px] grid grid-cols-5 gap-[8px]">
            {SERIE_WINTER.map(({ modele, seuil }) => {
              const seuilPts = Math.min(seuil, summit)
              const gagnee = mesPts >= seuilPts
              const nouvelle = gagnee && seuil > 0 && ptsAvant < seuilPts
              return (
                <div key={modele} className="flex justify-center" style={{ opacity: gagnee ? 1 : 0.28, transition: 'opacity .4s' }}>
                  <Medaille modele={modele} etat={gagnee ? 'gagnee' : 'verrouillee'} anim={nouvelle ? 'nouveau' : 'aucune'} taille={62} />
                </div>
              )
            })}
          </div>
        </>
      )}

      {moi && me && (
        <WinterPlaceBar
          avatar={resolveAvatarSrc(me)}
          daysToStart={daysToStart}
          place={maPlace}
          pts={ptsAffiches}
          deltaPlace={maintenant ? rangAvant[moi.user_id] - rang[moi.user_id] : 0}
          gain={maintenant ? mesPts - ptsAvant : 0}
          ecart={ecart}
          onClick={() => document.getElementById('winter-ma-ligne')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        />
      )}
    </div>
  )
}
