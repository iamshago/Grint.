import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentLocalWeekBounds } from '@/lib/weekBounds'
import { resolveAvatarSrc } from '@/lib/avatars'
import { firstNameOnly } from '@/lib/displayName'
import { isSummitChallenge, sortRace } from '@/lib/winter'
import { SERIE_WINTER, type ModeleMedaille } from '@/components/features/winter/Medaille'
import { useActiveChallenge } from './useActiveChallenge'
import { useChallengeProgress } from './useChallengeProgress'
import { useCurrentUserProfile } from './useCurrentUserProfile'

/** Ce que ta séance vient de faire dans le défi Winter (bloc de B1-Seance-validee). */
export interface WinterSeance {
  nom: string
  summit: number
  ptsAvant: number
  pts: number
  rangAvant: number
  rang: number
  moiAvatar: string
  /** La personne que tu viens de doubler (la plus proche derrière toi maintenant). */
  depasse: { nom: string; avatar: string; rangAvant: number; rang: number } | null
  /** Missions bouclées par cette séance (chacune débloque une médaille). */
  missions: { hautBas: boolean; record: boolean }
  /** Médaille à droite de la jauge : celle que la séance débloque, sinon la prochaine. */
  palier: { modele: ModeleMedaille; seuil: number; nouveau: boolean }
}

interface CategoryRow {
  category: string | null
  completed_at: string
  workouts: { category: string | null } | null
}

/**
 * Calcule le bloc Winter de la séance validée. Null si tu n'es pas dans un défi à sommet,
 * si le défi n'a pas commencé ou si cette séance ne compte pas (avant ton inscription).
 */
export function useWinterSeance(completedAt: string | null): { seance: WinterSeance | null; pret: boolean } {
  const { challenge, isParticipant, loading: chargeDefi } = useActiveChallenge()
  const winter = isSummitChallenge(challenge) && isParticipant
  const { progress, loading: chargeCourse } = useChallengeProgress(winter ? challenge?.id : null)
  const { profile: me, loading: chargeProfil } = useCurrentUserProfile()
  const [missions, setMissions] = useState<{ hautBas: boolean; record: boolean } | null>(null)

  const moi = progress?.ranking.find((r) => r.user_id === me?.id) ?? null
  const debut = challenge && moi ? Math.max(new Date(challenge.starts_at).getTime(), new Date(moi.joined_at).getTime()) : null
  const compte =
    winter && !!progress && !progress.notStarted && !!moi && !!completedAt && debut !== null &&
    new Date(completedAt).getTime() >= debut && moi.pts > 0

  // Missions bouclées par cette séance : vraies maintenant, fausses juste avant
  useEffect(() => {
    if (!compte || !me?.id || !completedAt || debut === null) return
    const semaine = getCurrentLocalWeekBounds(new Date(completedAt))
    const from = new Date(Math.max(new Date(semaine.startISO).getTime(), debut)).toISOString()
    Promise.all([
      supabase.from('completed_workouts').select('category, completed_at, workouts(category)').eq('user_id', me.id).gte('completed_at', from).lte('completed_at', semaine.endISO),
      supabase.from('posts').select('id, created_at').eq('user_id', me.id).eq('type', 'pr').gte('created_at', from).lte('created_at', semaine.endISO),
    ]).then(([{ data: cw }, { data: prs }]) => {
      const t = new Date(completedAt).getTime()
      const cats = (avant: boolean) => {
        let haut = false, bas = false
        for (const r of (cw ?? []) as unknown as CategoryRow[]) {
          if (avant && new Date(r.completed_at).getTime() >= t) continue
          const c = r.category || r.workouts?.category
          if (c === 'upper') haut = true
          if (c === 'lower' || c === 'bbl') bas = true
        }
        return haut && bas
      }
      const records = (prs ?? []) as Array<{ created_at: string }>
      const recordAvant = records.some((p) => new Date(p.created_at).getTime() < t)
      const recordSeance = records.some((p) => new Date(p.created_at).getTime() >= t)
      setMissions({ hautBas: cats(false) && !cats(true), record: recordSeance && !recordAvant })
    })
  }, [compte, me?.id, completedAt, debut])

  // Prêt quand on sait si le bloc s'affiche (pour lancer toute la séquence d'un coup)
  const pret = !chargeDefi && !chargeProfil && (!winter || (!chargeCourse && !!progress && (!compte || missions !== null)))
  if (!compte || !progress || !moi || !challenge || !me || !missions) return { seance: null, pret }

  const summit = challenge.summit_points ?? 24
  const pts = moi.pts
  const ptsAvant = pts - 1
  const course = sortRace(progress.ranking)
  const avant = sortRace(progress.ranking.map((r) => (r.user_id === moi.user_id ? { ...r, pts: ptsAvant, lastPointAt: r.prevPointAt ?? null } : r)))
  const rang = course.findIndex((r) => r.user_id === moi.user_id) + 1
  const rangAvant = avant.findIndex((r) => r.user_id === moi.user_id) + 1
  const derriere = rangAvant > rang ? course[rang] : null
  const franchi = SERIE_WINTER.find((m) => m.seuil > 0 && ptsAvant < Math.min(m.seuil, summit) && pts >= Math.min(m.seuil, summit))
  const prochain = SERIE_WINTER.find((m) => Math.min(m.seuil, summit) > pts) ?? SERIE_WINTER[SERIE_WINTER.length - 1]
  const palier = franchi ?? prochain

  const seance: WinterSeance = {
    nom: challenge.name,
    summit,
    ptsAvant,
    pts,
    rangAvant,
    rang,
    moiAvatar: resolveAvatarSrc(me),
    depasse: derriere
      ? {
          nom: firstNameOnly(derriere.profile?.display_name) || derriere.profile?.username || '—',
          avatar: resolveAvatarSrc(derriere.profile),
          rangAvant: avant.findIndex((r) => r.user_id === derriere.user_id) + 1,
          rang: rang + 1,
        }
      : null,
    missions,
    palier: { modele: palier.modele, seuil: Math.min(palier.seuil, summit), nouveau: !!franchi },
  }
  return { seance, pret }
}
