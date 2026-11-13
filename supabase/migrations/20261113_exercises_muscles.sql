-- Migration: 20261113_exercises_muscles.sql
-- Muscles travaillés par exercice, pour « Créer une séance » :
--   - la recherche trouve un exercice par muscle (« quadriceps » → tous les exercices qui les travaillent) ;
--   - la feuille d'exercices recommande ceux du haut ou du bas du corps selon la catégorie de la séance.
-- `muscles` = noms français de src/lib/muscles.ts (MUSCLES), le muscle principal en premier.
-- L'ancienne colonne `muscle_group` (anglais, vide pour 21 exercices sur 49) n'est pas touchée.
-- Sans effet sur l'app tant qu'elle n'est pas passée : le catalogue se charge alors sans muscles.

ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS muscles TEXT[];

UPDATE public.exercises AS e SET muscles = v.muscles
FROM (VALUES
  ('barre au front',               ARRAY['Triceps']),
  ('bench',                        ARRAY['Pectoraux','Triceps','Épaules']),
  ('bench incliné',                ARRAY['Pectoraux','Épaules','Triceps']),
  ('biceps curl poulie',           ARRAY['Biceps','Avant-bras']),
  ('crunch',                       ARRAY['Abdos']),
  ('curl concentration',           ARRAY['Biceps']),
  ('curl incliné haltères',        ARRAY['Biceps']),
  ('curl marteau',                 ARRAY['Biceps','Avant-bras']),
  ('dips',                         ARRAY['Pectoraux','Triceps','Épaules']),
  ('écarté poulie',                ARRAY['Pectoraux']),
  ('élévations latérales',         ARRAY['Épaules']),
  ('extension triceps poulie',     ARRAY['Triceps']),
  ('face pull',                    ARRAY['Épaules','Trapèzes','Dos']),
  ('fente arrière',                ARRAY['Fessiers','Quadriceps','Ischio-jambiers']),
  ('fente avant (haltères)',       ARRAY['Quadriceps','Fessiers']),
  ('fente bulgare',                ARRAY['Fessiers','Quadriceps','Ischio-jambiers']),
  ('fente marchée',                ARRAY['Quadriceps','Fessiers','Ischio-jambiers']),
  ('gainage latéral',              ARRAY['Obliques','Abdos']),
  ('glute hyperextension',         ARRAY['Fessiers','Ischio-jambiers','Lombaires']),
  ('good morning',                 ARRAY['Ischio-jambiers','Lombaires','Fessiers']),
  ('hack squat',                   ARRAY['Quadriceps','Fessiers']),
  ('haussement d''épaules',        ARRAY['Trapèzes']),
  ('hip abducteur',                ARRAY['Fessiers','Abducteurs']),
  ('hip thrust',                   ARRAY['Fessiers','Ischio-jambiers']),
  ('hyperextension lombaire',      ARRAY['Lombaires','Fessiers','Ischio-jambiers']),
  ('kick back poulie',             ARRAY['Fessiers']),
  ('leg curl',                     ARRAY['Ischio-jambiers']),
  ('leg extension',                ARRAY['Quadriceps']),
  ('leg raise',                    ARRAY['Abdos']),
  ('mollet extension',             ARRAY['Mollets']),
  ('mountain climber',             ARRAY['Abdos']),
  ('oiseau (rear delt)',           ARRAY['Épaules','Trapèzes']),
  ('planche',                      ARRAY['Abdos']),
  ('presse',                       ARRAY['Quadriceps','Fessiers']),
  ('presse à cuisses unilatérale', ARRAY['Quadriceps','Fessiers']),
  ('pull-over',                    ARRAY['Dos','Pectoraux']),
  ('rdl',                          ARRAY['Ischio-jambiers','Fessiers','Lombaires']),
  ('relevé de jambes suspendu',    ARRAY['Abdos']),
  ('rowing haltère unilatéral',    ARRAY['Dos','Biceps']),
  ('russian twist',                ARRAY['Obliques','Abdos']),
  ('shoulder press',               ARRAY['Épaules','Triceps']),
  ('soulevé de terre unilatéral',  ARRAY['Ischio-jambiers','Fessiers']),
  ('squat',                        ARRAY['Quadriceps','Fessiers']),
  ('step-up (banc)',               ARRAY['Quadriceps','Fessiers']),
  ('sumo squat (haltère)',         ARRAY['Fessiers','Quadriceps','Adducteurs']),
  ('tirage grand dorsal',          ARRAY['Dos','Biceps']),
  ('tirage horizontal',            ARRAY['Dos','Biceps']),
  ('tirage vertical',              ARRAY['Dos','Biceps']),
  ('tractions négatives',          ARRAY['Dos','Biceps'])
) AS v(nom, muscles)
WHERE lower(e.name) = v.nom;

-- Vérification : doit renvoyer 0 ligne (tout exercice du catalogue a ses muscles).
-- SELECT name FROM public.exercises WHERE muscles IS NULL;
