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
  workout_exercises?: WorkoutExercise[]
}

export interface WorkoutPlan {
  user_id: string
  day_of_week: number
  workout_id: string
  workout?: Workout
}

export interface CompletedWorkout {
  id: string
  user_id: string
  workout_id: string
  duration_min: number
  calories: number
  completed_at: string
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
  weeklyTarget: number
  weeksTotal: number
  weeksElapsed: number
  ranking: ChallengeRanking[]
}

// Types UI

export interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}
