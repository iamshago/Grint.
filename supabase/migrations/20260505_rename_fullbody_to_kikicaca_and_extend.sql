-- Full Body -> "Kikicaca" + extension contenu
--
-- 1. Rename : title 'Full Body' -> 'Kikicaca'. On NE TOUCHE PAS au id='fb'
--    (c'est le slug technique). image_url '/assets/programs/full-body.png'
--    reste valide (pointe sur l'asset, pas sur le slug).
--
-- 2. Ajout 2 séances via keywords : "bbl" (matche "BBL Day") et "pull"
--    (matche "Pull Day"). Les keywords existants [full, body, circuit] sont
--    conservés et continuent à matcher Lower Body, Upper Body (F),
--    Upper Body (H), Circuit Abdos.
--
-- Résolution attendue après migration :
--   Kikicaca -> [BBL Day, Circuit Abdos, Lower Body, Pull Day,
--                Upper Body (F), Upper Body (H)]
--
-- Idempotence : UPDATE WHERE id='fb', rejouable.

UPDATE public.programs
SET
  title = 'Kikicaca',
  keywords = ARRAY['full', 'body', 'circuit', 'bbl', 'pull']
WHERE id = 'fb';
