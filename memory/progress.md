# Progression — Grint.

> État d'avancement du projet, mis à jour à chaque session Claude Code.
> Dernière MAJ : 2026-04-02

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

## Phase 7 — Polish & QA (en cours)
- [x] Review pixel-perfect Home vs Figma — aucune différence critique
- [x] Review pixel-perfect Profile vs Figma — aucune différence critique
- [x] Font Overused Grotesk chargée (CDN) + TabBar mise à jour
- [ ] Review pages restantes (Programs, Workout Player, Friends, Login)
- [ ] Animations finales
- [ ] Tests unitaires
- [ ] Optimisation performance (code splitting)
- [ ] Deploy Vercel production (token expiré, besoin re-auth)

## Pages implémentées (routes)
| Route | Fichier | Mode | État |
|-------|---------|------|------|
| /login | Login.tsx | Light | ✅ |
| /home | Home.tsx | Light | ✅ |
| /programs | Programs.tsx | Light | ✅ |
| /community | Community.tsx | Light | ✅ |
| /profile | Profile.tsx | Dark | ✅ |
| /profile/friends | Friends.tsx | Dark | ✅ |
| /profile/friends/:id | FriendProfile.tsx | Dark | ✅ |
| /profile/history | SessionHistory.tsx | Dark | ✅ |
| /workout/:id | WorkoutSession.tsx | Dark | ✅ |
