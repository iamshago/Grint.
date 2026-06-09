-- Passe la fréquence des défis de 3 à 2 séances/sem/personne.
--
-- La valeur vit dans challenges.sessions_per_week_per_member et est lue par
-- useChallengeProgress : weeklyTarget = S * N (participants), totalGoal =
-- S * N * weeksTotal. Toute l'UI (ChallengeCard, ChallengeDetail,
-- ChallengeInfoPopup, ParticipantRow) consomme cette valeur ; changer la colonne
-- propage le weekly ET le total. Miroir de 20260505_challenge_frequency_to_3.
--
-- Idempotence : UPDATE conditionnel sur is_active, rejouable sans effet de bord.

UPDATE public.challenges
SET sessions_per_week_per_member = 2
WHERE is_active = true
  AND sessions_per_week_per_member IS DISTINCT FROM 2;
