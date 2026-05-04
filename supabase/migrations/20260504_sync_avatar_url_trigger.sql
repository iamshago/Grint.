-- Migration: 20260504_sync_avatar_url_trigger.sql
-- Garantit que profiles.avatar_url est tenu à jour avec la photo OAuth la plus
-- récente :
--  - À la création d'un nouveau profil → recopie depuis auth.users.
--  - À chaque mise à jour de auth.users (refresh token, re-link OAuth) → idem,
--    UNIQUEMENT si profiles.avatar_url est vide ou égal à l'ancienne valeur OAuth
--    (on respecte une éventuelle photo uploadée manuellement par l'utilisateur).

-- ============================================================
-- Helper : extrait l'URL OAuth depuis raw_user_meta_data
-- ============================================================
CREATE OR REPLACE FUNCTION public.oauth_avatar_url(user_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture'
  )
  FROM auth.users
  WHERE id = user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- Trigger 1 : à la création d'une ligne profiles, hydrate avatar_url
-- ============================================================
CREATE OR REPLACE FUNCTION public.populate_avatar_url_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.avatar_url IS NULL THEN
    NEW.avatar_url := public.oauth_avatar_url(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_populate_avatar_url ON public.profiles;
CREATE TRIGGER profiles_populate_avatar_url
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_avatar_url_on_profile_insert();

-- ============================================================
-- Trigger 2 : à chaque update de auth.users, propage la photo OAuth si elle a
-- changé ET si profiles.avatar_url est null OU égal à l'ancienne photo OAuth
-- (pas une photo perso uploadée par l'utilisateur).
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_avatar_url_from_auth()
RETURNS TRIGGER AS $$
DECLARE
  new_oauth_url TEXT;
  old_oauth_url TEXT;
BEGIN
  new_oauth_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  old_oauth_url := COALESCE(
    OLD.raw_user_meta_data->>'avatar_url',
    OLD.raw_user_meta_data->>'picture'
  );

  IF new_oauth_url IS NOT NULL AND new_oauth_url IS DISTINCT FROM old_oauth_url THEN
    UPDATE public.profiles
    SET avatar_url = new_oauth_url,
        updated_at = now()
    WHERE id = NEW.id
      AND (avatar_url IS NULL OR avatar_url = old_oauth_url);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auth_users_sync_avatar_url ON auth.users;
CREATE TRIGGER auth_users_sync_avatar_url
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_avatar_url_from_auth();
