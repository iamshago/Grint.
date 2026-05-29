-- Migration: 20260531_exercise_tension_type.sql
-- Recommandation d'exercices par slot : chaque exercice porte un `tension_type`
-- (contraction / étirement / unilatéral / isolation) pour être proposé en premier
-- dans le slot correspondant de l'éditeur de séance.
-- Inclut : dédoublonnage du catalogue, classement, et ajout d'exercices de salle
-- courants manquants (sans vidéo) — surtout pour étoffer l'unilatéral.

ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS tension_type TEXT
  CHECK (tension_type IN ('contraction','stretch','unilateral','isolation'));

-- Dédoublonnage : repointer les références vers le canonique, puis supprimer le doublon.
-- Leg Extension -> Leg extension
UPDATE public.workout_exercises SET exercise_id='def11705-0abf-48b5-bdbf-41bf4fb914e7' WHERE exercise_id='c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33';
UPDATE public.user_workout_exercises SET exercise_id='def11705-0abf-48b5-bdbf-41bf4fb914e7' WHERE exercise_id='c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33';
UPDATE public.user_progress SET exercise_id='def11705-0abf-48b5-bdbf-41bf4fb914e7' WHERE exercise_id='c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33';
DELETE FROM public.exercises WHERE id='c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33';
-- Hip Thrust -> Hip thrust
UPDATE public.workout_exercises SET exercise_id='3797e8b4-3043-4c61-b3d2-5360e24e322d' WHERE exercise_id='91f1cbfd-f12b-4a7f-9fc9-c18c9f8d2d0c';
UPDATE public.user_workout_exercises SET exercise_id='3797e8b4-3043-4c61-b3d2-5360e24e322d' WHERE exercise_id='91f1cbfd-f12b-4a7f-9fc9-c18c9f8d2d0c';
UPDATE public.user_progress SET exercise_id='3797e8b4-3043-4c61-b3d2-5360e24e322d' WHERE exercise_id='91f1cbfd-f12b-4a7f-9fc9-c18c9f8d2d0c';
DELETE FROM public.exercises WHERE id='91f1cbfd-f12b-4a7f-9fc9-c18c9f8d2d0c';
-- Romanian Deadlift -> RDL
UPDATE public.workout_exercises SET exercise_id='7b858fec-8df9-4b58-bb9d-4004092dac66' WHERE exercise_id='d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44';
UPDATE public.user_workout_exercises SET exercise_id='7b858fec-8df9-4b58-bb9d-4004092dac66' WHERE exercise_id='d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44';
UPDATE public.user_progress SET exercise_id='7b858fec-8df9-4b58-bb9d-4004092dac66' WHERE exercise_id='d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44';
DELETE FROM public.exercises WHERE id='d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44';

-- Classement par type de tension (noms canoniques). Hip thrust = contraction (choix Pestakle).
UPDATE public.exercises SET tension_type='contraction' WHERE lower(name) IN
  ('leg extension','leg curl','élévations latérales','kick back poulie','face pull','hip abducteur','mollet extension','glute hyperextension','hyperextension lombaire','hip thrust','oiseau (rear delt)','haussement d''épaules');
UPDATE public.exercises SET tension_type='stretch' WHERE lower(name) IN
  ('squat','sumo squat (haltère)','presse','rdl','bench','bench incliné','dips','écarté poulie','extension triceps poulie','tirage grand dorsal','tirage vertical','tractions négatives','shoulder press','pull-over','good morning','barre au front','curl incliné haltères','hack squat');
UPDATE public.exercises SET tension_type='unilateral' WHERE lower(name) IN
  ('fente bulgare','step-up (banc)','fente avant (haltères)','fente arrière','fente marchée','soulevé de terre unilatéral','rowing haltère unilatéral','presse à cuisses unilatérale');
UPDATE public.exercises SET tension_type='isolation' WHERE lower(name) IN
  ('biceps curl poulie','curl marteau','crunch','russian twist','planche','leg raise','mountain climber','tirage horizontal','curl concentration','relevé de jambes suspendu','gainage latéral');

-- Nouveaux exercices de salle courants (sans vidéo).
INSERT INTO public.exercises (name, video_url, tension_type) VALUES
  ('Step-up (banc)', NULL, 'unilateral'),
  ('Fente avant (haltères)', NULL, 'unilateral'),
  ('Fente arrière', NULL, 'unilateral'),
  ('Fente marchée', NULL, 'unilateral'),
  ('Soulevé de terre unilatéral', NULL, 'unilateral'),
  ('Rowing haltère unilatéral', NULL, 'unilateral'),
  ('Presse à cuisses unilatérale', NULL, 'unilateral'),
  ('Pull-over', NULL, 'stretch'),
  ('Good morning', NULL, 'stretch'),
  ('Barre au front', NULL, 'stretch'),
  ('Curl incliné haltères', NULL, 'stretch'),
  ('Hack squat', NULL, 'stretch'),
  ('Oiseau (rear delt)', NULL, 'contraction'),
  ('Haussement d''épaules', NULL, 'contraction'),
  ('Curl concentration', NULL, 'isolation'),
  ('Relevé de jambes suspendu', NULL, 'isolation'),
  ('Gainage latéral', NULL, 'isolation');
