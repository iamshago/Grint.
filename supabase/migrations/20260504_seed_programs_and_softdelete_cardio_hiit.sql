-- Seed initial des 4 programmes (upsert idempotent) + soft-delete Cardio HIIT.
-- Les image_url pointent sur les assets copiés en Phase 5.
INSERT INTO public.programs (id, title, difficulty, frequency, description, image_url, focus, keywords, display_order)
VALUES
  ('ul', 'Upper / Lower', 'Intermédiaire', '2 à 4 fois / semaine',
   'Sépare l''entraînement du haut et du bas du corps. Le compromis parfait pour optimiser la récupération tout en gardant une haute fréquence.',
   '/assets/programs/upper-lower.png',
   ARRAY['Haut du corps', 'Bas du corps'],
   ARRAY['upper', 'lower'],
   1),
  ('bbl', 'BBL Bootcamp', 'Intermédiaire', '2 à 4 fois / semaine',
   'Un focus intensif sur le développement des fessiers et du bas du corps. Prépare-toi à transpirer.',
   '/assets/programs/bbl-bootcamp.png',
   ARRAY['Fessiers', 'Jambes'],
   ARRAY['bbl', 'leg', 'women', 'woman'],
   2),
  ('ppl', 'Push Pull Legs', 'Avancé', '3 à 6 fois / semaine',
   'Le programme de musculation par excellence. Divise le corps en mouvements de poussée, de tirage et focus jambes.',
   '/assets/programs/push-pull-leg.png',
   ARRAY['Pecs/Triceps', 'Dos/Biceps', 'Jambes'],
   ARRAY['push', 'pull', 'leg'],
   3),
  ('fb', 'Full Body', 'Débutant', '2 à 4 fois / semaine',
   'Travaille l''ensemble du corps à chaque séance. Parfait pour commencer ou si tu as un emploi du temps chargé.',
   '/assets/programs/full-body.png',
   ARRAY['Corps complet', 'Fondations'],
   ARRAY['full', 'body', 'circuit'],
   4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  frequency = EXCLUDED.frequency,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  focus = EXCLUDED.focus,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order;

-- Cardio HIIT n'apparaît plus dans le catalogue. L'historique éventuel
-- (completed_workouts/workout_plan FK) reste préservé.
UPDATE public.workouts
SET is_deleted = true
WHERE title = 'Cardio HIIT';
