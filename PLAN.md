# PLAN.md — Grint. Roadmap de Refactoring V2

## Vue d'ensemble

Refactoring progressif de l'app existante (React/JS/Vite) vers le nouveau design Figma, avec migration TypeScript et restructuration des composants. On part de la base existante (auth, Supabase, routing fonctionnels) et on transforme page par page.

---

## Phase 0 : Fondations (1-2 jours)

### 0.1 — Migration TypeScript
- [ ] Installer TypeScript + `@types/react` + `@types/react-dom`
- [ ] Ajouter `tsconfig.json` avec `strict: true`
- [ ] Renommer `main.jsx` → `main.tsx`, `App.jsx` → `App.tsx`
- [ ] Renommer tous les `.jsx` → `.tsx` un par un
- [ ] Créer `src/types/` avec les types de base (User, Workout, Exercise, etc.)
- [ ] Fixer les erreurs TypeScript page par page

### 0.2 — Restructuration des dossiers
- [ ] Créer l'arborescence cible :
  ```
  src/
  ├── components/ui/
  ├── components/layout/
  ├── components/features/
  ├── pages/
  ├── hooks/
  ├── lib/
  ├── types/
  └── styles/
  ```
- [ ] Déplacer `supabaseClient.js` → `src/lib/supabaseClient.ts`
- [ ] Déplacer `BottomNav.jsx` → `src/components/layout/TabBar.tsx`

