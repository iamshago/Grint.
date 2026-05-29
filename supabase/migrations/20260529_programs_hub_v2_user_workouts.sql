-- Migration: 20260529_programs_hub_v2_user_workouts.sql
-- Feature « Programs Hub v2 » — 3 changements sur user_workouts + nouvelle table de bibliothèque d'images.
--
-- 1. user_program_id → nullable (une séance perso peut exister sans programme parent).
--    Note : ce DROP NOT NULL est inclus dans 20260530_program_workout_links.sql ;
--    on le rejoue ici avec IF EXISTS / idempotence garantie par la contrainte IS ALREADY NULLABLE.
--    En pratique, si 20260530 a déjà été appliqué, cette commande est un no-op silencieux.
--
-- 2. image_url TEXT sur user_workouts (galerie de presets — sélectionnable dans l'éditeur).
--
-- 3. workout_image_library — catalogue d'images avec lecture publique (RLS open SELECT).
--    Alimentée manuellement (admin) ou via seed ultérieur.

-- ============================================================
-- 1. user_workouts.user_program_id : rendre nullable
-- ============================================================
-- Idempotent : si déjà nullable (migration 20260530 déjà appliquée), PostgreSQL
-- accepte silencieusement un DROP NOT NULL sur une colonne déjà nullable.
ALTER TABLE public.user_workouts ALTER COLUMN user_program_id DROP NOT NULL;

-- ============================================================
-- 2. user_workouts.image_url : ajouter si absent
-- ============================================================
ALTER TABLE public.user_workouts ADD COLUMN IF NOT EXISTS image_url text;

-- ============================================================
-- 3. workout_image_library : bibliothèque d'images preset
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workout_image_library (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url    text        NOT NULL,
  category     text        CHECK (category IN ('upper', 'lower', 'bbl', 'generic')),
  label        text,
  display_order int        NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.workout_image_library ENABLE ROW LEVEL SECURITY;

-- Lecture publique (anon + authenticated) — pas d'écriture via API cliente.
CREATE POLICY "Read all" ON public.workout_image_library
  FOR SELECT USING (true);
