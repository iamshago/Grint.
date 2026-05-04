# Brief Claude Code — Refonte onglet Communauté V2

> Brief préparé par Pestakle (Cowork) pour Claude Code.
> File Figma : `XMTeGCX6yPiARJ0Z5jyeUr`
> Date : 2026-05-04

---

## 1. Objectif

Refondre l'onglet **Communauté** de Grint pour passer de la V1 mockée (3 défis carousel + posts manuels) à une V2 fonctionnelle :

1. **Un seul défi actif** mis en avant sur la page Communauté avec progression d'équipe en temps réel.
2. **Feed automatique** alimenté par les PR de l'utilisateur et de ses amis directs (aucune saisie manuelle).
3. **Réactions** persistées en base avec liste des réacteurs cliquable.
4. **Pages de détail défi** : transition "Rejoindre" + détail "Déjà rejoint" avec podium + classement.

La page `/community` est actuellement un placeholder dans `App.tsx` (lignes 123-130). Le composant `src/pages/Community.tsx` existe mais correspond à l'ancien design (à remplacer entièrement).

---

## 2. Designs Figma à implémenter

| Page | Node ID | Mode | Route cible |
|------|---------|------|-------------|
| Communauté (feed + carte défi) | `551:1854` | Light | `/community` |
| Rejoindre le défi (transition) | `556:5995` | Dark/Photo | `/community/challenges/:id/join` |
| Détail défi (déjà rejoint) | `553:2208` | Light | `/community/challenges/:id` |

> Pour chaque écran, Claude Code DOIT exécuter le workflow `figma-implement-design` complet : `get_design_context` → `get_screenshot` → assets → adapter aux conventions projet → vérifier en jeu des 7 différences (cf. `CLAUDE.md`).

---

## 3. Spécifications fonctionnelles par page

### 3.1 Page Communauté (`/community` — node `551:1854`)

**Layout (light mode, fond `bg-1` `#f1f4fb`)** :
- Titre `Communauté` (PT Serif Bold 32px) — header standard de l'app
- Sous-titre `Défis` (PT Serif Bold 24px)
- **UNE seule carte défi** (plus de carousel) :
  - Fond blanc, `rounded-[16px]`, padding interne
  - Top-left : nom du défi (`KikicacAvengers`) en PT Serif Bold 20px
  - Top-right : `Jusqu'au 4 juil.` (mention de la date de fin courte)
  - Sous le nom : `20 séances par semaine` — calculé dynamiquement (cf §5)
  - Barre de progression jaune (`#ffee8c`) sur fond gris (`surface`/`#e6e8ed`)
  - Bottom-left : avatars des participants overlappants — **3 max + badge `+N`** si plus
  - Bottom-right : CTA `Rejoindre` (bg `#1f2021`, texte `#ffee8c`, `rounded-[12px]`). Si l'utilisateur a déjà rejoint → CTA grisé `Déjà rejoint`, non-cliquable
  - **Toute la carte est cliquable** :
    - Si pas rejoint → navigate vers `/community/challenges/:id/join`
    - Si rejoint → navigate vers `/community/challenges/:id`
- Sous-titre `Tous les posts` (PT Serif Bold 24px)
- Liste de posts (cards blanches simplifiées) — cf §3.4

