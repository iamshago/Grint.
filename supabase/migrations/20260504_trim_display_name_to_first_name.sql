-- Migration: 20260504_trim_display_name_to_first_name.sql
-- Raccourcit profiles.display_name au premier token (prénom) pour tous les
-- utilisateurs dont la valeur courante contient au moins un espace. On garde
-- intact ce qui est déjà à un seul mot (prénoms composés au tiret, surnoms…).

UPDATE public.profiles
SET display_name = split_part(trim(display_name), ' ', 1),
    updated_at = now()
WHERE display_name IS NOT NULL
  AND trim(display_name) LIKE '% %';
