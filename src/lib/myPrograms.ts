import { supabase } from './supabaseClient'
import type {
  Exercise,
  SlotType,
  UserProgram,
  UserWorkout,
  WorkoutCategory,
} from '@/types'

/**
 * Couche d'accès aux données « Mon programme » (programmes & séances persos).
 * RLS garantit qu'un utilisateur ne touche que ses propres lignes.
 */

function sortActiveWorkouts(rows: UserWorkout[] | undefined): UserWorkout[] {
  return (rows ?? [])
    .filter((w) => !w.is_deleted)
    .sort((a, b) => a.order_index - b.order_index)
}

/** Liste des programmes persos d'un user, séances actives jointes (pour le compte). */
export async function fetchUserPrograms(userId: string): Promise<UserProgram[]> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*, user_workouts(id, name, category, order_index, is_deleted)')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as UserProgram[]).map((p) => ({
    ...p,
    user_workouts: sortActiveWorkouts(p.user_workouts),
  }))
}

/** Un programme perso avec ses séances actives (+ nb d'exos par séance). */
export async function fetchUserProgram(programId: string): Promise<UserProgram | null> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*, user_workouts(*, user_workout_exercises(id))')
    .eq('id', programId)
    .eq('is_deleted', false)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const program = data as UserProgram
  return { ...program, user_workouts: sortActiveWorkouts(program.user_workouts) }
}

export async function createUserProgram(
  userId: string,
  name: string,
  focus: string | null,
): Promise<UserProgram> {
  const { data, error } = await supabase
    .from('user_programs')
    .insert({ user_id: userId, name, focus })
    .select('*')
    .single()
  if (error) throw error
  return data as UserProgram
}

export async function updateUserProgram(
  id: string,
  fields: { name?: string; focus?: string | null },
): Promise<void> {
  const { error } = await supabase.from('user_programs').update(fields).eq('id', id)
  if (error) throw error
}

export async function softDeleteUserProgram(id: string): Promise<void> {
  const { error } = await supabase.from('user_programs').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}

/** Une séance perso avec ses exos (jointure exercise), triés par order_index. */
export async function fetchUserWorkout(workoutId: string): Promise<UserWorkout | null> {
  const { data, error } = await supabase
    .from('user_workouts')
    .select('*, user_workout_exercises(*, exercise:exercises(*))')
    .eq('id', workoutId)
    .eq('is_deleted', false)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const workout = data as UserWorkout
  workout.user_workout_exercises = (workout.user_workout_exercises ?? []).sort(
    (a, b) => a.order_index - b.order_index,
  )
  return workout
}

export async function createUserWorkout(input: {
  user_program_id: string
  user_id: string
  name: string
  category: WorkoutCategory
  order_index: number
}): Promise<UserWorkout> {
  const { data, error } = await supabase.from('user_workouts').insert(input).select('*').single()
  if (error) throw error
  return data as UserWorkout
}

export async function updateUserWorkout(
  id: string,
  fields: { name?: string; category?: WorkoutCategory },
): Promise<void> {
  const { error } = await supabase.from('user_workouts').update(fields).eq('id', id)
  if (error) throw error
}

export async function softDeleteUserWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('user_workouts').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}

/** Réordonne des lignes en réécrivant leur order_index (drag & drop). */
export async function reorderUserWorkouts(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('user_workouts').update({ order_index: index }).eq('id', id),
    ),
  )
  const firstError = results.find((r) => r.error)?.error
  if (firstError) throw firstError
}

/** Exercice en cours d'édition dans une séance (avant persistance). */
export interface DraftExercise {
  /** Clé locale stable (React key + drag) — indépendante de exercise_id. */
  uid: string
  /** id de la ligne user_workout_exercises (présent si déjà persisté). */
  id?: string
  exercise_id: string
  exercise?: Exercise
  sets: number
  reps: string
  rest_seconds: number
  slot_type: SlotType | null
  order_index: number
}

/**
 * Remplace l'intégralité des exercices d'une séance via le RPC atomique
 * `replace_user_workout_exercises` (DELETE + INSERT dans une seule transaction
 * Postgres) — évite toute séance vidée si le réseau coupe en cours d'opération.
 */
export async function replaceWorkoutExercises(
  workoutId: string,
  exos: DraftExercise[],
): Promise<void> {
  const payload = exos.map((e, index) => ({
    exercise_id: e.exercise_id,
    sets: e.sets,
    reps: e.reps,
    rest_seconds: e.rest_seconds,
    slot_type: e.slot_type,
    order_index: index,
  }))
  const { error } = await supabase.rpc('replace_user_workout_exercises', {
    p_workout_id: workoutId,
    p_exercises: payload,
  })
  if (error) throw error
}

/** Catalogue d'exercices (lecture seule) pour la modale de sélection. */
export async function fetchExerciseCatalog(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, video_url')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Exercise[]
}
