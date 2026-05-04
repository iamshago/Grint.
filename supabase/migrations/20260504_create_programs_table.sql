-- Catalogue des programmes affichés sur /programs (carrousel "Programmes").
-- Remplace le tableau hardcodé qui vivait dans src/pages/Program.tsx.
CREATE TABLE IF NOT EXISTS public.programs (
  id text PRIMARY KEY,
  title text NOT NULL,
  difficulty text NOT NULL,
  frequency text NOT NULL,
  description text NOT NULL,
  image_url text,
  focus text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read programs" ON public.programs;
CREATE POLICY "Public read programs"
  ON public.programs
  FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS programs_display_order_idx
ON public.programs (display_order);
