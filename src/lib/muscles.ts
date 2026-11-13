import type { Exercise, WorkoutCategory } from '@/types'

/**
 * Groupes musculaires de Grint : le nom rangé en base (`exercises.muscles`, principal d'abord), les mots
 * qu'on tape pour le trouver, et la moitié du corps qu'il travaille (« tronc » = abdos et lombaires,
 * recommandés en haut comme en bas du corps).
 */
export type Zone = 'haut' | 'bas' | 'tronc'

export const MUSCLES: { nom: string; mots: string[]; zone: Zone }[] = [
  { nom: 'Pectoraux', mots: ['pecs', 'pectoral', 'poitrine'], zone: 'haut' },
  { nom: 'Dos', mots: ['dorsaux', 'grand dorsal', 'lats'], zone: 'haut' },
  { nom: 'Trapèzes', mots: ['trapeze', 'traps'], zone: 'haut' },
  { nom: 'Épaules', mots: ['epaule', 'deltoides', 'deltoide', 'delts'], zone: 'haut' },
  { nom: 'Biceps', mots: [], zone: 'haut' },
  { nom: 'Triceps', mots: [], zone: 'haut' },
  { nom: 'Avant-bras', mots: ['avant bras'], zone: 'haut' },
  { nom: 'Abdos', mots: ['abdominaux', 'abdo', 'sangle abdominale', 'core'], zone: 'tronc' },
  { nom: 'Obliques', mots: ['oblique'], zone: 'tronc' },
  { nom: 'Lombaires', mots: ['lombaire'], zone: 'tronc' },
  { nom: 'Fessiers', mots: ['fesses', 'fessier', 'glutes', 'moyen fessier'], zone: 'bas' },
  { nom: 'Quadriceps', mots: ['quadri', 'quads', 'cuisses'], zone: 'bas' },
  { nom: 'Ischio-jambiers', mots: ['ischios', 'ischio', 'hamstrings'], zone: 'bas' },
  { nom: 'Adducteurs', mots: ['adducteur'], zone: 'bas' },
  { nom: 'Abducteurs', mots: ['abducteur'], zone: 'bas' },
  { nom: 'Mollets', mots: ['mollet'], zone: 'bas' },
]

/** Minuscules, sans accents ni tirets : « Ischio-jambiers » → « ischio jambiers ». */
export const normaliser = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const ZONE_PAR_NOM = new Map(MUSCLES.map((m) => [normaliser(m.nom), m.zone]))

/** Muscles dont le nom ou un des mots commence par ce qu'on a tapé (« quadri » → Quadriceps). */
export function musclesCherches(recherche: string): Set<string> {
  const q = normaliser(recherche)
  const trouves = new Set<string>()
  if (q.length < 3) return trouves
  for (const m of MUSCLES) {
    const termes = [m.nom, ...m.mots].map(normaliser)
    if (termes.some((t) => t.startsWith(q) || t.split(' ').some((mot) => mot.startsWith(q)))) trouves.add(normaliser(m.nom))
  }
  return trouves
}

/** L'exercice travaille-t-il un de ces muscles (principal ou secondaire) ? */
export const travaille = (exercise: Exercise, muscles: Set<string>) =>
  muscles.size > 0 && (exercise.muscles ?? []).some((m) => muscles.has(normaliser(m)))

/** Moitié du corps de l'exercice, d'après son muscle principal ; null si l'exercice n'a pas de muscles. */
export function zoneDe(exercise: Exercise): Zone | null {
  const principal = exercise.muscles?.[0]
  return principal ? ZONE_PAR_NOM.get(normaliser(principal)) ?? null : null
}

/** Recommandé pour une séance de cette catégorie : bonne moitié du corps, ou tronc (les deux). */
export function recommandePour(exercise: Exercise, category: WorkoutCategory): boolean {
  const zone = zoneDe(exercise)
  if (!zone) return false
  if (zone === 'tronc') return true
  return zone === (category === 'upper' ? 'haut' : 'bas')
}
