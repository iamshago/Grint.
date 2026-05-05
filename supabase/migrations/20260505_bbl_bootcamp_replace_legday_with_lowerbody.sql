-- BBL Bootcamp : remplacer Leg Day par Lower Body
--
-- Le mapping program <-> workouts est dynamique côté code (Program.tsx:118-122) :
--   workouts.filter(w => program.keywords.some(kw => w.title.toLowerCase().includes(kw)))
-- Donc pour retirer Leg Day on enlève le keyword "leg" et pour ajouter Lower Body
-- on ajoute le keyword "lower". Les keywords "women"/"woman" sont conservés (pas
-- d'effet : aucun workout ne contient ces sous-chaînes dans son titre).
--
-- Résolution attendue après migration :
--   BBL Bootcamp -> [BBL Day, Lower Body]   (Leg Day retiré, Lower Body ajouté)
--
-- Idempotence : UPDATE WHERE id='bbl', rejouable.

UPDATE public.programs
SET keywords = ARRAY['bbl', 'lower', 'women', 'woman']
WHERE id = 'bbl';
