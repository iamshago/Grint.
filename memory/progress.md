# Progression — Grint.

> État d'avancement du projet, mis à jour à chaque session Claude Code.
> Dernière MAJ : 2026-05-04

## Phase 0 — Setup & Préparation ✅
- [x] CLAUDE.md créé et complet
- [x] PLAN.md créé (roadmap 7 phases)
- [x] SETUP.md créé (guide de démarrage)
- [x] Subagents créés (5 agents spécialisés)
- [x] Système mémoire initialisé (decisions, patterns, progress)
- [x] Plugin Figma installé et fonctionnel
- [x] Migration TypeScript (.jsx → .tsx avec @ts-nocheck)
- [x] Restructuration dossiers (components/layout, hooks, lib, types)
- [x] Path alias @/ configuré (vite + tsconfig)
- [x] Design tokens Tailwind V2 (couleurs, fonts, border-radius)

## Phase 1 — Design System (partiel)
- [x] TabBar 3 tabs avec Framer Motion LayoutGroup (src/components/layout/TabBar.tsx)
- [x] Avatars system (src/lib/avatars.ts — 6 avatars avec getAvatarById)
- [ ] Button component générique
- [ ] Badge component
- [ ] Card component
- [ ] LightLayout / DarkLayout
- [ ] CalendarWeek (composant isolé)

## Phase 2 — Home & Navigation ✅
- [x] Home light avec calendrier semaine + séance du jour (src/pages/Home.tsx)
- [x] Routing 3 tabs (Accueil, Communauté, Profil)
- [x] Tab bar animation spring entre tabs, duration:0 intra-tab
- [x] Fix StrictMode double-render (useEffect pour prevActiveIndex ref)

## Phase 3 — Programme Hub ✅
- [x] Catalogue programmes (src/pages/Programs.tsx)
- [x] Détail programme
- [x] Détail séance
- [x] Planification (workout_plan table)

## Phase 4 — Workout Player ✅
- [x] WorkoutSession complet (src/pages/WorkoutSession.tsx)
- [x] Exercise list non-linéaire
- [x] Saisie poids/reps
- [x] Rest timer avec Framer Motion
- [x] Recap fin de séance

## Phase 5 — Profil (Dark) ✅
- [x] Profile complet avec stats, streak, PR, historique (src/pages/Profile.tsx)
- [x] Carte streak avec flamme SVG + checkboxes colorées par catégorie
- [x] Record personnel card (gradient, biceps icon, badge exercice)
- [x] Onglets Fréquence / Record personnel / Calories
- [x] Username edit popup avec vérification unicité Supabase
- [x] Liste amis (src/pages/Friends.tsx) avec streak badges
- [x] Profil ami (src/pages/FriendProfile.tsx) — 2 variantes :
  - Dernière séance classique (bg tx-1, calories/record bar)
  - Séance active (bordure dashed colorée par catégorie, glow, soft-light overlay)
- [x] Historique séances (src/pages/SessionHistory.tsx)

## Phase 5.5 — Hooks & Shared Logic
- [x] useStreak hook partagé (src/hooks/useStreak.ts)
  - Utilisé par Home, Profile, Friends, FriendProfile
  - Exports: useStreak(), computeStreakForUser(), CATEGORY_ACCENT, DAY_LABELS
- [x] Streak rule: semaines consécutives avec ≥1 upper ET ≥1 lower/bbl
- [x] Catégories: upper=#ffee8c, lower=#507fff, bbl=#ff63b3

## Phase 5.6 — Supabase
- [x] Tables profiles + friendships migrées en prod
- [x] RLS policies (public read profiles, self-write, friendship rules)
- [x] Functions: check_username_available(), search_users_by_username()
- [x] "Actuellement en séance" = completed_workout < 10 min (pas 2h)

## Phase 6 — Communauté ✅
- [x] Page Community (Figma node 427:1644) — Défis (carousel horizontal) + Feed (posts avec réactions)
- [x] Structure technique feed + défis (données mockées, prêt pour Supabase)
- [x] PlaceholderPage supprimé, route branchée dans App.tsx

## Phase 6 V2 — Communauté V2 (mai 2026) ✅
**Refonte complète de l'onglet (Figma 551:1854 / 553:2208 / 556:5995).**

### Base de données (Supabase migrations)
- [x] Table `exercise_pr_records` (cache PR par user × exercice) + RLS self
- [x] Table `posts` (type 'pr', payload jsonb) + RLS friend-or-self
- [x] Table `post_reactions` (4 emojis cumulables) + RLS visible-via-post
- [x] Table `challenges` (un seul actif V2, multi-actif V3) + RLS authenticated read
- [x] Table `challenge_participants` (jointure user × challenge) + RLS self insert/delete
- [x] Function `is_friend_or_self(uuid)` (security definer, search_path pinned)
- [x] Function + trigger `handle_user_progress_pr()` sur INSERT user_progress
- [x] Backfill historique du cache PR (29 records depuis 52 user_progress)
- [x] Vérification du trigger : INSERT qui dépasse max → 1 row dans posts ✓
- [x] Seed initial du défi `KikicacAvengers` (description copiée au caractère depuis Figma 556:5995)

