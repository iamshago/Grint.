// Types de domaine — correspondance avec les tables Supabase

export interface Exercise {
  id: string
  name: string
  video_url: string | null
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  sets: number
  reps: number
  rest_seconds: number
  order_index: number
  exercise: Exercise
}

export interface Workout {
  id: string
  title: string
  duration_min: number
  difficulty: string
  image_url: string | null
  detail_image_url: string | null
  workout_exercises?: WorkoutExercise[]
}

/** Source d'une séance : catalogue (`workouts`) ou perso (`user_workouts`). */
export type WorkoutSource = 'catalog' | 'user'

export interface WorkoutPlan {
  user_id: string
  day_of_week: number
  workout_id: string | null
  source: WorkoutSource
  user_workout_id: string | null
  workout?: Workout
}

export interface CompletedWorkout {
  id: string
  user_id: string
  workout_id: string | null
  duration_min: number
  calories: number
  completed_at: string
  source: WorkoutSource
  user_workout_id: string | null
  /** Catégorie dénormalisée — alimente le streak indépendamment de la source. */
  category: WorkoutCategory | null
}

// --- Mon programme (programmes & séances persos) ---

/** Catégorie d'une séance — pilote le streak et l'accent couleur. */
export type WorkoutCategory = 'upper' | 'lower' | 'bbl'

/** Type de slot guide d'une séance perso. NULL = exercice libre. */
export type SlotType = 'contraction' | 'stretch' | 'unilateral' | 'isolation'

/** Ordre des 4 slots guides affichés dans l'éditeur de séance. */
export const SLOT_ORDER: SlotType[] = ['contraction', 'stretch', 'unilateral', 'isolation']

/** Libellés FR des slots guides (purement indicatifs). */
export const SLOT_LABELS: Record<SlotType, string> = {
  contraction: 'Tension de contraction',
  stretch: "Tension d'étirement",
  unilateral: 'Unilatéral',
  isolation: 'Isolation',
}

export interface UserProgram {
  id: string
  user_id: string
  name: string
  focus: string | null
  /** Image de couverture (choisie dans la galerie de presets). */
  image_url: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  /** Séances rattachées (jointure optionnelle). */
  user_workouts?: UserWorkout[]
}

export interface UserWorkout {
  id: string
  /** @deprecated Obsolète : l'appartenance à un programme passe par user_program_workouts. */
  user_program_id?: string | null
  user_id: string
  name: string
  category: WorkoutCategory
  order_index: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  /** Exercices de la séance (jointure optionnelle). */
  user_workout_exercises?: UserWorkoutExercise[]
}

export interface UserWorkoutExercise {
  id: string
  user_workout_id: string
  exercise_id: string
  sets: number
  reps: string
  rest_seconds: number
  slot_type: SlotType | null
  order_index: number
  exercise?: Exercise
}

/** Programme du catalogue (`/programs`) — table `public.programs`. */
export interface Program {
  id: string
  title: string
  difficulty: string
  frequency: string
  description: string
  image_url: string | null
  focus: string[]
  keywords: string[]
  display_order: number
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  exercise_id: string
  weight_used: number
  reps_done: number
  notes?: string
  created_at: string
  exercise?: Exercise
}

// --- Communauté V2 ---

export interface Challenge {
  id: string
  name: string
  description: string
  hero_image_url: string | null
  cover_image_url: string | null
  starts_at: string
  ends_at: string
  sessions_per_week_per_member: number
  is_active: boolean
}

export interface ProfileSummary {
  id: string
  display_name: string | null
  avatar_id: string | null
  /** URL de la photo personnalisée (uploadée ou OAuth) — fallback si avatar_id est null */
  avatar_url: string | null
  username: string | null
}

export interface ChallengeParticipant {
  id: string
  challenge_id: string
  user_id: string
  joined_at: string
  profile?: ProfileSummary
}

export type ReactionEmoji = '❤️' | '😂' | '😲' | '🔥'

export const REACTION_EMOJIS: ReactionEmoji[] = ['❤️', '😂', '😲', '🔥']

export interface PostReaction {
  id: string
  post_id: string
  user_id: string
  emoji: ReactionEmoji
  created_at: string
  profile?: ProfileSummary
}

export interface PRPostPayload {
  exercise_id: string
  exercise_name: string
  weight: number
  previous_weight: number | null
}

export interface Post {
  id: string
  user_id: string
  type: 'pr'
  payload: PRPostPayload
  created_at: string
  profile?: ProfileSummary
  reactions?: PostReaction[]
}

/** Détail d'un participant avec ses pts (séances complétées dans la fenêtre du défi) */
export interface ChallengeRanking {
  user_id: string
  joined_at: string
  profile?: ProfileSummary
  pts: number
  sessionsPerWeek: number
}

export interface ChallengeProgress {
  totalCompleted: number
  totalGoal: number
  participantCount: number
  /** Quota hebdo collectif : sessions_per_week_per_member × N (cf. brief community-defi-weekly-bar Option B). */
  weeklyTarget: number
  /** Nombre de séances complétées par tous les participants depuis lundi 00:00 heure locale. */
  weeklyCompleted: number
  /** Vrai si `ends_at` est dans le passé — masque la barre hebdo, fige la totale. */
  isExpired: boolean
  weeksTotal: number
  weeksElapsed: number
  ranking: ChallengeRanking[]
}

// Types UI

export interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}
