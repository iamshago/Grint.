-- Harmonisation de la fréquence des défis à 3 séances/sem/personne.
--
-- La valeur vit dans challenges.sessions_per_week_per_member et est lue par
-- useChallengeProgress (S * N pour weeklyTarget, S * N * weeksTotal pour
-- totalGoal). Côté UI, ChallengeCard / ChallengeDetail / ChallengeInfoPopup
-- consommeront désormais cette valeur (avant : valeurs en dur).
--
-- Idempotence : UPDATE WHERE is_active, rejouable.

UPDATE public.challenges
SET sessions_per_week_per_member = 3
WHERE is_active = true;
