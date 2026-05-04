-- Soft-delete pour workouts : permet de retirer une séance du catalogue sans
-- casser l'historique (completed_workouts, workout_plan).
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS workouts_is_deleted_idx
ON public.workouts (is_deleted)
WHERE is_deleted = false;
