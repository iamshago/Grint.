import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Challenge, ChallengeProgress, ChallengeRanking, ProfileSummary } from '@/types'
import type { WeeklyMissions } from '@/hooks/useWeeklyMissions'
import { resolveAvatarSrc } from '@/lib/avatars'
import { firstNameOnly } from '@/lib/displayName'
import { formatLongDate } from '@/lib/formatRelativeTime'
import { SEUIL_FOULE, daysUntil, mondayRanks, readVisit, saveVisit, sortRace } from '@/lib/winter'
import WinterMountainCard from './WinterMountainCard'
import WinterMissions from './WinterMissions'
import WinterRace, { type LigneCourse, type WinterRaceHandle } from './WinterRace'
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
const ecartTexte = (devant: ChallengeRanking | null, pts: number) =>
  devant ? `à ${pts} pt${pts > 1 ? 's' : ''} de ${nomDe(devant.profile)}` : 'en tête'

/** Après le défilement jusqu'à ta ligne, un temps avant que la course glisse (ms). */
const BATTEMENT = 200
/** Glissement d'une ligne fini (transition de 0,8 s après 0,35 s) : la visite s'enregistre là (ms). */
const FIN_COURSE = 1200

/** Défile en douceur jusqu'à `y` ; se résout quand la page est posée. */
function defilerVers(y: number): Promise<void> {
  return new Promise((resolve) => {
    const cible = Math.max(0, Math.min(y, document.documentElement.scrollHeight - window.innerHeight))
    if (Math.abs(cible - window.scrollY) < 2) {
      resolve()
      return
    }
    let calme = 0
    const fin = () => {
      window.removeEventListener('scroll', bouge)
      window.clearTimeout(calme)
      window.clearTimeout(garde)
      resolve()
    }
    const bouge = () => {
      window.clearTimeout(calme)
      calme = window.setTimeout(fin, 140)
    }
    const garde = window.setTimeout(fin, 1600)
    window.addEventListener('scroll', bouge, { passive: true })
    calme = window.setTimeout(fin, 200)
    const doux = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: cible, behavior: doux ? 'smooth' : 'auto' })
  })
}

/**
 * Page du défi Winter (maquettes C5 / C7) : la montagne, les missions de la semaine, la course
 * et la barre « ta place ». À l'arrivée, tout part de ta dernière visite (de lundi la première
 * fois) : ton avatar monte le chemin, tes points changent. Ta place, elle, reste celle d'avant
 * tant que la course ne l'a pas montrée : si elle a bougé, la barre « ta place » appelle le doigt ;
 * la toucher fait descendre jusqu'à ta ligne, puis la course glisse et la barre révèle ta place.
 * La course se joue aussi toute seule si tu descends jusqu'à elle. La visite ne s'enregistre
 * qu'une fois la course jouée.
 */