**Règles** :
- S'il n'y a aucun défi actif en base, masquer la section "Défis" (titre + carte).
- La carte ne change PAS de couleur en mode BBL (l'easter egg BBL ne s'applique qu'aux séances).

### 3.2 Page Rejoindre (`/community/challenges/:id/join` — node `556:5995`)

**Layout (full-screen)** :
- Photo hero immersive en background (champ `challenges.hero_image_url`)
- Top-left : bouton retour (cercle blanc, `←`)
- Carte sticky en bas (fond `#1f2021` ou équivalent dark, `rounded-t-[24px]`) :
  - Nom du défi (PT Serif Bold blanc)
  - Description (Figtree régulier, blanc, plusieurs lignes) — texte dynamique tiré de `challenges.description`. Exemple :
    > "Vous devez réaliser en équipe une moyenne de 2 séances par semaine chacun jusqu'au 4 juillet pour réussir ce défi."
  - CTA `Rejoindre vos amis` (bg `#ffee8c`, texte `#1f2021`, full-width, `rounded-[16px]`)

**Comportement** :
- Au clic sur le CTA → INSERT dans `challenge_participants`, puis navigate vers `/community/challenges/:id` (la page détail). Il ne faut JAMAIS revenir sur cette page Join une fois le défi rejoint.
- Pas de TabBar visible ici (full-screen photo).
- Bouton retour → navigate(-1).

### 3.3 Page Détail défi (`/community/challenges/:id` — node `553:2208`)

**Layout (light mode)** :
- Top bar : bouton retour (cercle blanc) à gauche, titre `Défis` centré + sous-titre `20 séances par semaine` (dynamique), menu `...` à droite
- Menu `...` ouvre un sheet/popover avec une seule action : `Quitter le défi` (rouge). Confirmation modale obligatoire avant DELETE de la participation. Source unique pour quitter — pas d'autre point d'entrée pour éviter les sorties accidentelles.
- Carte progression (fond `#1f2021`, texte clair) :
  - Nom du défi (PT Serif Bold)
  - Compteur `28/124` aligné à droite du nom (gold `#ffee8c`)
  - Barre de progression jaune
  - Ligne d'aide avec icône `i` : `"Attention, le nombre à atteindre change selon le nombre de participants au défi !"`
- Carte podium (fond `#1f2021`) :
  - 3 colonnes/marches gold gradient (positions 1/2/3)
  - Chaque marche affiche le numéro géant (1, 2, 3)
  - Au-dessus de chaque marche : prénom (PT Serif Bold) + badge `X pts` (pilule jaune)
  - Hauteurs des marches : 1ère > 2ème > 3ème
  - Si <3 participants → afficher uniquement les marches occupées
- Liste classement (cards blanches) — un participant par ligne :
  - Avatar circulaire avec mini-badge rang en bas-gauche (`1`, `2`, `3`, ...)
  - Nom (PT Serif Bold) + `X.X séances par semaine` (Figtree, gris)
  - Badge pts à droite (pilule jaune `#ffee8c`)
  - Tri par `pts` desc

**Comportement** :
- TabBar **non visible** sur cette page (ajouter `/community/challenges` dans `HIDE_TABBAR_ROUTES` de `App.tsx`).
- Si `:id` invalide ou défi inexistant → redirect vers `/community`.

### 3.4 Cards de post du feed (commun à 3.1)

Les cards sont **simplifiées** par rapport à l'actuel `Community.tsx` :
- Card blanche `rounded-[12px]`, `border-[1.5px]` blanche
- Avatar à gauche (cercle 48px)
- Nom (PT Serif Bold 20px) + horodatage relatif (`Il y a 3 heures`)
- Contenu textuel sur 1 ligne : `À passé la barre des <strong>40kg</strong> au <strong>Bench</strong>.`
- Badge valeur à droite (pilule jaune `bg-[#ffee8c]`, `rounded-[8px]`, ex. `40kg`)
- Plus de cercle décoratif ni d'emoji 🎉 dans la card (épurée par rapport à V1)
- **Sous chaque card** :
  - 4 boutons réaction (carrés blancs `rounded-[8px]`, border `bg-2`) : `❤️ 😂 😲 🔥`
  - L'emoji actif (déjà liké par self) a un fond gris/bg-2 plein
  - Ligne `Aimé par <strong>Lucas</strong> et <strong>d'autres personnes</strong>` avec mini-avatar 24px à gauche
  - **Au clic sur la ligne "Aimé par"** ou sur les mini-avatars → ouvre une modale listant TOUS les utilisateurs ayant réagi, groupés par emoji (cf §6).

**Templates de message par type de post** (V2 = uniquement `'pr'`) :
- `À passé la barre des <strong>{weight}kg</strong> au <strong>{exercise_name}</strong>.`
- Badge valeur = `{weight}kg`

---

## 4. Modèle de données — Migrations Supabase à créer

> Tables déjà présentes en prod (à NE PAS toucher) : `profiles`, `friendships` (status `pending|accepted|rejected`), `user_progress` (52 rows, contient `weight_used`, `reps_done`, `exercise_id`, `user_id`, `created_at`), `completed_workouts`, `workouts`, `exercises`, `workout_exercises`, `workout_plan`.

### 4.1 Cache des records (`exercise_pr_records`)

Permet d'éviter de recalculer le PR à chaque insert dans `user_progress`.

```sql
create table public.exercise_pr_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  best_weight numeric not null,
  achieved_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);
create index exercise_pr_records_user_idx on public.exercise_pr_records(user_id);

-- Backfill depuis l'historique existant (sinon les premières séries après deploy
-- seraient considérées comme "premier PR" et ne posteraient rien — ok — mais
-- toute série suivante créerait un faux PR si elle dépasse cet ancien max non
-- enregistré). On amorce le cache pour éviter ça.
insert into public.exercise_pr_records (user_id, exercise_id, best_weight, achieved_at)
select user_id, exercise_id, max(weight_used), max(created_at)
from public.user_progress
where weight_used is not null
group by user_id, exercise_id
on conflict (user_id, exercise_id) do nothing;
```

### 4.2 Posts du feed (`posts`)

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('pr')), -- structure ouverte pour V3
  payload jsonb not null,
  -- Pour 'pr' : { exercise_id, exercise_name, weight, previous_weight }
  created_at timestamptz not null default now()
);
create index posts_user_created_idx on public.posts(user_id, created_at desc);
create index posts_created_idx on public.posts(created_at desc);
```

### 4.3 Réactions (`post_reactions`)

```sql
create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('❤️','😂','😲','🔥')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);
create index post_reactions_post_idx on public.post_reactions(post_id);
```

> Une même personne peut cumuler plusieurs emojis sur un même post (ex. `❤️` + `🔥`). L'unique est sur `(post_id, user_id, emoji)`.

### 4.4 Défis (`challenges` + `challenge_participants`)

```sql
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  hero_image_url text, -- photo full-bleed page Join
  cover_image_url text, -- visuel optionnel pour la carte sur /community
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  sessions_per_week_per_member integer not null default 2,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index challenges_active_idx on public.challenges(is_active, starts_at);

