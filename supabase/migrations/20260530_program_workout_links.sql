-- Migration: 20260530_program_workout_links.sql
-- Feature « séances liées » — un programme perso peut contenir, dans un ordre
-- libre, soit des séances du CATALOGUE (workouts), soit des séances PERSO
-- (user_workouts), par référence (lien) et non par copie.
--
-- Tables user_programs / user_workouts sont vides : aucun backfill.
-- L'appartenance d'une séance à un programme est désormais portée UNIQUEMENT par
-- cette table de liaison ; user_workouts.user_program_id devient donc obsolète et
-- passe en nullable (une séance perso n'est plus liée à un seul programme, elle
-- est réutilisable et survit à la suppression d'un programme).

-- ============================================================
-- TABLE : user_program_workouts (liaison ordonnée programme ↔ séance)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_program_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_program_id UUID NOT NULL REFERENCES public.user_programs(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('catalog', 'user')),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_workout_id UUID REFERENCES public.user_workouts(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Exactement une référence selon la source.
  CONSTRAINT one_ref_per_source CHECK (
    (source = 'catalog' AND workout_id IS NOT NULL AND user_workout_id IS NULL)
    OR (source = 'user' AND user_workout_id IS NOT NULL AND workout_id IS NULL)
  )
);

ALTER TABLE public.user_program_workouts ENABLE ROW LEVEL SECURITY;

-- RLS : on n'agit que sur les liaisons des programmes qu'on possède.
CREATE POLICY "Own program links - select" ON public.user_program_workouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_programs up
            WHERE up.id = user_program_id AND up.user_id = auth.uid())
  );
CREATE POLICY "Own program links - insert" ON public.user_program_workouts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_programs up
            WHERE up.id = user_program_id AND up.user_id = auth.uid())
  );
CREATE POLICY "Own program links - update" ON public.user_program_workouts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_programs up
            WHERE up.id = user_program_id AND up.user_id = auth.uid())
  );
CREATE POLICY "Own program links - delete" ON public.user_program_workouts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_programs up
            WHERE up.id = user_program_id AND up.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_upw_program ON public.user_program_workouts(user_program_id);
CREATE INDEX IF NOT EXISTS idx_upw_user_workout ON public.user_program_workouts(user_workout_id);

-- ============================================================
-- user_workouts.user_program_id : obsolète → nullable (membership = source de vérité)
-- ============================================================
ALTER TABLE public.user_workouts ALTER COLUMN user_program_id DROP NOT NULL;
