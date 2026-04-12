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

// Types UI

export interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}
