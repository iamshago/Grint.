-- Migration: completed_workouts visibles aux co-participants d'un défi actif.
-- Permet à un utilisateur de voir les `completed_workouts` d'un autre user si
-- les deux sont co-participants d'un défi (challenge) actif. Indispensable
-- pour que le classement de la page Détail défi soit cohérent pour TOUS les
-- participants, pas seulement pour les amis directs.

-- Helper : "user A et user B sont co-participants à au moins un challenge actif"
CREATE OR REPLACE FUNCTION public.users_share_active_challenge(
  user_a UUID,
  user_b UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.challenge_participants pa
    JOIN public.challenge_participants pb USING (challenge_id)
    JOIN public.challenges c ON c.id = pa.challenge_id
    WHERE pa.user_id = user_a
      AND pb.user_id = user_b
      AND c.is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Policy SELECT : autoriser la lecture si l'utilisateur connecté partage un
-- défi actif avec le user_id de la ligne consultée. Cumulative (OR) avec les
-- policies existantes "Isoler Historique" (owner) et "Friends can view".
CREATE POLICY "Co-participants can view completed workouts"
  ON public.completed_workouts
  FOR SELECT
  USING (
    public.users_share_active_challenge(auth.uid(), user_id)
  );