create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);
create index challenge_participants_challenge_idx on public.challenge_participants(challenge_id);
```

> **V2 = un seul défi actif à un instant T.** Côté code, fetch `is_active=true` ordonné par `starts_at desc`, prendre le premier. Garder cette tolérance "plusieurs en théorie" en base pour la V3.

### 4.5 Trigger PR auto-post

Au moindre `INSERT` dans `user_progress`, on vérifie si on bat le record :
- Si **pas de record précédent** (premier set sur cet exo) → on enregistre le record dans le cache, **sans poster** (règle utilisateur : pas de post sur les premières fois).
- Si **on bat le record** → on update le cache **et** on insère un post de type `pr`.
- Sinon, on ne fait rien.

```sql
create or replace function public.handle_user_progress_pr()
returns trigger
language plpgsql
security definer
as $$
declare
  prev_best numeric;
  v_exercise_name text;
begin
  if new.weight_used is null then
    return new;
  end if;

  select best_weight into prev_best
  from public.exercise_pr_records
  where user_id = new.user_id and exercise_id = new.exercise_id;

  if prev_best is null then
    -- Première fois : on enregistre le record, pas de post
    insert into public.exercise_pr_records (user_id, exercise_id, best_weight, achieved_at)
    values (new.user_id, new.exercise_id, new.weight_used, new.created_at)
    on conflict (user_id, exercise_id) do nothing;
  elsif new.weight_used > prev_best then
    -- On bat le record : update + post
    update public.exercise_pr_records
    set best_weight = new.weight_used, achieved_at = new.created_at
    where user_id = new.user_id and exercise_id = new.exercise_id;

    select name into v_exercise_name from public.exercises where id = new.exercise_id;

    insert into public.posts (user_id, type, payload, created_at)
    values (
      new.user_id,
      'pr',
      jsonb_build_object(
        'exercise_id', new.exercise_id,
        'exercise_name', v_exercise_name,
        'weight', new.weight_used,
        'previous_weight', prev_best
      ),
      new.created_at
    );
  end if;

  return new;
end;
$$;

create trigger trg_user_progress_pr
after insert on public.user_progress
for each row execute function public.handle_user_progress_pr();
```

### 4.6 Helper `is_friend_or_self` + RLS

```sql
create or replace function public.is_friend_or_self(target_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select
    auth.uid() = target_user_id or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = target_user_id)
        or (f.addressee_id = auth.uid() and f.requester_id = target_user_id)
      )
    );
$$;

-- posts
alter table public.posts enable row level security;
create policy posts_select_friends on public.posts
  for select using (public.is_friend_or_self(user_id));
create policy posts_insert_self on public.posts
  for insert with check (auth.uid() = user_id);

