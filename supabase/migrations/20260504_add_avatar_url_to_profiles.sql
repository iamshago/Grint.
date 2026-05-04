-- Migration: 20260504_add_avatar_url_to_profiles.sql
-- Ajoute une colonne avatar_url pour stocker l'URL de la photo de profil
-- personnalisée (uploadée ou OAuth Google) — prioritaire sur avatar_id.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN profiles.avatar_url IS
  'URL de la photo personnalisée. Si non null, prioritaire sur avatar_id côté UI.';