### 0.3 — Configuration Tailwind V2
- [ ] Mettre à jour `tailwind.config.js` avec les nouveaux tokens :
  - Couleurs light : `bg-1`, `pr-1`, `tx-1`, `surface`, `border-light`
  - Couleurs dark : `dark-900`, `dark-800`, `dark-700`, `gold`
  - Couleur spéciale : `neon` (#D0FD3E)
- [ ] Ajouter les fonts : PT Serif, Figtree, Overused Grotesk
- [ ] Configurer les border-radius custom : `rounded-12` (12px), `rounded-16` (16px)

---

## Phase 1 : Design System & Layout (2-3 jours)

### 1.1 — Composants UI atomiques
Créer dans `src/components/ui/` :
- [ ] `Button.tsx` — Variantes : primary (dark bg + gold text), cta (gold bg + dark text), ghost
- [ ] `Badge.tsx` — Badge difficulté (DÉBUTANT, INTERMÉDIAIRE) avec fond semi-transparent
- [ ] `Card.tsx` — Container arrondi avec variantes light/dark
- [ ] `IconButton.tsx` — Boutons circulaires (play, back, close)
- [ ] `TabBar.tsx` — Bottom navigation 3 tabs avec état actif
  - Référence Figma : `216:413` (dans Home-Light-WithWorkout)

### 1.2 — Layouts
Créer dans `src/components/layout/` :
- [ ] `LightLayout.tsx` — Fond `#f1f4fb`, status bar dark, tab bar en bas
- [ ] `DarkLayout.tsx` — Fond `#0C0C0C`, status bar light, tab bar en bas
- [ ] `FullscreenLayout.tsx` — Pour le Workout Player (pas de tab bar)
- [ ] `ThemeProvider.tsx` — Context React pour switcher light/dark selon la route

### 1.3 — Composants features réutilisables
Créer dans `src/components/features/` :
- [ ] `CalendarWeek.tsx` — Bandeau calendrier 7 jours
  - Référence Figma : `216:426` (dans Home-Light-WithWorkout)
  - Props : `selectedDay`, `onSelectDay`, `workoutDays` (jours avec séance planifiée)
- [ ] `WorkoutCard.tsx` — Carte séance avec image, badge, play
  - Référence Figma : `212:1237` (composant Seances)
  - Props : `workout`, `onPlay`, `variant` (light/dark)
- [ ] `ExerciseRow.tsx` — Ligne d'exercice (numéro, nom, séries/reps, play)
  - Référence Figma : dans `272:453` (WorkoutDetail)
- [ ] `SessionHistoryCard.tsx` — Carte historique (nom, date, calories, PRs)
  - Référence Figma : dans `372:961` (SessionHistory)

---

## Phase 2 : Home & Navigation (2 jours)

### 2.1 — Routing
- [ ] Mettre à jour `App.tsx` avec les nouvelles routes :
  - `/` → redirect selon auth
  - `/login` → Login
  - `/home` → Home (tab Accueil)
  - `/programs` → Programme Hub
  - `/programs/:id` → Détail programme
  - `/workouts/:id` → Détail séance
  - `/community` → Communauté (placeholder)
  - `/profile` → Profil
  - `/profile/friends` → Amis
  - `/profile/friends/:id` → Profil ami
  - `/profile/history` → Historique
  - `/workout/:sessionId` → Workout Player (fullscreen)

### 2.2 — Page Home (Light)
- [ ] Refaire `Home.tsx` en mode light avec :
  - Header "Hello [prénom]"
  - `CalendarWeek` component
  - Bouton "Programmer mes séances" → `/programs`
  - "Séance du jour" avec `WorkoutCard` ou état vide
  - Carte "Un peu de bien-être ?" (stretch prompt)
- [ ] Référence Figma : `216:410` (avec workout) et `216:460` (vide)

### 2.3 — Page Login
- [ ] Refaire `Login.tsx` avec le nouveau design :
  - Background beige avec photo lifestyle (image de la fille au kettlebell)
  - Logo "grint." en PT Serif Bold italic
  - Texte d'accroche
  - Bouton "Continuer avec Google"
- [ ] Référence Figma : `345:1084`

---

## Phase 3 : Programme Hub (2-3 jours)

### 3.1 — Hub principal
- [ ] Créer `ProgramHub.tsx` (Light mode) :
  - Barre de recherche
  - Section "Programmes" (scroll horizontal de cartes programme)
  - Section "Toutes les séances" avec filtres (All, Haut du corps, Bas du corps, Abdo)
  - Liste verticale de `WorkoutCard`
- [ ] Référence Figma : `235:594`

### 3.2 — Détail programme
- [ ] Créer `ProgramDetail.tsx` :
  - Image hero + badge difficulté
  - Infos (fréquence, focus)
  - Liste des séances du programme avec `WorkoutCard`
- [ ] Référence Figma : `332:1540`

### 3.3 — Détail séance
- [ ] Créer `WorkoutDetail.tsx` avec deux variantes :
  - **Light** (depuis le hub) : bouton "Planifier cette séance"
  - **Dark** (depuis la home/lancement) : bouton "Commencer ma séance"
  - Image hero, badge, durée/exercices, liste `ExerciseRow`
- [ ] Références Figma : `324:570` (light) et `272:453` (dark)

### 3.4 — Logique de planification
- [ ] Intégrer la modale de sélection de jour
- [ ] Sauvegarder dans `workout_plan` (existant)
- [ ] Mettre à jour le `CalendarWeek` pour refléter les séances planifiées

---

## Phase 4 : Workout Player (3-4 jours) ⭐ COEUR DE L'APP

### 4.1 — Architecture d'état
- [ ] Créer `useWorkoutSession` hook :
  - État : exercices restants, exercice courant, série courante, données saisies
  - Actions : startExercise, validateSet, skipRest, finishWorkout
  - Gestion non-linéaire : l'utilisateur choisit l'ordre des exercices
- [ ] Créer `WorkoutSessionContext` pour partager l'état entre les sous-vues

### 4.2 — Vue liste d'exercices
- [ ] Refaire la vue globale des exercices :
  - Exercices restants cliquables (bouton play jaune)
  - Exercices terminés grisés
  - Bouton "Lancer l'exercice" en bas
- [ ] Référence Figma : `312:752`

### 4.3 — Vue saisie (poids/reps)
- [ ] Composant `NumberPicker.tsx` — Molette horizontale pour saisie tactile
  - Variante Poids (KG) : pas de 0.5 ou 1
  - Variante Reps : pas de 1
- [ ] Affichage : "Série X sur Y", nom de l'exercice, objectif ciblé
- [ ] Message motivant conditionnel ("Déjà 10 reps ? Augmente la charge !")
- [ ] Bouton "Valider ma série"
- [ ] Référence Figma : `235:705`

### 4.4 — Timer de repos
- [ ] Composant `RestTimer.tsx` avec Framer Motion :
  - Compte à rebours géant (style 2:26)
  - "Prépare-toi pour : [exercice suivant]"
  - Lien "Comment l'exécuter ?" (vidéo)
  - Bouton "Passer le repos"
  - Background glow/gradient subtil
- [ ] Référence Figma : `272:564`

### 4.5 — Récapitulatif
- [ ] Page `WorkoutRecap.tsx` :
  - Tableau par exercice : séries, poids, reps
  - Bouton "Terminer ma séance"
  - Sauvegarde dans `completed_workouts` + `user_progress`
  - Détection et notification des nouveaux PR
- [ ] Référence Figma : `332:1841`

---

## Phase 5 : Profil (2-3 jours)

### 5.1 — Profil personnel
- [ ] Refaire `Profile.tsx` (Dark mode) :
  - Avatar + nom éditable + icône crayon
  - Carte streak (flamme, X/52 semaines, checkmarks Lun-Dim)
  - Bloc "Amis" (lien vers liste) + "Record Personnel" (PR principal)
  - Onglets stats : Fréquence (calendrier), Record Personnel (courbe), Calories
  - Section "Dernière séance" + "Voir toutes"
  - Boutons "Réinitialiser mes données" + "Me déconnecter"
- [ ] Référence Figma : `319:1342` et `371:897`

### 5.2 — Liste d'amis
- [ ] Créer `FriendsList.tsx` :
  - Avatar, nom, statut ("Actuellement en séance" / "Dernière séance il y a X")
  - Badge streak (flamme avec nombre)
  - Bouton "+" pour ajouter
- [ ] Référence Figma : `383:1973`

### 5.3 — Profil ami
- [ ] Créer `FriendProfile.tsx` :
  - Même structure que profil perso mais en lecture seule
  - Affiche les séances en cours le cas échéant
- [ ] Référence Figma : `390:1107`

### 5.4 — Historique des séances
- [ ] Créer `SessionHistory.tsx` :
  - Liste chronologique des séances passées
  - Chaque carte : nom, date, durée, exercices, calories, PRs
- [ ] Référence Figma : `372:961`

---

## Phase 6 : Communauté — Placeholder (0.5 jour)

- [ ] Créer `Community.tsx` avec écran placeholder :
  - Message "Coming soon" ou aperçu statique du design
  - La route `/community` existe et le tab est fonctionnel
- [ ] Préparer la structure technique (tables BDD, types TS) pour plus tard
- [ ] Design final de référence : `427:1644`

---

## Phase 7 : Polish & QA (2 jours)

### 7.1 — Animations
- [ ] Transitions de page (Framer Motion)
- [ ] Animation du timer de repos (countdown fluid)
- [ ] Micro-interactions : boutons, cards, tabs
- [ ] Transition splash → home (premier login)

### 7.2 — Offline & Performance
- [ ] Vérifier que le mode offline fonctionne toujours
- [ ] Optimiser le chargement des images (lazy loading, blur placeholder)
- [ ] Tester la synchro Supabase après retour online

### 7.3 — Tests & Cleanup
- [ ] Supprimer tout le code legacy JSX non migré
- [ ] Vérifier la cohérence des couleurs/fonts sur tous les écrans
- [ ] Tester sur iPhone 16 Pro (402px) + autres tailles mobiles
- [ ] Vérifier les edge cases : pas de séance, pas d'amis, nouveau compte

---

## Estimation totale : ~15-18 jours de développement

| Phase | Durée estimée | Priorité |
|-------|--------------|----------|
| Phase 0 : Fondations | 1-2 jours | 🔴 Critique |
| Phase 1 : Design System | 2-3 jours | 🔴 Critique |
| Phase 2 : Home & Nav | 2 jours | 🔴 Critique |
| Phase 3 : Programme Hub | 2-3 jours | 🟡 Important |
| Phase 4 : Workout Player | 3-4 jours | 🔴 Critique |
| Phase 5 : Profil | 2-3 jours | 🟡 Important |
| Phase 6 : Communauté | 0.5 jour | 🟢 Low |
| Phase 7 : Polish | 2 jours | 🟡 Important |

---

## Comment utiliser ce plan avec Claude Code

1. Ouvre le projet dans Claude Code
2. Claude lira automatiquement le `CLAUDE.md` pour le contexte
3. Demande phase par phase : "On attaque la Phase 0.1 — Migration TypeScript"
4. Pour chaque composant UI, demande à Claude Code d'utiliser le MCP Figma :
   ```
   Utilise get_design_context avec fileKey="XMTeGCX6yPiARJ0Z5jyeUr" et nodeId="<NODE_ID>"
   pour extraire le design exact de ce composant
   ```
5. Valide visuellement chaque étape avant de passer à la suivante
