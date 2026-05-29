-- Seed temporaire de workout_image_library à partir des assets catalogue existants.
-- Pestakle remplacera/complétera ces visuels. Idempotent : n'insère que si la table est vide.

insert into public.workout_image_library (image_url, category, label, display_order)
select * from (values
  ('/assets/workouts/upper-body-h.png', 'upper', 'Haut du corps', 1),
  ('/assets/workouts/push-day.png',     'upper', 'Push', 2),
  ('/assets/workouts/pull-day.png',     'upper', 'Pull', 3),
  ('/assets/workouts/upper-body-f.png', 'upper', 'Haut du corps (f)', 4),
  ('/assets/workouts/abs-killer.png',   'upper', 'Abdos', 5),
  ('/assets/workouts/leg-day.png',      'lower', 'Jambes', 1),
  ('/assets/workouts/lower-body.png',   'lower', 'Bas du corps', 2),
  ('/assets/workouts/bbl-day.png',      'bbl',   'BBL', 1),
  ('/assets/programs/full-body.png',    'generic', 'Full body', 1),
  ('/assets/programs/upper-lower.png',  'generic', 'Upper/Lower', 2),
  ('/assets/programs/push-pull-leg.png','generic', 'Push Pull Legs', 3)
) as v(image_url, category, label, display_order)
where not exists (select 1 from public.workout_image_library);
