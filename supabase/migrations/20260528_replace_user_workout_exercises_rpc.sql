-- Migration: 20260528_replace_user_workout_exercises_rpc.sql
-- RPC atomique pour remplacer les exercices d'une séance perso.
-- Le corps d'une fonction plpgsql s'exécute dans une seule transaction : le
-- DELETE puis l'INSERT sont donc atomiques (zéro risque de séance vidée si le
-- réseau coupe entre les deux, contrairement à deux appels client séparés).
--
-- SECURITY INVOKER : la fonction s'exécute avec les droits de l'appelant, donc
-- les policies RLS de user_workout_exercises (ownership via JOIN sur
-- user_workouts.user_id = auth.uid()) s'appliquent au DELETE et à l'INSERT.

CREATE OR REPLACE FUNCTION public.replace_user_workout_exercises(
  p_workout_id UUID,
  p_exercises JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.user_workout_exercises WHERE user_workout_id = p_workout_id;

  INSERT INTO public.user_workout_exercises
    (user_workout_id, exercise_id, sets, reps, rest_seconds, slot_type, order_index)
  SELECT
    p_workout_id,
    (e->>'exercise_id')::uuid,
    (e->>'sets')::int,
    e->>'reps',
    (e->>'rest_seconds')::int,
    NULLIF(e->>'slot_type', '')::text,
    (e->>'order_index')::int
  FROM jsonb_array_elements(p_exercises) AS e;
END;
$$;
