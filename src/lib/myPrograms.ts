import { supabase } from './supabaseClient'
import type {
  Exercise,
  ImageLibraryCategory,
  SlotType,
  UserProgram,
  UserWorkout,
  WorkoutCategory,
  WorkoutImage,
} from '@/types'

/**
 * Image de secours par catégorie quand l'utilisateur n'a pas choisi de visuel.
 * Temporaire : Pestakle fournira des `generic` dans workout_image_library.
 */
export const CATEGORY_FALLBACK_IMAGE: Record<WorkoutCategory, string> = {
  upper: '/assets/workouts/upper-body-h.png',
  lower: '/assets/workouts/leg-day.png',
  bbl: '/assets/workouts/bbl-day.png',
}

/**
 * Couche d'accès aux données « Mon programme » (programmes & séances persos).
 * RLS garantit qu'un utilisateur ne touche que ses propres lignes.
 *
 * L'appartenance d'une séance à un programme est portée par la table de liaison
 * `user_program_workouts` : un item de programme référence soit une séance du
 * CATALOGUE (`workouts`), soit une séance PERSO (`user_workouts`), par lien (pas
 * de copie). Une séance perso est donc réutilisable dans plusieurs programmes.
 */

/** Un item (séance) d'un programme, résolu depuis la table de liaison. */
export interface ProgramItem {
  /** id de la ligne user_program_workouts (clé du lien, pour réordonner/retirer). */
  linkId: string
  source: 'catalog' | 'user'
  orderIndex: number
  /** id de la séance référencée (workout.id ou user_workout.id). */
  refId: string
  name: string
  category: WorkoutCategory
  imageUrl: string | null
  exerciseCount: number
  /** true si la séance est modifiable depuis le programme (perso uniquement). */
  editable: boolean
}

/** Séance proposée dans le sélecteur « ajouter une séance existante ». */
export interface SelectableWorkout {
  source: 'catalog' | 'user'
  id: string
  name: string
  category: WorkoutCategory
  exerciseCount: number
}

/** Liste des programmes persos d'un user, avec les catégories de leurs séances (pour le compte + pastilles). */
export async function fetchUserPrograms(
  userId: string,
): Promise<(UserProgram & { categories: WorkoutCategory[] })[]> {
  const { data, error } = await supabase
    .from('user_programs')
    .select(
      '*, user_program_workouts(source, workout:workouts(category), user_workout:user_workouts(category, is_deleted))',
    )
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as any[]).map((p) => {
    const categories: WorkoutCategory[] = (p.user_program_workouts ?? [])
      .map((l: any) => {
        if (l.source === 'catalog') return l.workout?.category ?? null
        if (l.user_workout && !l.user_workout.is_deleted) return l.user_workout.category
        return null
      })
      .filter(Boolean)
    const { user_program_workouts, ...rest } = p
    return { ...(rest as UserProgram), categories }
  })
}

/** Items (séances liées) d'un programme, résolus et ordonnés. Ignore les séances perso supprimées. */
export async function fetchProgramItems(programId: string): Promise<ProgramItem[]> {
  const { data, error } = await supabase
    .from('user_program_workouts')
    .select(
      'id, source, order_index, workout_id, user_workout_id, ' +
        'workout:workouts(id, title, category, image_url, workout_exercises(id)), ' +
        'user_workout:user_workouts(id, name, category, is_deleted, user_workout_exercises(id))',
    )
    .eq('user_program_id', programId)
    .order('order_index', { ascending: true })
  if (error) throw error
  const items: ProgramItem[] = []
  for (const row of (data ?? []) as any[]) {
    if (row.source === 'catalog') {
      const w = row.workout
      if (!w) continue
      items.push({
        linkId: row.id,
        source: 'catalog',
        orderIndex: row.order_index,
        refId: w.id,
        name: w.title,
        category: (w.category as WorkoutCategory) ?? 'upper',
        imageUrl: w.image_url ?? null,
        exerciseCount: w.workout_exercises?.length ?? 0,
        editable: false,
      })
    } else {
      const uw = row.user_workout
      if (!uw || uw.is_deleted) continue
      items.push({
        linkId: row.id,
        source: 'user',
        orderIndex: row.order_index,
        refId: uw.id,
        name: uw.name,
        category: uw.category as WorkoutCategory,
        imageUrl: null,
        exerciseCount: uw.user_workout_exercises?.length ?? 0,
        editable: true,
      })
    }
  }
  return items
}

/** Un programme perso (méta) + ses items (séances liées, ordonnées). */
export async function fetchUserProgram(
  programId: string,
): Promise<(UserProgram & { items: ProgramItem[] }) | null> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*')
    .eq('id', programId)
    .eq('is_deleted', false)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const items = await fetchProgramItems(programId)
  return { ...(data as UserProgram), items }
}

export async function createUserProgram(
  userId: string,
  name: string,
  focus: string | null,
  imageUrl: string | null = null,
): Promise<UserProgram> {
  const { data, error } = await supabase
    .from('user_programs')
    .insert({ user_id: userId, name, focus, image_url: imageUrl })
    .select('*')
    .single()
  if (error) throw error
  return data as UserProgram
}

export async function updateUserProgram(
  id: string,
  fields: { name?: string; focus?: string | null; image_url?: string | null },
): Promise<void> {
  const { error } = await supabase.from('user_programs').update(fields).eq('id', id)
  if (error) throw error
}

