/**
 * Collection de médailles (maquettes E1 « Profil · la collection » et E4 « Collection · mix »).
 * 12 médailles : la série du défi Winter (6) et la Régularité (6). Pas de table : tout se déduit
 * des séances (completed_workouts), de l'inscription au défi et des points du défi actif.
 */
import type { ModeleMedaille } from '@/components/features/winter/Medaille'

/** Une médaille = un modèle de Medaille (dessins validés d'E4). */
export type IdMedaille = ModeleMedaille

export interface DefMedaille {
  id: IdMedaille
  serie: 'winter' | 'regularite'
  nom: string
  /** Seuil : points du défi (Winter) ou semaines validées (Régularité). */
  seuil: number
}

export const MEDAILLES: DefMedaille[] = [
  { id: 'camp', serie: 'winter', nom: 'Camp de base', seuil: 0 },
  { id: 'palier8', serie: 'winter', nom: 'Palier 8', seuil: 8 },
  { id: 'mipente', serie: 'winter', nom: 'Mi-pente', seuil: 12 },
  { id: 'palier16', serie: 'winter', nom: 'Palier 16', seuil: 16 },
  { id: 'podium', serie: 'winter', nom: 'Podium', seuil: 3 },
  { id: 'sommet', serie: 'winter', nom: 'Sommet', seuil: 24 },
  { id: 'sem2', serie: 'regularite', nom: '2 semaines', seuil: 2 },
  { id: 'sem4', serie: 'regularite', nom: '4 semaines', seuil: 4 },
  { id: 'sem6', serie: 'regularite', nom: '6 semaines', seuil: 6 },
  { id: 'sem12', serie: 'regularite', nom: '12 semaines', seuil: 12 },
  { id: 'sem26', serie: 'regularite', nom: '26 semaines', seuil: 26 },
  { id: 'sem52', serie: 'regularite', nom: '52 semaines', seuil: 52 },
]

/** Une médaille de la collection, avec son état pour l'utilisateur. */
export interface MedailleCollection extends DefMedaille {
  gagnee: boolean
  /** Date d'obtention (gagnée) */
  date: Date | null
  /** Gagnée depuis ta dernière visite de la Collection (de lundi la première fois) */
  nouveau: boolean
  /** À gagner : « 16 / 24 », « 3e »… */
  progres: string
  /** À gagner : remplissage de la barre (0-100) */
  pct: number
}

/** Ligne de completed_workouts utile à la collection. */
export interface SeanceCollection {
  completed_at: string
  category: string | null
  workouts?: { category: string | null } | null
}

const moisCourt = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
/** « 19 OCT » (comme la date des cartes de séance). */
export const dateCourte = (d: Date) => `${d.getDate()} ${moisCourt(d)}`
/** « 19 OCT 2026 » */
export const dateLongue = (d: Date) => `${dateCourte(d)} ${d.getFullYear()}`

/** Lundi 00:00 (heure locale) de la semaine d'une date. */
function lundiDe(d: Date): Date {
  const m = new Date(d)
  m.setHours(0, 0, 0, 0)
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}

/**
 * Semaines validées (≥ 1 séance haut ET ≥ 1 séance bas/BBL), même règle et même fenêtre que
 * useStreak (semaine en cours + 51 semaines passées), avec la date où chacune a été validée
 * (la séance qui complète la paire), de la plus ancienne à la plus récente.
 */
export function semainesValidees(seances: SeanceCollection[], now: Date = new Date()): Date[] {
  const lundi = lundiDe(now)
  const debut = new Date(lundi)
  debut.setDate(lundi.getDate() - 7 * 51)
  const fin = new Date(lundi)
  fin.setDate(lundi.getDate() + 6)
  fin.setHours(23, 59, 59, 999)
  const parSemaine = new Map<number, { haut: number | null; bas: number | null }>()
  for (const s of seances) {
    const d = new Date(s.completed_at)
    if (d < debut || d > fin) continue
    const cat = s.category || s.workouts?.category || null
    const cle = lundiDe(d).getTime()
    const sem = parSemaine.get(cle) ?? { haut: null, bas: null }
    const t = d.getTime()
    if (cat === 'upper') sem.haut = Math.min(sem.haut ?? t, t)
    if (cat === 'lower' || cat === 'bbl') sem.bas = Math.min(sem.bas ?? t, t)
    parSemaine.set(cle, sem)
  }
  return [...parSemaine.values()]
    .filter((s) => s.haut !== null && s.bas !== null)
    .map((s) => new Date(Math.max(s.haut, s.bas)))
    .sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Séances qui comptent pour le défi (1 séance = 1 pt), mêmes règles que useChallengeProgress :
 * depuis max(départ, inscription) jusqu'à min(maintenant, fin), une par jour (heure locale).
 */
export function seancesDuDefi(seances: SeanceCollection[], depuis: Date, jusqua: Date): Date[] {
  const vus = new Set<string>()
  return seances
    .map((s) => new Date(s.completed_at))
    .filter((d) => d >= depuis && d <= jusqua)
    .sort((a, b) => a.getTime() - b.getTime())
    .filter((d) => {
      const jour = d.toLocaleDateString('fr-CA')
      if (vus.has(jour)) return false
      vus.add(jour)
      return true
    })
}

const cleVue = (userId: string) => `collection-vue:${userId}`

/** Médailles déjà vues dans la Collection (null = jamais ouverte). */
export function lireVues(userId: string): Set<string> | null {
  try {
    const brut = window.localStorage.getItem(cleVue(userId))
    return brut ? new Set(JSON.parse(brut) as string[]) : null
  } catch {
    return null
  }
}

export function enregistrerVues(userId: string, ids: string[]): void {
  try {
    window.localStorage.setItem(cleVue(userId), JSON.stringify(ids))
  } catch {
    // stockage indisponible : les médailles de la semaine resteront « nouvelles »
  }
}