### Code TS
- [x] Types : `Challenge`, `ChallengeParticipant`, `Post`, `PostReaction`, `PRPostPayload`, `ChallengeRanking`, `ChallengeProgress`
- [x] `formatRelativeTime` + `formatShortDate`/`formatLongDate` (UTC)
- [x] Hook `useActiveChallenge` (défi courant + isParticipant)
- [x] Hook `useChallengeProgress` (totalCompleted/totalGoal/ranking, fenêtre dynamique starts_at→min(now, ends_at))
- [x] Hook `useChallengeParticipation` (join/leave)
- [x] Hook `useFeed` + helper `togglePostReaction`

### Composants features
- [x] `ChallengeCard` — carte unique sur /community (avatars overlap +N badge, CTA Rejoindre/Déjà rejoint)
- [x] `FeedPostCard` — card simplifiée V2, badge valeur droit, réactions inline
- [x] `ReactionsModal` — portal, focus trap basique + ESC, groupé par emoji
- [x] `ChallengePodium` — 3 marches gold dégradées (ordre Figma 2|1|3)
- [x] `ParticipantRow` — ligne classement avec mini-badge rang
- [x] `ChallengeMenuSheet` — sheet "..." avec confirmation rouge

### Pages
- [x] `Community.tsx` — réécriture totale (carousel V1 → carte unique + feed PR)
- [x] `ChallengeDetail.tsx` (NEW) — header + carte progress + podium + classement
- [x] `ChallengeJoin.tsx` (NEW) — full-bleed photo hero + carte sticky + CTA

### Routing
- [x] App.tsx : 3 nouvelles routes branchées (placeholder 🚧 supprimé)
- [x] `/community/challenges` ajouté à HIDE_TABBAR_ROUTES

### QA pixel-perfect
- [x] /community @ 402×873 vs Figma 551:1854 — match
- [x] /community/challenges/:id @ 402×1018 vs Figma 553:2208 — match (correctif spacing header h:120 → h:144 pour libérer le sous-titre)
- [x] /community/challenges/:id/join @ 402×873 vs Figma 556:5995 — match

## Phase 7 — Polish & QA (en cours)
- [x] Review pixel-perfect Home vs Figma — aucune différence critique
- [x] Review pixel-perfect Profile vs Figma — aucune différence critique
- [x] Font Overused Grotesk chargée (CDN) + TabBar mise à jour
- [ ] Review pages restantes (Programs, Workout Player, Friends, Login)
- [ ] Animations finales
- [ ] Tests unitaires
- [ ] Optimisation performance (code splitting)
- [ ] Deploy Vercel production (token expiré, besoin re-auth)

## Round UX cleanup 2026-05-04 (Home, Programs, Friends)
- [x] Bug #1 — TabBar stable au lancement iOS Safari (`useHideMobileUrlBar` dans `App.tsx`, scroll-trick au mount)
- [x] Bug #2 — Bouton retour `/programs` aligné avec le titre dans le même flex row (plus de `position: fixed` désynchronisé)
- [x] Bug #3 — Cartes séance entièrement cliquables (`WorkoutCard` racine = `<button>` quand `onPlay`, rond play en `<div pointer-events-none>`)
- [x] Bug #4 — TabBar ne masque plus le bas du contenu : `LightLayout` sans `hideTabBar` sur `/programs` (active `pb-tabbar`), modale `previewProgram` portée via `createPortal` en `z-[9999]` avec `paddingBottom: env() + 140px`
- [x] Bug #5 — Gradient overlay haut (`fixed top-0`, hauteur `env() + 56px`, dégradé `bg-1` → transparent) sur la liste `/programs` + modales `previewProgram` et `previewWorkout` pour lisibilité du texte derrière la status bar pendant le scroll
- [x] Bug #6 — Avatars amis : helper `resolveAvatarSrc({ avatar_url, avatar_id })` (priorité `avatar_url > avatar_id > superman`), `avatar_url` ajoutée à toutes les requêtes Supabase de profils (`useCurrentUserProfile`, `useFeed`, `useChallengeProgress`, `Profile`, `Friends`, `FriendProfile`, `Community`), composants d'affichage migrés (`FeedPostCard`, `ParticipantRow`, `ChallengeCard`, `ReactionsModal`, `Friends`, `FriendProfile`, `Profile`)
- [x] `npx tsc --noEmit -p tsconfig.json` → 0 erreur

## Pages implémentées (routes)
| Route | Fichier | Mode | État |
|-------|---------|------|------|
| /login | Login.tsx | Light | ✅ |
| /home | Home.tsx | Light | ✅ |
| /programs | Programs.tsx | Light | ✅ |
| /community | Community.tsx | Light | ✅ V2 |
| /community/challenges/:id | ChallengeDetail.tsx | Light | ✅ V2 |
| /community/challenges/:id/join | ChallengeJoin.tsx | Light/Photo | ✅ V2 |
| /profile | Profile.tsx | Dark | ✅ |
| /profile/friends | Friends.tsx | Dark | ✅ |
| /profile/friends/:id | FriendProfile.tsx | Dark | ✅ |
| /profile/history | SessionHistory.tsx | Dark | ✅ |
| /workout/:id | WorkoutSession.tsx | Dark | ✅ |
