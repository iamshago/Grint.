-- Ajoute un champ optionnel pour l'image hero affichée en vue détail séance.
-- Si null, le rendu fait fallback sur image_url (le visuel des cards).
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS detail_image_url text;

-- Seed les 2 séances qui ont un hero dédié.
UPDATE public.workouts
SET detail_image_url = '/assets/workouts/leg-day-detail.png'
WHERE title = 'Leg Day';

UPDATE public.workouts
SET detail_image_url = '/assets/workouts/circuit-abdos-detail.png'
WHERE title = 'Circuit Abdos';
