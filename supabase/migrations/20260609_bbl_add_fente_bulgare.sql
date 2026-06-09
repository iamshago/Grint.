-- Ajoute « Fente Bulgare » juste après le « Hip thrust » dans la séance BBL Day.
--
-- La compo de BBL Day est seedée en amont (hors migrations du repo) : on résout
-- donc tout par nom plutôt que par ID généré. Doublon connu de noms : « Hip thrust »
-- (variante réellement présente dans BBL Day) vs « Hip Thrust » — on cible l'exacte
-- « Hip thrust ». Sets/reps/rest calés sur le bloc de force de la séance (Hip thrust,
-- RDL, Sumo Squat = 3 séries / 150 s) ; reps '10-12' (réf. Lower Body, entre 8-10 et 10).
--
-- Idempotence : sortie anticipée si Fente Bulgare est déjà dans BBL Day → rejouable.

DO $$
DECLARE
  v_workout uuid;
  v_fente   uuid;
  v_hip_ord integer;
BEGIN
  SELECT id INTO v_workout FROM public.workouts WHERE title = 'BBL Day' LIMIT 1;
  SELECT id INTO v_fente   FROM public.exercises WHERE name = 'Fente Bulgare' LIMIT 1;

  IF v_workout IS NULL OR v_fente IS NULL THEN
    RAISE NOTICE 'BBL Day (%) ou Fente Bulgare (%) introuvable — migration ignorée', v_workout, v_fente;
    RETURN;
  END IF;

  -- Idempotence : Fente Bulgare déjà présente dans BBL Day → on ne fait rien.
  IF EXISTS (
    SELECT 1 FROM public.workout_exercises
    WHERE workout_id = v_workout AND exercise_id = v_fente
  ) THEN
    RAISE NOTICE 'Fente Bulgare déjà dans BBL Day — migration ignorée';
    RETURN;
  END IF;

  -- order_index du Hip thrust (variante exacte « Hip thrust ») dans BBL Day.
  SELECT we.order_index INTO v_hip_ord
  FROM public.workout_exercises we
  JOIN public.exercises e ON e.id = we.exercise_id
  WHERE we.workout_id = v_workout AND e.name = 'Hip thrust'
  ORDER BY we.order_index
  LIMIT 1;

  IF v_hip_ord IS NULL THEN
    RAISE NOTICE 'Hip thrust introuvable dans BBL Day — migration ignorée';
    RETURN;
  END IF;

  -- Décale de +1 tout ce qui suit le Hip thrust (pas de contrainte unique sur
  -- (workout_id, order_index) → un seul UPDATE suffit).
  UPDATE public.workout_exercises
  SET order_index = order_index + 1
  WHERE workout_id = v_workout AND order_index > v_hip_ord;

  -- Insère Fente Bulgare en position Hip thrust + 1.
  INSERT INTO public.workout_exercises (workout_id, exercise_id, order_index, sets, reps, rest_seconds)
  VALUES (v_workout, v_fente, v_hip_ord + 1, 3, '10-12', 150);

  RAISE NOTICE 'Fente Bulgare insérée dans BBL Day en position %', v_hip_ord + 1;
END $$;
