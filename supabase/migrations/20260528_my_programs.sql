-- Migration: 20260528_my_programs.sql
-- Feature « Mon programme » — programmes & séances persos.
--
-- Tables créées : user_programs, user_workouts, user_workout_exercises (+ RLS owner-only).
-- Extensions : workout_plan et completed_workouts gagnent (source, user_workout_id) ;
-- completed_workouts gagne une colonne `category` DÉNORMALISÉE afin de découpler le
-- calcul du streak de la table source (le streak n'a plus à savoir si la séance vient
-- du catalogue `workouts` ou des séances persos `user_workouts`).
--
-- Note : `user_workout_exercises.reps` est TEXT (et non int), identique à
-- `workout_exercises.reps`, pour autoriser les plages « 10-12 » et garantir un mapping
-- 1:1 vers le Workout Player existant qui parse `reps` comme une chaîne.

-- ============================================================
-- FUNCTION utilitaire : bump automatique de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ============================================================
-- TABLE : user_programs (programmes persos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  focus TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own programs - select" ON public.user_programs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own programs - insert" ON public.user_programs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own programs - update" ON public.user_programs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own programs - delete" ON public.user_programs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_programs_user ON public.user_programs(user_id);

CREATE TRIGGER trg_user_programs_updated_at
  BEFORE UPDATE ON public.user_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE : user_workouts (séances persos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_program_id UUID NOT NULL REFERENCES public.user_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'upper' CHECK (category IN ('upper', 'lower', 'bbl')),
  order_index INT NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own workouts - select" ON public.user_workouts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own workouts - insert" ON public.user_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own workouts - update" ON public.user_workouts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own workouts - delete" ON public.user_workouts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_workouts_program ON public.user_workouts(user_program_id);

CREATE TRIGGER trg_user_workouts_updated_at
  BEFORE UPDATE ON public.user_workouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE : user_workout_exercises (exos d'une séance perso)
-- slot_type NULL = exercice libre (hors des 4 slots guides).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_workout_id UUID NOT NULL REFERENCES public.user_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  sets INT NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10-12',
  rest_seconds INT NOT NULL DEFAULT 90,
  slot_type TEXT CHECK (slot_type IN ('contraction', 'stretch', 'unilateral', 'isolation')),
  order_index INT NOT NULL DEFAULT 0
);

ALTER TABLE public.user_workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS via JOIN sur user_workouts.user_id (l'exo n'a pas de user_id direct).
CREATE POLICY "Own workout exercises - select" ON public.user_workout_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_workouts uw
            WHERE uw.id = user_workout_id AND uw.user_id = auth.uid())
  );
CREATE POLICY "Own workout exercises - insert" ON public.user_workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_workouts uw
            WHERE uw.id = user_workout_id AND uw.user_id = auth.uid())
  );
CREATE POLICY "Own workout exercises - update" ON public.user_workout_exercises
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_workouts uw
            WHERE uw.id = user_workout_id AND uw.user_id = auth.uid())
  );
CREATE POLICY "Own workout exercises - delete" ON public.user_workout_exercises
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_workouts uw
            WHERE uw.id = user_workout_id AND uw.user_id = auth.uid())
  );

-- Au max 1 exo par slot guide nommé. Les exos libres (slot_type NULL) sont illimités.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_workout_slot
  ON public.user_workout_exercises(user_workout_id, slot_type)
  WHERE slot_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_workout_exercises_workout
  ON public.user_workout_exercises(user_workout_id);

-- ============================================================
-- EXTENSION : workout_plan — planifier des séances perso
-- workout_id reste pour le catalogue (nullable) ; user_workout_id pour les persos.
-- ============================================================
ALTER TABLE public.workout_plan
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'catalog'
    CHECK (source IN ('catalog', 'user')),
  ADD COLUMN IF NOT EXISTS user_workout_id UUID
    REFERENCES public.user_workouts(id) ON DELETE CASCADE;

-- ============================================================
-- EXTENSION : completed_workouts — source + category dénormalisée (streak)
-- ============================================================
ALTER TABLE public.completed_workouts
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'catalog'
    CHECK (source IN ('catalog', 'user')),
  ADD COLUMN IF NOT EXISTS user_workout_id UUID
    REFERENCES public.user_workouts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IN ('upper', 'lower', 'bbl'));

-- Backfill : renseigner category pour les séances catalogue déjà complétées,
-- afin que le streak (qui lira désormais completed_workouts.category) reste exact.
UPDATE public.completed_workouts cw
SET category = w.category
FROM public.workouts w
WHERE cw.workout_id = w.id AND cw.category IS NULL;