-- post_reactions
alter table public.post_reactions enable row level security;
create policy reactions_select_visible on public.post_reactions
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = post_reactions.post_id
      and public.is_friend_or_self(p.user_id)
    )
  );
create policy reactions_insert_self on public.post_reactions
  for insert with check (auth.uid() = user_id);
create policy reactions_delete_self on public.post_reactions
  for delete using (auth.uid() = user_id);

-- exercise_pr_records (privé : seulement l'utilisateur lui-même)
alter table public.exercise_pr_records enable row level security;
create policy pr_records_self on public.exercise_pr_records
  for select using (auth.uid() = user_id);

-- challenges (lecture publique pour tout user authentifié)
alter table public.challenges enable row level security;
create policy challenges_select_all on public.challenges
  for select using (auth.uid() is not null);

-- challenge_participants (lecture publique, écriture self uniquement)
alter table public.challenge_participants enable row level security;
create policy participants_select_all on public.challenge_participants
  for select using (auth.uid() is not null);
create policy participants_insert_self on public.challenge_participants
  for insert with check (auth.uid() = user_id);
create policy participants_delete_self on public.challenge_participants
  for delete using (auth.uid() = user_id);
```

---

## 5. Logique de calcul du défi

### Variables
- `N` = nombre de participants actuels (count de `challenge_participants`)
- `S` = `challenge.sessions_per_week_per_member` (2 par défaut)
- `W_total` = nombre de semaines totales du défi = `ceil((ends_at - starts_at) / 7 jours)`
- `W_elapsed` = nombre de semaines écoulées depuis `starts_at` (clamp à `[0, W_total]`)

### Affichage
- Carte sur `/community` : `"{S × N} séances par semaine"` (ici 20 si S=2, N=10)
- En sous-titre `/community/challenges/:id` : même formule
- Total à atteindre : `total = S × N × W_total` (ex. 124)
- Total réalisé : somme des `completed_workouts` de TOUS les participants entre `starts_at` et `min(now(), ends_at)` (le travail d'équipe : tout compte au pot commun, peu importe qui fait combien)
- Compteur affiché : `"{réalisé}/{total}"` (ex. `28/124`)
- Barre de progression : `réalisé / total` (clamp 0..1)

### Classement individuel (podium + liste)
- `pts` d'un participant = nombre de `completed_workouts` qu'il a faites entre `joined_at` et `min(now(), ends_at)`
- `séances_par_semaine` d'un participant = `pts / max(1, semaines_écoulées_depuis_joined_at)` (formaté `X.X`)
- Tri descendant par `pts`, top 3 sur podium, reste en liste classique

### Si un participant rejoint en cours de défi
- L'objectif total **augmente** automatiquement (formule recalculée avec le nouveau N)
- Sa barre de progression individuelle commence à 0
- L'objectif global se rééquilibre — c'est explicitement annoncé via la ligne d'info `Attention, le nombre à atteindre change selon le nombre de participants au défi !` sur la page détail

> ⚠️ Tu peux centraliser ces calculs dans un hook `useChallengeProgress(challengeId)` pour éviter la duplication entre la carte `/community` et la page détail.

---

## 6. Hooks et composants à créer

### Hooks (`src/hooks/`)
- `useActiveChallenge()` → retourne le défi actif courant (1er de `is_active=true`) + `isParticipant`
- `useChallengeProgress(challengeId)` → calcule total/réalisé/par-membre, retourne aussi le classement trié
- `useChallengeParticipation(challengeId)` → expose `join()` et `leave()` (mutations Supabase)
- `useFeed()` → fetch les posts visibles (RLS-filtered) ordonnés par `created_at desc`
- `usePostReactions(postId)` → toggle réaction + liste des réacteurs groupés par emoji

### Composants features (`src/components/features/`)
- `ChallengeCard.tsx` (carte sur `/community`) — props : `challenge`, `isParticipant`, `progress`
- `ChallengePodium.tsx` (3 marches gold) — props : `top3` array de participants
- `ParticipantRow.tsx` (carte classement) — props : `rank`, `participant`, `pts`, `sessionsPerWeek`
- `FeedPostCard.tsx` (à RÉÉCRIRE depuis l'actuel — design simplifié) — props : `post`, `currentUserReactions`
- `ReactionsModal.tsx` (modale au clic sur "Aimé par") — props : `postId`, `onClose`. Affiche les réacteurs groupés par emoji avec leur avatar+nom
- `ChallengeMenuSheet.tsx` (sheet/popover du `...`) — props : `challengeId`, ouvre la confirmation `Quitter`

### Pages (`src/pages/`)
- `Community.tsx` — RÉÉCRIRE entièrement (le fichier actuel correspond à l'ancien design carousel)
- `ChallengeJoin.tsx` (NEW) — page transition full-bleed
- `ChallengeDetail.tsx` (NEW) — page détail avec podium + classement

### Routing (`src/App.tsx`)
1. Remplacer le placeholder `🚧` (lignes 123-130) par `<Route path="/community" element={<Community />} />`
2. Ajouter :
   ```tsx
   <Route path="/community/challenges/:id" element={<ChallengeDetail />} />
   <Route path="/community/challenges/:id/join" element={<ChallengeJoin />} />
   ```
3. Ajouter `/community/challenges` à `HIDE_TABBAR_ROUTES` (la page join est plein écran, et la page détail n'a pas de TabBar non plus d'après le design).
4. Importer `Community`, `ChallengeJoin`, `ChallengeDetail`.

### Types (`src/types/index.ts`)
Ajouter :
```ts
export interface Challenge {
  id: string
  name: string
  description: string
  hero_image_url: string | null
  cover_image_url: string | null
  starts_at: string
  ends_at: string
  sessions_per_week_per_member: number
  is_active: boolean
}

export interface ChallengeParticipant {
  id: string
  challenge_id: string
  user_id: string
  joined_at: string
  profile?: { display_name: string | null; avatar_id: string | null; username: string | null }
}

export interface PostReaction {
  id: string
  post_id: string
  user_id: string
  emoji: '❤️' | '😂' | '😲' | '🔥'
  created_at: string
}

export interface PRPostPayload {
  exercise_id: string
  exercise_name: string
  weight: number
  previous_weight: number | null
}

export interface Post {
  id: string
  user_id: string
  type: 'pr'
  payload: PRPostPayload
  created_at: string
  profile?: { display_name: string | null; avatar_id: string | null; username: string | null }
  reactions?: PostReaction[]
}
```

---

## 7. Règles UX et edge cases

- **Post-clic carte défi** : la nav dépend de `isParticipant`. Pas de modale intermédiaire si déjà rejoint.
- **CTA "Déjà rejoint"** : non-cliquable (cursor not-allowed, opacité 60%, pas d'action `onClick`). La sortie ne passe que par les `...` de la page détail.
- **Confirmation Quitter** : modale standard `Quitter le défi ?` / `Annuler` / `Quitter` (rouge). Au confirm → DELETE participation + navigate `/community`.
- **Avatars participants sur la carte** : `min(participants.length, 3)` mini-avatars overlap (z-index décroissant) + badge `+{N-3}` si `N > 3`. Si `N == 0` → afficher uniquement l'avatar de l'utilisateur courant si participant, sinon rien.
- **Empty states** :
  - Aucun post visible → "Tes amis n'ont pas encore battu de records, accroche-toi à ton banc 💪" (placeholder textuel sobre).
  - Aucun défi actif → masquer toute la section Défis (titre + carte).
- **Modale réacteurs** : groupée par emoji, chaque section affiche les avatars+pseudos. Tap sur un avatar → navigate vers `/profile/friends/:userId` si c'est un ami, ne rien faire sinon.
- **Format relatif de l'horodatage** : utiliser le format actuel de l'app (`Il y a 3 heures`, `Il y a 2 jours`...). Centraliser dans `src/lib/formatRelativeTime.ts` si pas déjà fait.
- **Accessibilité** : aria-labels sur chaque bouton réaction (`Réagir avec ❤️`), modale réacteurs avec focus trap + ESC pour fermer.

---

## 8. Ordre d'implémentation suggéré

1. **Migrations Supabase** (§4) — appliquer via `mcp__supabase__apply_migration` ou MCP Supabase. Vérifier le backfill `exercise_pr_records`. Tester le trigger en insérant manuellement un row dans `user_progress` qui dépasse l'ancien max → vérifier qu'un row apparaît dans `posts`.
2. **Types TS** (§6) + hooks (§6) — pas de UI, juste la couche data.
3. **Page Communauté** (§3.1) — refonte complète de `Community.tsx`. Card défi + feed simplifié + branchement route.
4. **Page Détail défi** (§3.3) — podium + classement, hooks réutilisés.
5. **Page Join** (§3.2) — la plus simple, en dernier.
6. **Modale réacteurs** (§3.4 + §6) — branchement final sur les cards de post.
7. **QA pixel-perfect** : appliquer le protocole "jeu des 7 différences" de `CLAUDE.md` pour CHACUNE des 3 pages avant de considérer le terminé.

---

## 9. Décisions validées par Pestakle (verrouillées)

Tout ce qui suit a été tranché avant remise du brief — Claude Code applique tel quel, **sans re-poser** ces questions :

1. **Système de pts du podium** : `1 séance complétée = 1 pt`. Calcul : `pts = nombre de completed_workouts pendant la fenêtre du défi`. Moyenne hebdo affichée = `pts / max(1, semaines_écoulées_depuis_joined_at)`.
2. **Photo hero du défi `KikicacAvengers`** : déjà déposée par l'utilisateur dans `public/assets/challenges/kikicac-hero.jpg`. Path à utiliser dans le seed.
3. **Date de début du défi** : `2026-05-04T00:00:00Z` (aujourd'hui, lundi). Date de fin : `2026-07-04T23:59:59Z`.
4. **Seed du défi initial** — SQL à exécuter après les migrations. Le texte de la `description` doit être **strictement identique** à ce que Claude Code lit via `get_design_context` sur le node Figma `556:5995` (page Rejoindre) — pas de reformulation, pixel-perfect compris pour le wording :
   ```sql
   insert into public.challenges (
     name, description, hero_image_url,
     starts_at, ends_at, sessions_per_week_per_member, is_active
   )
   values (
     'KikicacAvengers',
     -- ⚠️ Texte EXACT du node Figma 556:5995, copié au caractère près
     '<description copiée depuis le Figma — node 556:5995>',
     '/assets/challenges/kikicac-hero.jpg',
     '2026-05-04T00:00:00Z',
     '2026-07-04T23:59:59Z',
     2,
     true
   );
   ```
5. **Liste d'emojis de réaction** : 4 emojis — `❤️ 😂 😲 🔥`. Confirmé identique à la V1.
6. **PR : poids uniquement** (pas reps, pas de fin de séance, pas de "première fois"). Le trigger ne regarde QUE `weight_used`.
7. **Réactions cumulables** : un même utilisateur peut activer plusieurs emojis sur un même post (ex. `❤️` + `🔥`). UNIQUE sur `(post_id, user_id, emoji)` comme défini en §4.3.
8. **TabBar masquée** sur `/community/challenges/:id` ET `/community/challenges/:id/join`. Ajouter `/community/challenges` à `HIDE_TABBAR_ROUTES` dans `App.tsx`.
9. **Sortie d'un défi uniquement via le menu `...`** de la page détail, avec modale de confirmation rouge. Pas d'autre point d'entrée pour quitter (anti-abandon accidentel).
10. **Source de vérité visuelle** : pixel-perfect strict sur les 3 pages. Tout texte affiché présent dans le Figma (titre, sous-titre, description, ligne d'aide, label CTA…) doit être copié au caractère près depuis `get_design_context`. Les valeurs dynamiques (nb participants, total, pts, séances/sem) sont calculées à partir des données réelles, mais leurs formats (`28/124`, `23 pts`, `2,3 séances par semaine`, `Jusqu'au 4 juil.`) doivent matcher le formatage Figma.

---

## 10. Mémoire à mettre à jour après implémentation

Au moment du commit final, ajouter une entrée dans `memory/decisions.md` :

```
### 2026-05-XX — Communauté V2 : feed PR auto + défi unique avec podium
**Contexte** : Refonte de l'onglet Communauté V1 (mock 3 défis carousel + posts manuels) vers V2 fonctionnelle
**Décision** :
- Trigger Postgres sur user_progress → posts auto de type 'pr' (poids battu uniquement)
- Cache exercise_pr_records pour éviter de recalculer + éviter post sur premier PR
- Un seul défi actif à un instant T (mais schéma multi-défis pour V3)
- Réactions stockées (post_reactions), modale au clic "Aimé par"
- Sortie défi uniquement via "..." de la page détail (anti abandon accidentel)
**Alternative rejetée** : Recalcul applicatif des PR à chaque save de set — trop fragile, court-circuitable côté client
```

Mettre à jour `memory/progress.md` Phase 6 → ajouter une section "V2 (mai 2026)" avec les checkboxes correspondantes.