export async function softDeleteUserProgram(id: string): Promise<void> {
  const { error } = await supabase.from('user_programs').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}

/**
 * Galerie d'images proposées pour la couverture d'un programme perso : on
 * réutilise les visuels du catalogue (`programs` puis `workouts`) — aucun upload,
 * style cohérent avec les cartes du carrousel. Dédupliqué, ordre catalogue.
 */
export async function fetchProgramImagePresets(): Promise<string[]> {
  const [programsRes, workoutsRes] = await Promise.all([
    supabase
      .from('programs')
      .select('image_url, display_order')
      .not('image_url', 'is', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('workouts')
      .select('image_url')
      .eq('is_deleted', false)
      .not('image_url', 'is', null),
  ])
  const urls: string[] = []
  for (const row of programsRes.data ?? []) if (row.image_url) urls.push(row.image_url)
  for (const row of workoutsRes.data ?? []) if (row.image_url) urls.push(row.image_url)
  return Array.from(new Set(urls))
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
  user_id: string
  name: string
  category: WorkoutCategory
  image_url?: string | null
}): Promise<UserWorkout> {
  const { data, error } = await supabase.from('user_workouts').insert(input).select('*').single()
  if (error) throw error
  return data as UserWorkout
}

export async function updateUserWorkout(
  id: string,
  fields: { name?: string; category?: WorkoutCategory; image_url?: string | null },
): Promise<void> {
  const { error } = await supabase.from('user_workouts').update(fields).eq('id', id)
  if (error) throw error
}

/**
 * Galerie d'images partagée (`workout_image_library`) pour la couverture d'une
 * séance perso. Filtrée par catégorie ; `generic` sert de repli passe-partout.
 * Retourne les images de la catégorie demandée, complétées par les `generic`.
 */
export async function fetchWorkoutImages(
  category?: ImageLibraryCategory,
): Promise<WorkoutImage[]> {
  const { data, error } = await supabase
    .from('workout_image_library')
    .select('id, image_url, category, label, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  const all = (data ?? []) as WorkoutImage[]
  if (!category || category === 'generic') {
    return all.filter((img) => img.category === (category ?? 'generic') || img.category === 'generic')
  }
  // Catégorie précise d'abord, puis generic en complément.
  return [
    ...all.filter((img) => img.category === category),
    ...all.filter((img) => img.category === 'generic'),
  ]
}

export async function softDeleteUserWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('user_workouts').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}

/** Ajoute une séance (catalogue ou perso) à un programme, en fin de liste. */
export async function addProgramItem(
  programId: string,
  ref: { source: 'catalog' | 'user'; refId: string },
): Promise<void> {
  const { count } = await supabase
    .from('user_program_workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_program_id', programId)
  const row =
    ref.source === 'catalog'
      ? { user_program_id: programId, source: 'catalog', workout_id: ref.refId, user_workout_id: null, order_index: count ?? 0 }
      : { user_program_id: programId, source: 'user', user_workout_id: ref.refId, workout_id: null, order_index: count ?? 0 }
  const { error } = await supabase.from('user_program_workouts').insert(row)
  if (error) throw error
}

/** Retire une séance d'un programme (supprime le lien, pas la séance). */
export async function removeProgramItem(linkId: string): Promise<void> {
  const { error } = await supabase.from('user_program_workouts').delete().eq('id', linkId)
  if (error) throw error
}

/** Réordonne les items d'un programme en réécrivant order_index (drag & drop). */
export async function reorderProgramItems(orderedLinkIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedLinkIds.map((id, index) =>
      supabase.from('user_program_workouts').update({ order_index: index }).eq('id', id),
    ),
  )
  const firstError = results.find((r) => r.error)?.error
  if (firstError) throw firstError
}

/** Séances proposées à la liaison : catalogue + séances perso de l'utilisateur. */
export async function fetchSelectableWorkouts(
  userId: string,
): Promise<{ catalog: SelectableWorkout[]; mine: SelectableWorkout[] }> {
  const [catRes, mineRes] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, title, category, workout_exercises(id)')
      .eq('is_deleted', false)
      .order('title', { ascending: true }),
    supabase
      .from('user_workouts')
      .select('id, name, category, user_workout_exercises(id)')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('name', { ascending: true }),
  ])
  if (catRes.error) throw catRes.error
  if (mineRes.error) throw mineRes.error
  return {
    catalog: (catRes.data ?? []).map((w: any) => ({
      source: 'catalog',
      id: w.id,
      name: w.title,
      category: (w.category as WorkoutCategory) ?? 'upper',
      exerciseCount: w.workout_exercises?.length ?? 0,
    })),
    mine: (mineRes.data ?? []).map((w: any) => ({
      source: 'user',
      id: w.id,
      name: w.name,
      category: w.category as WorkoutCategory,
      exerciseCount: w.user_workout_exercises?.length ?? 0,
    })),
  }
}

/** Nombre de programmes qui lient une séance perso donnée (effet cascade de l'édition). */
export async function countProgramsUsingUserWorkout(userWorkoutId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_program_workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_workout_id', userWorkoutId)
  if (error) throw error
  return count ?? 0
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
    .select('id, name, video_url, tension_type')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Exercise[]
}
