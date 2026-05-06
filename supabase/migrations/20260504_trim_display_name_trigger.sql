-- Migration: 20260504_trim_display_name_trigger.sql
-- Trigger BEFORE INSERT/UPDATE sur profiles qui rogne automatiquement
-- display_name au premier token. Application : à chaque écriture, on garantit
-- que la valeur stockée est déjà le prénom seul, pas "Prénom Nom".

CREATE OR REPLACE FUNCTION public.trim_display_name_to_first_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_name IS NOT NULL AND trim(NEW.display_name) LIKE '% %' THEN
    NEW.display_name := split_part(trim(NEW.display_name), ' ', 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_trim_display_name ON public.profiles;
CREATE TRIGGER profiles_trim_display_name
  BEFORE INSERT OR UPDATE OF display_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trim_display_name_to_first_token();