export default function WinterChallengeView({ challenge, progress, me, friendIds, missions }: WinterChallengeViewProps) {
  const summit = challenge.summit_points ?? 24
  const notStarted = progress.notStarted
  const race = useMemo(() => sortRace(progress.ranking), [progress.ranking])
  const rang = useMemo(() => Object.fromEntries(race.map((r, i) => [r.user_id, i + 1])), [race])
  const lundi = useMemo(() => mondayRanks(progress.ranking), [progress.ranking])

  // Dernière visite, lue une seule fois (elle n'est remplacée qu'une fois la course jouée)
  const [visite] = useState(() => readVisit(challenge.id))
  // Points et montagne : ils changent à l'arrivée, comme avant
  const [phase, setPhase] = useState<'avant' | 'maintenant'>('avant')
  useEffect(() => {
    const t = window.setTimeout(() => setPhase('maintenant'), 1200)
    return () => window.clearTimeout(t)
  }, [])

  const moi = race.find((r) => r.user_id === me?.id) ?? null
  const mesPts = moi?.pts ?? 0
  const ptsAvant = visite ? Math.min(visite.pts, mesPts) : mesPts - (moi?.ptsThisWeek ?? 0)

  // Place de départ de chaque ligne : celle de ta dernière visite (ou de lundi), les nouveaux à leur place
  const avant = visite?.ranks ?? lundi
  const rangAvant: Record<string, number> = Object.fromEntries(
    [...race]
      .sort((a, b) => (avant[a.user_id] ?? rang[a.user_id] + 0.5) - (avant[b.user_id] ?? rang[b.user_id] + 0.5))
      .map((r, i) => [r.user_id, i + 1]),
  )
  const maPlaceAvant = moi ? rangAvant[moi.user_id] : 0
  const maPlaceMaint = moi ? rang[moi.user_id] : 0
  /** Ta place a bougé depuis ta dernière visite (de lundi la première fois). */
  const sens: 'monte' | 'descend' | null =
    !moi || notStarted || maPlaceAvant === maPlaceMaint ? null : maPlaceAvant > maPlaceMaint ? 'monte' : 'descend'

  // --- La course : jouée toute seule quand elle arrive à l'écran, ou après le défilement si tu touches « ta place »
  const course = useRef<WinterRaceHandle>(null)
  const barre = useRef<HTMLButtonElement>(null)
  const [jouee, setJouee] = useState(false)
  const [touchee, setTouchee] = useState(false)
  const joueeRef = useRef(false)
  const guidage = useRef(false)
  const auto = useRef(0)
  const battement = useRef(0)
  useEffect(
    () => () => {
      window.clearTimeout(auto.current)
      window.clearTimeout(battement.current)
    },
    [],
  )
  const jouer = useCallback(() => {
    if (joueeRef.current) return
    joueeRef.current = true
    setJouee(true)
  }, [])
  const onVue = useCallback(() => {
    if (guidage.current || joueeRef.current) return
    auto.current = window.setTimeout(jouer, 1000)
  }, [jouer])

  /** Défile jusqu'à ta ligne : sa place d'avant et sa place d'arrivée entre l'entête et la barre du bas. */
  const allerAMaLigne = async () => {
    const l = course.current?.maLigne()
    if (!l) return
    const haut = (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) + 12
    const bas = (barre.current?.getBoundingClientRect().top ?? window.innerHeight) - 12
    const zone = bas - haut
    const etendue = l.bas - l.haut
    // tout tient : centré ; sinon on garde la place d'arrivée à l'écran
    const y = etendue <= zone ? l.haut - haut - (zone - etendue) / 2 : l.monte ? l.haut - haut : l.bas - bas
    await defilerVers(y)
  }

  const toucherCarte = async () => {
    if (guidage.current) return
    if (joueeRef.current) {
      void allerAMaLigne()
      return
    }
    guidage.current = true
    setTouchee(true)
    window.clearTimeout(auto.current)
    await allerAMaLigne()
    battement.current = window.setTimeout(() => {
      guidage.current = false
      jouer()
    }, BATTEMENT)
  }

  // La dernière place vue ne s'enregistre qu'une fois la course jouée
  useEffect(() => {
    if (!jouee || !moi) return
    const t = window.setTimeout(
      () => saveVisit(challenge.id, { ranks: rang, pts: mesPts, ptsDe: Object.fromEntries(race.map((r) => [r.user_id, r.pts])) }),
      FIN_COURSE,
    )
    return () => window.clearTimeout(t)
  }, [jouee, moi, challenge.id, rang, mesPts, race])

  const lignes: LigneCourse[] = race.map((r) => ({
    id: r.user_id,
    nom: nomDe(r.profile),
    avatar: resolveAvatarSrc(r.profile),
    pts: r.pts,
    moi: r.user_id === me?.id,
    rang: rang[r.user_id],
    rangAvant: rangAvant[r.user_id],
    // Toutes les flèches comptent depuis ta dernière visite (choix de Florian, 13/11) ; rien si la place n'a pas bougé
    evol: notStarted ? null : rangAvant[r.user_id] - rang[r.user_id] || null,
  }))

  const maintenant = phase === 'maintenant'
  // Ta place : celle d'avant tant que la course ne l'a pas montrée
  const maPlace = moi ? (jouee ? maPlaceMaint : maPlaceAvant) : null
  const ptsAffiches = maintenant ? mesPts : ptsAvant
  const daysToStart = notStarted ? daysUntil(challenge.starts_at) : null
  const topSemaine = race.reduce<(typeof race)[number] | null>((t, r) => ((r.ptsThisWeek ?? 0) > (t?.ptsThisWeek ?? 0) ? r : t), null)
  const devant = moi && maPlaceMaint > 1 ? race[maPlaceMaint - 2] : null
  // Avant la révélation, l'écart est celui de ta dernière visite (points de chacun à ce moment-là)
  const ptsVisiteDe = (r: ChallengeRanking) =>
    r.user_id === moi?.user_id ? ptsAvant : visite ? (visite.ptsDe?.[r.user_id] ?? r.pts) : r.pts - (r.ptsThisWeek ?? 0)
  const devantAvant = moi && maPlaceAvant > 1 ? (race.find((r) => rangAvant[r.user_id] === maPlaceAvant - 1) ?? null) : null
  const ecart = notStarted
    ? `départ le ${formatLongDate(challenge.starts_at)}`
    : sens && !jouee
      ? ecartTexte(devantAvant, devantAvant ? Math.max(0, ptsVisiteDe(devantAvant) - ptsAvant) : 0)
      : ecartTexte(devant, devant ? devant.pts - mesPts : 0)

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
        <WinterRace ref={course} lignes={lignes} summit={summit} jouee={jouee} descend={sens === 'descend'} onVue={onVue} />
      </div>

      {moi && (
        <>
          <div className="mx-[16px] mt-[28px] mb-[12px] flex items-baseline justify-between">
            <h2 className={titre}>À gagner</h2>
            <Link to="/profile/collection" style={{ fontSize: 14, fontWeight: 600, color: '#1b1d1f', textDecoration: 'underline' }}>Collection</Link>
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
          deltaPlace={jouee ? maPlaceAvant - maPlaceMaint : 0}
          gain={maintenant ? mesPts - ptsAvant : 0}
          ecart={ecart}
          appel={sens && !jouee && !touchee ? sens : null}
          fete={jouee && sens === 'monte'}
          onClick={toucherCarte}
          ref={barre}
        />
      )}
    </div>
  )
}
