-- Migration: 20260504_backfill_avatar_url_from_oauth.sql
-- Recopie les photos de profil OAuth (Google, etc.) depuis auth.users.raw_user_meta_data
-- vers profiles.avatar_url pour les comptes qui n'ont pas encore de photo perso.

UPDATE public.profiles p
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
FROM auth.users u
WHERE u.id = p.id
  AND p.avatar_url IS NULL
  AND COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ) IS NOT NULL;
