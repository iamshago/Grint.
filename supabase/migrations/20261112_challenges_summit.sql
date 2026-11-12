-- Défis « chacun pour soi » avec un sommet (Winter KikicacArc).
--
-- Kiki Avengers est un défi d'équipe : un objectif commun S × N × semaines.
-- Winter garde le même calcul de points (1 séance terminée = 1 pt, fenêtre
-- starts_at → min(maintenant, ends_at), à partir du joined_at de chacun) mais
-- chacun grimpe vers un sommet fixe, avec des paliers.
--
--  - summit_points : points du sommet (24 pour Winter). NULL = défi d'équipe
--    classique, l'app garde alors l'affichage de Kiki Avengers.
--  - milestones    : paliers intermédiaires, croissants (8 et 16 pour Winter).
--
-- Rejoindre avant starts_at est déjà possible : la policy
-- participants_insert_self ne regarde que auth.uid() = user_id, et le calcul
-- des points ignore tout ce qui précède starts_at.
--
-- Idempotent : rejouable sans effet de bord.

alter table public.challenges
  add column if not exists summit_points integer,
  add column if not exists milestones integer[] not null default '{}';

alter table public.challenges
  drop constraint if exists challenges_summit_points_positive;
alter table public.challenges
  add constraint challenges_summit_points_positive
  check (summit_points is null or summit_points > 0);

comment on column public.challenges.summit_points is
  'Points du sommet pour un défi individuel (Winter : 24). NULL = défi d''équipe.';
comment on column public.challenges.milestones is
  'Paliers intermédiaires en points, croissants (Winter : {8,16}).';
