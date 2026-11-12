-- Seed du défi Winter KikicacArc (à appliquer après 20261112_challenges_summit.sql).
--
-- Règles tranchées le 12/11 (memory/decisions.md) :
--  - du lundi 16 novembre 2026 au 8 février 2027 inclus ;
--  - 1 séance terminée = 1 pt, rien d'autre ;
--  - sommet à 24 pts (2 séances par semaine), paliers à 8 et 16 ;
--  - les missions de la semaine ne donnent que des médailles.
--
-- Dates en UTC « minuit Z », comme Kiki Avengers : formatShortDate lit la date
-- en UTC (« 16 nov. », « 8 févr. »). À Paris, le défi s'ouvre donc à 1 h du
-- matin le 16 et se ferme à 0 h 59 le 9.
--
-- On peut rejoindre dès que la ligne existe (is_active = true) : l'app affiche
-- « Dès le 16 nov. » et tout le monde reste à 0 pt jusqu'au 16.
--
-- useActiveChallenge prend le défi actif au starts_at le plus récent : Winter
-- remplace Kiki Avengers sur la page Communauté dès ce seed.
--
-- Idempotent : n'insère rien si le défi existe déjà.

insert into public.challenges (
  name, description, hero_image_url, cover_image_url,
  starts_at, ends_at, sessions_per_week_per_member, is_active,
  summit_points, milestones
)
select
  'Winter KikicacArc',
  '1 séance = 1 pt du 16 novembre au 8 février. Sommet à 24 pts, soit 2 séances par semaine.',
  '/assets/challenges/winter-hero.jpg',
  '/assets/challenges/winter-carte.jpg',
  '2026-11-16T00:00:00Z',
  '2027-02-08T23:59:59Z',
  2,
  true,
  24,
  '{8,16}'
where not exists (
  select 1 from public.challenges where name = 'Winter KikicacArc'
);
