-- Migration : mise à jour des séances féminines (BBL, Leg Day, Lower Body, Upper Body F)
-- Date : 2026-05-05
-- Idempotente : rejouable sans casser quoi que ce soit.
--
-- Résumé des opérations :
--   1. Insert idempotent des 3 nouveaux exercices (Fente Bulgare, Presse, Glute Hyperextension)
--   2. Renommage Machine Abducteur → Hip abducteur (UPDATE, préserve l'id et la video_url)
--   3. Recomposition de Leg Day (Squat → Presse à l'order 1)
--   4. Refonte complète de Lower Body (5 nouveaux exercices)
--   5. Recomposition de Upper Body (F) (suppression Tractions négatives + renumérotation)
--   BBL Day : aucun changement (composition déjà conforme)
--
-- Garde-fous :
--   - Aucun DELETE sur exercises (les exos orphelins Squat, Leg curl, Tractions négatives
--     restent dans le catalogue avec leurs vidéos)
--   - Aucun DELETE sur workouts
--   - Ne touche pas aux doublons Hip thrust/Hip Thrust ni Leg extension/Leg Extension

-- ============================================================
-- ÉTAPE 1 — Insérer les 3 nouveaux exercices (idempotent)
-- La table exercises n'a pas de contrainte UNIQUE sur name (vérifié),
-- on utilise donc INSERT ... WHERE NOT EXISTS.
-- ============================================================

INSERT INTO public.exercises (name, muscle_group, equipment, calorie_factor, video_url)
SELECT
  'Fente Bulgare',
  'Glutes/Quads',
  'Dumbbell',
  0.018,
  'https://qlbmjwlgezjgvxwfxesw.supabase.co/storage/v1/object/public/exercise_videos/Fente%20Bulgare.mp4'
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises WHERE name = 'Fente Bulgare'
);

INSERT INTO public.exercises (name, muscle_group, equipment, calorie_factor, video_url)
SELECT
  'Presse',
  'Quads',
  'Machine',
  0.020,
  'https://qlbmjwlgezjgvxwfxesw.supabase.co/storage/v1/object/public/exercise_videos/Presse.mp4'
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises WHERE name = 'Presse'
);

INSERT INTO public.exercises (name, muscle_group, equipment, calorie_factor, video_url)
SELECT
  'Glute Hyperextension',
  'Glutes',
  'Bench',
  0.014,
  'https://qlbmjwlgezjgvxwfxesw.supabase.co/storage/v1/object/public/exercise_videos/Glute%20Hyperextension.mp4'
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises WHERE name = 'Glute Hyperextension'
);

-- ============================================================
-- ÉTAPE 2 — Renommer Machine Abducteur → Hip abducteur
-- UPDATE préserve l'id (0b0a1750-ecd9-4142-a5f8-b8cce5a1cb73)
-- et la video_url (Abducteur.mp4) et toutes les FK existantes.
-- ============================================================

UPDATE public.exercises
SET name = 'Hip abducteur'
WHERE name = 'Machine Abducteur';

-- ============================================================
-- ÉTAPE 3 — Recomposer Leg Day
-- Seul changement : Squat (order 1) → Presse
-- Stratégie : DELETE + INSERT complet (idempotent)
-- workout_id = '23e33dd2-6e70-4b40-b0d4-bb98fb0390c8' (Leg Day)
-- ============================================================

DELETE FROM public.workout_exercises
WHERE workout_id = '23e33dd2-6e70-4b40-b0d4-bb98fb0390c8';

INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  -- 1. Presse (nouveau)
  ('23e33dd2-6e70-4b40-b0d4-bb98fb0390c8',
   (SELECT id FROM public.exercises WHERE name = 'Presse' LIMIT 1),
   4, '8-10', 150, 1),
  -- 2. RDL (conservé)
  ('23e33dd2-6e70-4b40-b0d4-bb98fb0390c8',
   '7b858fec-8df9-4b58-bb9d-4004092dac66',
   4, '8-10', 150, 2),
  -- 3. Hip thrust (lowercase t — conservé)
  ('23e33dd2-6e70-4b40-b0d4-bb98fb0390c8',
   '3797e8b4-3043-4c61-b3d2-5360e24e322d',
   3, '10-12', 120, 3),
  -- 4. Leg extension (lowercase e — conservé)
  ('23e33dd2-6e70-4b40-b0d4-bb98fb0390c8',
   'def11705-0abf-48b5-bdbf-41bf4fb914e7',
   3, '10-12', 120, 4),
  -- 5. Mollet Extension (conservé)
  ('23e33dd2-6e70-4b40-b0d4-bb98fb0390c8',
   '76d90238-7148-48f8-ade5-7a8ec7e361c7',
   2, '10-12', 90, 5);

-- ============================================================
-- ÉTAPE 4 — Recomposer Lower Body (refonte complète 5 exos)
-- workout_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' (Lower Body)
-- ============================================================

DELETE FROM public.workout_exercises
WHERE workout_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  -- 1. Fente Bulgare (nouveau)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   (SELECT id FROM public.exercises WHERE name = 'Fente Bulgare' LIMIT 1),
   3, '10-12', 120, 1),
  -- 2. RDL (conservé)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   '7b858fec-8df9-4b58-bb9d-4004092dac66',
   4, '8-10', 150, 2),
  -- 3. Hip abducteur (= Machine Abducteur renommé, id: 0b0a1750)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   '0b0a1750-ecd9-4142-a5f8-b8cce5a1cb73',
   3, '10-12', 120, 3),
  -- 4. Leg extension (lowercase e, id: def11705)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   'def11705-0abf-48b5-bdbf-41bf4fb914e7',
   3, '10-12', 120, 4),
  -- 5. Glute Hyperextension (nouveau)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   (SELECT id FROM public.exercises WHERE name = 'Glute Hyperextension' LIMIT 1),
   3, '10-12', 120, 5);

-- ============================================================
-- ÉTAPE 5 — Recomposer Upper Body (F)
-- Suppression de Tractions négatives (order 1) + renumérotation
-- workout_id = '3b5f14af-33dc-4643-b36a-c92e095e4ca5' (Upper Body (F))
-- ============================================================

DELETE FROM public.workout_exercises
WHERE workout_id = '3b5f14af-33dc-4643-b36a-c92e095e4ca5';

INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
VALUES
  -- 1. Tirage vertical (était order 2, devient order 1)
  ('3b5f14af-33dc-4643-b36a-c92e095e4ca5',
   'ac462be9-61b2-4158-b518-b8521ad9781d',
   4, '10-12', 150, 1),
  -- 2. Shoulder press (était order 3, devient order 2)
  ('3b5f14af-33dc-4643-b36a-c92e095e4ca5',
   '9b54dc69-45f6-4eea-a3b3-5aaf1d78837c',
   3, '10', 120, 2),
  -- 3. Tirage horizontal (était order 4, devient order 3)
  ('3b5f14af-33dc-4643-b36a-c92e095e4ca5',
   'c1710cbe-e1ab-4695-bdfe-c5ae2408839c',
   3, '10', 120, 3),
  -- 4. Élévations latérales (était order 5, devient order 4)
  ('3b5f14af-33dc-4643-b36a-c92e095e4ca5',
   'b5f5f0d5-d6ae-413e-87af-c1cc89f34b88',
   3, '10-12', 120, 4),
  -- 5. Extension triceps poulie (était order 6, devient order 5)
  ('3b5f14af-33dc-4643-b36a-c92e095e4ca5',
   '1acb2d6b-9305-4699-8548-8876ed03be23',
   3, '10', 120, 5);
