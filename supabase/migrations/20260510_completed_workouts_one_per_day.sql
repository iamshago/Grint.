-- Bug "points de défi gonflés" : la table `completed_workouts` n'avait aucune
-- contrainte UNIQUE sur (user, jour), donc un double-clic ou un retry réseau
-- créait des doublons que `useChallengeProgress` comptait à tort comme +1 pt.
-- L'app ne permet QU'UNE séance par jour par utilisateur (cf. CLAUDE.md
-- "Règle : une seule séance par jour maximum"), on aligne le schéma sur cette règle.

BEGIN;

-- 1) CLEANUP : supprime les doublons en gardant la ligne la plus ANCIENNE par
-- (user_id, jour Europe/Paris). Le tri ASC sur completed_at puis sur id assure
-- un comportement déterministe même si plusieurs lignes partagent le même
-- timestamp (cas d'un double-INSERT serré).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, ((completed_at AT TIME ZONE 'Europe/Paris')::date)
      ORDER BY completed_at ASC, id ASC
    ) AS rn
  FROM public.completed_workouts
)
DELETE FROM public.completed_workouts cw
USING ranked r
WHERE cw.id = r.id
  AND r.rn > 1;

-- 2) UNIQUE INDEX sur (user_id, jour Europe/Paris).
-- L'expression doit être strictement IMMUTABLE pour servir d'index : on cast
-- au timestamp at time zone 'Europe/Paris' puis ::date. C'est la même expression
-- que celle utilisée dans le cleanup ci-dessus.
CREATE UNIQUE INDEX IF NOT EXISTS completed_workouts_user_day_unique
  ON public.completed_workouts (
    user_id,
    ((completed_at AT TIME ZONE 'Europe/Paris')::date)
  );

COMMIT;

-- Validation post-migration (à exécuter manuellement) :
--   SELECT user_id, completed_at::date AS day, COUNT(*) AS n
--   FROM public.completed_workouts
--   GROUP BY user_id, day HAVING COUNT(*) > 1
--   ORDER BY n DESC LIMIT 50;
-- → doit renvoyer 0 ligne.
