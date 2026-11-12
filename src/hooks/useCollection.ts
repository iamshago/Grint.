import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useActiveChallenge } from '@/hooks/useActiveChallenge'
import { useChallengeProgress } from '@/hooks/useChallengeProgress'
import { isSummitChallenge, placeOf, placeParts } from '@/lib/winter'
import {
  MEDAILLES, lireVues, seancesDuDefi, semainesValidees,
  type MedailleCollection, type SeanceCollection,
} from '@/lib/collection'
import type { Challenge } from '@/types'

interface UseCollectionResult {
  medailles: MedailleCollection[]
  /** Défi Winter actif (série du défi), null s'il n'y en a pas */
  defi: Challenge | null
  loading: boolean
}

const pct = (v: number, max: number) => Math.min(100, Math.round((v / Math.max(1, max)) * 100))

/**
 * Les 12 médailles de la Collection pour un utilisateur.
 * Série Winter = les points du défi actif (camp = inscrit, 8, mi-pente 12, 16, sommet 24 ;
 * podium = top 3 à la fin du défi) ; Régularité = les semaines validées (règle de useStreak).
 * Les dates se déduisent des séances. « Nouveau » = gagnée depuis la dernière visite de la
 * Collection (localStorage), ou depuis lundi si elle n'a jamais été ouverte.
 */
export function useCollection(userId: string | null | undefined): UseCollectionResult {
  const { challenge, loading: chLoading } = useActiveChallenge()
  const defi = isSummitChallenge(challenge) ? challenge : null
  const { progress, loading: prLoading, error: prError } = useChallengeProgress(defi?.id ?? null)
  const [seances, setSeances] = useState<SeanceCollection[] | null>(null)
  // Vues lues une fois par utilisateur : la page garde ses « nouveau » le temps de la visite
  const vues = useMemo(() => (userId ? lireVues(userId) : null), [userId])

  useEffect(() => {
    if (!userId) return
    let actif = true
    supabase
      .from('completed_workouts')
      .select('completed_at, category, workouts(category)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: true })
      .then(({ data }) => {
        if (actif) setSeances((data ?? []) as unknown as SeanceCollection[])
      })
    return () => {
      actif = false
    }
  }, [userId])

  const medailles = useMemo<MedailleCollection[]>(() => {
    if (!seances) return []
    const now = new Date()
    const lundi = new Date(now)
    lundi.setHours(0, 0, 0, 0)
    lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7))
    const semaines = semainesValidees(seances, now)

    const summit = defi?.summit_points ?? 24
    const moi = progress?.ranking.find((r) => r.user_id === userId) ?? null
    const pts = moi?.pts ?? 0
    const place = moi && progress && !progress.notStarted ? placeOf(progress.ranking, userId ?? null) : null
    const points = moi && defi
      ? seancesDuDefi(
          seances,
          new Date(Math.max(new Date(defi.starts_at).getTime(), new Date(moi.joined_at).getTime())),
          new Date(Math.min(now.getTime(), new Date(defi.ends_at).getTime())),
        )
      : []

    return MEDAILLES.map((m) => {
      let gagnee = false
      let date: Date | null = null
      let progres = ''
      let barre = 0
      if (m.serie === 'regularite') {
        gagnee = semaines.length >= m.seuil
        date = gagnee ? semaines[m.seuil - 1] : null
        progres = `${semaines.length} / ${m.seuil}`
        barre = pct(semaines.length, m.seuil)
      } else if (m.id === 'camp') {
        gagnee = !!moi
        date = moi ? new Date(moi.joined_at) : null
      } else if (m.id === 'podium') {
        gagnee = !!progress?.isExpired && place !== null && place <= m.seuil
        date = gagnee && defi ? new Date(defi.ends_at) : null
        if (place) progres = placeParts(place).n + placeParts(place).suffix
        // Comme la planche : la barre du podium suit les points vers le sommet
        barre = pct(pts, summit)
      } else {
        const seuil = Math.min(m.seuil, summit)
        gagnee = !!moi && pts >= seuil
        date = gagnee ? points[seuil - 1] ?? null : null
        progres = `${pts} / ${seuil}`
        barre = pct(pts, seuil)
      }
      const nouveau = gagnee && (vues ? !vues.has(m.id) : !!date && date >= lundi)
      return { ...m, gagnee, date, nouveau, progres, pct: barre }
    })
  }, [seances, defi, progress, userId, vues])

  const loading = !userId || chLoading || !seances || (!!defi && (prLoading || (!progress && !prError)))
  return { medailles, defi, loading }
}
