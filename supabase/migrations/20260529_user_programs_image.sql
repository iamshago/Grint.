-- Migration: 20260529_user_programs_image.sql
-- Feature « Mon programme dans le catalogue » — un programme perso peut avoir une
-- image de couverture (choisie dans une galerie de presets côté app) afin d'être
-- affiché dans le carrousel « Programmes » comme un programme du catalogue.

ALTER TABLE public.user_programs
  ADD COLUMN IF NOT EXISTS image_url TEXT;
