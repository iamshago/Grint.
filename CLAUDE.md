# CLAUDE.md — Grint. (Training App V2)

## Projet
**Grint.** est un "Daily Coach" mobile-first axé sur l'hypertrophie, la surcharge progressive et la gamification. L'app permet de planifier ses séances, suivre ses performances (PR, calories, fréquence) et interagir avec une communauté de sportifs.

**Anciens noms :** VitalOS → Grint

---

## Prérequis & Plugin Figma

### Plugin Figma pour Claude Code (obligatoire)
Le plugin officiel Figma doit être installé :
```bash
claude plugin install figma@claude-plugins-official
```

Ce plugin fournit le MCP server Figma + les skills suivants :
- **`figma-implement-design`** — Workflow structuré en 7 étapes pour implémenter un design Figma avec fidélité 1:1
- **`figma-create-design-system-rules`** — Génère des règles de design system adaptées au projet

### Première utilisation
Avant de coder le premier écran, lancer le skill `figma-create-design-system-rules` avec :
- `clientLanguages` : `"typescript,javascript"`
- `clientFrameworks` : `"react"`
- Analyser la codebase pour détecter les patterns existants
- Sauvegarder les règles générées dans ce fichier ou dans `.claude/rules/`

### Fichier Figma
- **URL** : `https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/`
- **Seuls les écrans nommés sans préfixe "OLD-"** sont à implémenter
- Les écrans préfixés "OLD-" sont des itérations obsolètes à ignorer
- Voir la table des node-ids dans la section "Références Figma" ci-dessous

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Framework | React 19 + Vite 7 |
| Langage | **TypeScript (.tsx)** — migration depuis JSX en cours |
| Routing | React Router 7 (App Router pattern) |
| Styling | Tailwind CSS 3.4 |
| Animations | Framer Motion (timer repos, transitions exercices) |
| Auth & BDD | Supabase (Google OAuth + PostgreSQL) |
| Icônes | Lucide React |
| Graphiques | Recharts |
| Déploiement | Vercel |

---

## Design System (extrait du Figma)

### Thème Dual (Light + Dark)

L'app utilise un **thème mixte** selon les sections :

| Section | Mode | Background | Accent |
|---------|------|------------|--------|
| Home | Light | `#f1f4fb` (bg-1) | `#ffee8c` (pr-1) |
| Programme Hub | Light | `#f1f4fb` | `#ffee8c` |
| Communauté | Light | `#f1f4fb` | `#ffee8c` |
| Login | Light | Fond beige/photo | `#ffee8c` |
| Profil | Dark | `#0C0C0C` | `#ffee8c` (gold) |
| Workout Player | Dark | `#0C0C0C` / `#1C1C1E` | `#ffee8c` |
| Splash Welcome | Accent | `#D0FD3E` (néon vert) | noir |

### Couleurs

```
/* Light mode */
--bg-1: #f1f4fb;          /* fond principal light */
--pr-1: #ffee8c;          /* accent jaune/or (boutons, badges) */
--tx-1: #1b1d1f;          /* texte principal */
--tx-secondary: #9ca3b0;  /* texte inactif (tabs, labels) */
--surface: #e6e8ed;        /* cartes calendrier, surfaces light */
--dark-text: #1f2021;      /* texte fort, calendrier selected bg */
--border-light: #e6e8ed;   /* bordures light */

/* Dark mode */
--dark-900: #0C0C0C;       /* fond principal dark */
--dark-800: #1C1C1E;       /* cartes dark */
--dark-700: #2C2C2E;       /* bordures dark */
--gold: #ffee8c;            /* accent en dark mode */
--neon: #D0FD3E;            /* splash screen uniquement */
--text-light: #f1f4fb;      /* texte sur fond dark */
```

### Typographies

| Usage | Font | Weight |
|-------|------|--------|
| Logo "grint." | PT Serif | Bold, italic |
| Titres (h1, h2) | PT Serif | Bold |
| Body, labels, data | Figtree | Regular / SemiBold / Bold |
| Tab bar labels | Overused Grotesk | Medium |
| Système (heure) | SF Pro | Semibold |

### Composants Communs

- **Calendrier semaine** : 7 blocs `rounded-[12px]`, jour sélectionné = fond `#1f2021` + texte `#ffee8c`
- **Carte séance** : `rounded-[16px]`, image de fond avec gradient gauche, badge difficulté (`DÉBUTANT`/`INTERMÉDIAIRE`), bouton play jaune
- **Bottom Tab Bar** : 3 tabs (Accueil, Communauté, Profil), active = `#1f2021`, inactive = `#9ca3b0`
- **Bouton principal** : fond `#1f2021` + texte `#ffee8c`, `rounded-[12px]`, `p-[16px]`
- **Bouton CTA séance** : fond `#ffee8c` + texte `#1f2021`, full-width, `rounded-[16px]`
- **Badge difficulté** : `bg-[rgba(255,238,140,0.25)]` + border `#ffee8c`, texte uppercase

---

## Architecture des Pages & Navigation

```
/ (redirect → /login ou /home selon auth)
├── /login                    → Login (Google OAuth)
├── /splash                   → Splash "Bonjour [nom]" (après 1ère connexion)
├── /home                     → [TAB] Accueil (calendrier + séance du jour)
│   └── /programs             → Hub de programmation (recherche + catalogue)
│       ├── /programs/:id     → Détail d'un programme (liste des séances)
│       └── /workouts/:id     → Détail d'une séance (exercices + planifier)
├── /community                → [TAB] Communauté (défis + feed) [PLACEHOLDER]
├── /profile                  → [TAB] Profil (stats, PR, historique, paramètres)
│   ├── /profile/friends      → Liste d'amis
│   ├── /profile/friends/:id  → Profil d'un ami
│   └── /profile/history      → Historique complet des séances
└── /workout/:sessionId       → Workout Player (fullscreen, hors tab bar)
    ├── (exercise-list)       → Liste des exercices (non-linéaire)
    ├── (input)               → Saisie poids/reps (molettes)
    ├── (rest-timer)          → Timer de repos
    └── (recap)               → Récapitulatif fin de séance
```

### Règle de thème par route
- **Light mode** : `/home`, `/programs/**`, `/community`
- **Dark mode** : `/profile/**`, `/workout/**`
- **Special** : `/login` (light beige), `/splash` (néon vert `#D0FD3E`)

---

## Références Figma (node-ids des écrans finaux)

Fichier : `https://www.figma.com/design/XMTeGCX6yPiARJ0Z5jyeUr/`

| Écran | Node ID | Mode |
|-------|---------|------|
| Login (nouveau, fond jaune kettlebell) | `465:2633` | Light |
| Login (ancien, fond gym) | `345:1084` | Light |
| Home Light (complet : calendrier + séance + stretch) | `195:732` | Light |
| Program Hub | `235:594` | Light |
| Program Detail (Upper Lower) | `332:1540` | Light |
| Workout Detail - Planifier | `324:570` | Light |
| Workout Detail - Commencer | `272:453` | Dark |
| Workout Player - Exercise List | `312:752` | Dark |
| Workout Player - Input | `235:705` | Dark |
| Workout Player - Rest Timer | `272:564` | Dark |
| Workout Recap | `332:1841` | Dark |
| Profile (own, full) | `319:1342` | Dark |
| Profile (frequency calendar) | `371:897` | Dark |
| Profile Friend | `390:1107` | Dark |
| Friends List | `383:1973` | Dark |
| Session History | `372:961` | Dark |
| Community (Défis + Feed) | `427:1644` | Light |

> **Note** : Les écrans Splash Welcome (145:66), Home Empty (216:460) et Home With Workout (216:410) ont été supprimés du Figma. L'écran Home 195:732 les remplace tous.

Pour extraire le design d'un écran :
```
get_design_context(fileKey="XMTeGCX6yPiARJ0Z5jyeUr", nodeId="<NODE_ID>")
```

---

## Base de Données (Supabase)

### Tables existantes
- `workouts` — Métadonnées séance (title, duration, difficulty, image_url)
- `workout_exercises` — Exercices par séance (sets, reps, rest_seconds, order_index)
- `exercises` — Catalogue d'exercices (name, video_url)
- `workout_plan` — Planning hebdo (user_id, day_of_week, workout_id)
- `completed_workouts` — Séances terminées (user_id, workout_id, calories, completed_at)
- `user_progress` — Logs de séries (user_id, exercise_id, weight_used, reps_done, created_at)

### Tables à créer (V2)
- `profiles` — Username, age, streak, calories_target, avatar_url
- `programs` — Catalogue de programmes (titre, fréquence, focus, difficulté)
- `program_workouts` — Relation many-to-many programme ↔ séance
- `workout_sessions` — Instance d'une séance en cours (exercices restants vs grisés)
- `friendships` — Relations sociales (user_a, user_b, status)
- `community_feed` *(WIP)* — Événements sociaux + réactions

### Connexion
```
VITE_SUPABASE_URL=https://qlbmjwlgezjgvxwfxesw.supabase.co
```

---

## Logique Métier — Catégorisation & Streak

### Catégories de séances
Chaque séance (workout) appartient à une catégorie basée sur son titre/type :

| Catégorie | Couleur | Séances incluses |
|-----------|---------|------------------|
| **Haut du corps** | Jaune `#FFEE8C` | Upper, Push, Pull, Upper Body Women |
| **Bas du corps** | Bleu `#507FFF` | Legs, Lower Body |
| **BBL** (easter egg) | Rose `#FF69B4` | BBL — comptabilisé comme bas du corps mais affiché en rose |

### Table workouts — colonne `category`
Ajouter une colonne `category` à la table `workouts` :
- `'upper'` — haut du corps
- `'lower'` — bas du corps
- `'bbl'` — BBL (easter egg, compté comme lower)

### Règle du Streak (carte flamme)
Une semaine est **validée** (cochée) quand l'utilisateur a fait dans la même semaine :
- Au moins **1 séance haut du corps** (upper/push/pull)
- ET au moins **1 séance bas du corps** (lower/legs/bbl)

Le streak = nombre de **semaines consécutives** validées selon cette règle.
Le total = 52 semaines dans l'année.

### Couleurs des jours (checkboxes Lun-Dim)
Sur la carte streak, chaque jour où une séance a été faite affiche une checkbox colorée :
- **Jaune** `#FFEE8C` + glow `rgba(255,238,140,0.4)` → séance haut du corps ce jour-là
- **Bleu** `#507FFF` + glow `rgba(34,89,255,0.4)` → séance bas du corps ce jour-là
- **Rose** `#FF69B4` + glow `rgba(255,105,180,0.4)` → séance BBL ce jour-là
- **Gris** `rgba(156,163,176,0.3)` → pas de séance

**Règle : une seule séance par jour maximum.** L'app ne permet pas de faire plusieurs séances le même jour.

### Easter egg BBL (rose)
Quand une séance BBL est programmée ou en cours, TOUT ce qui est normalement jaune `#FFEE8C` devient rose `#FF69B4` :
- La carte carousel "Programmer mes séances" sur la Home → accent **rose**
- La checkbox du jour sur la carte streak → **rose** (même si comptée comme lower)
- La carte "Séance du jour" sur la Home → accent **rose** au lieu de jaune
- Le programme/séance dans le catalogue → badge **rose**
- Le détail de la séance (quand on clique pour voir les exercices) → accents **rose**
- Les boutons de la séance → **rose** au lieu de jaune
- Le Workout Player → tous les accents **rose**

---

## Conventions de Code

### Nommage
- **Fichiers composants** : PascalCase (`WorkoutCard.tsx`, `RestTimer.tsx`)
- **Fichiers utilitaires** : camelCase (`useWorkoutSession.ts`, `formatDuration.ts`)
- **Dossiers** : kebab-case (`workout-player/`, `design-system/`)

### Structure cible
```
src/
├── components/
│   ├── ui/              → Composants atomiques (Button, Badge, Card, Input)
│   ├── layout/          → Layout shells (LightLayout, DarkLayout, TabBar)
│   └── features/        → Composants métier (WorkoutCard, CalendarWeek, ExerciseRow)
├── pages/               → Pages/routes
├── hooks/               → Custom hooks (useAuth, useWorkoutSession, useTimer)
├── lib/                 → Utilitaires (supabaseClient, formatters)
├── types/               → Types TypeScript partagés
└── styles/              → Styles globaux (index.css avec Tailwind)
```

### Règles
- Un composant = un fichier, max 150 lignes (extraire si plus)
- Pas de `any` en TypeScript — typer toutes les props et les données Supabase
- State management : React Context pour le thème + état de session workout
- Commentaires en français
- Mobile-first : tout est conçu pour 402px de large (iPhone 16/17 Pro)

---

## Règles d'Intégration Figma MCP

### Workflow obligatoire (ne pas sauter d'étapes)

Pour chaque écran ou composant à implémenter depuis Figma :

1. **`get_design_context`** — Récupérer le contexte structuré du node Figma (layout, couleurs, typo, spacing)
2. Si la réponse est trop large ou tronquée, utiliser **`get_metadata`** pour la structure, puis re-fetch les nodes enfants avec `get_design_context`
3. **`get_screenshot`** — Capturer une référence visuelle du node (source de vérité)
4. **Télécharger les assets** (images, icônes, SVGs) retournés par le MCP
5. **Traduire** le code généré (React + Tailwind) dans les conventions du projet (voir Structure cible)
6. **Valider** visuellement contre le screenshot Figma avant de considérer l'implémentation comme terminée

### Règles d'implémentation

- Le code généré par le MCP Figma (React + Tailwind) est une **représentation du design**, pas du code final — l'adapter aux conventions du projet
- **Réutiliser les composants existants** (`src/components/ui/`) au lieu de dupliquer
- Utiliser les **design tokens du projet** (couleurs, typo, spacing) au lieu de hardcoder des valeurs
- Respecter les patterns de routing, state management et data-fetching existants
- Viser la **parité visuelle 1:1** avec le design Figma
- En cas de conflit entre tokens du projet et specs Figma, **préférer les tokens du projet** mais ajuster le spacing/sizing pour coller au visuel

### Gestion des assets

- IMPORTANT : Si le MCP Figma retourne une source localhost pour une image/SVG, l'utiliser **directement**
- IMPORTANT : NE PAS importer/ajouter de nouveaux packages d'icônes — tous les assets doivent venir du payload Figma
- IMPORTANT : NE PAS utiliser ou créer de placeholders si une source localhost est fournie
- Stocker les assets téléchargés dans `public/assets/`
- **VERROUILLÉ** : Le fichier `public/assets/streak-flame.svg` est FINAL. Ne jamais le re-télécharger, le modifier, ni diagnostiquer son contenu (preserveAspectRatio, filters, viewBox, etc.). Si un problème visuel apparaît sur la flamme, ajuster le CSS/Tailwind du conteneur, pas le SVG.

### Découpage des écrans

- **Ne pas envoyer un écran entier** d'un coup au MCP — découper en composants logiques (Header, Card, TabBar, etc.)
- Implémenter composant par composant, puis assembler dans la page
- Utiliser les node-ids de la table ci-dessus pour cibler les bons éléments

---

## Règles UX/UI (à respecter dans chaque composant)

### Accessibilité (WCAG AA minimum)
- Contraste texte/fond minimum **4.5:1** (vérifier avec les tokens light ET dark)
- Tous les éléments interactifs doivent avoir un `aria-label` explicite
- Navigation clavier fonctionnelle sur tous les boutons et inputs
- Tailles de touch target minimum **44x44px** sur mobile

### Typographie
- Utiliser une **échelle typographique cohérente** (4-7 tailles max) basée sur un ratio modulaire
- Noms sémantiques pour les styles : `text-display`, `text-heading`, `text-body`, `text-caption` (pas sm/md/lg)
- Arrondir les font-sizes et line-heights à des **nombres entiers** (pas de valeurs fractionnaires)
- Base : 16px pour le body, ratio "perfect fourth" (1.333) pour l'échelle

### Boutons & Interactions
- **Ne jamais utiliser de boutons disabled sans explication** — préférer : permettre le clic puis afficher un message inline expliquant ce qui manque
- Les boutons CTA doivent avoir un état hover, active et disabled clairement distincts
- Après une action (valider série, terminer séance), feedback visuel immédiat (toast, animation, changement d'état)

### Composants
- Chaque composant accepte une prop `className` pour la composition
- Les variantes utilisent des union types : `variant: 'primary' | 'secondary' | 'ghost'`
- Documenter chaque composant exporté avec un commentaire JSDoc
- Favoriser la composition (`children`) plutôt que les props complexes

### Validation UI post-implémentation — "Jeu des 7 différences" (OBLIGATOIRE)

Après CHAQUE composant ou page implémenté, exécuter ce protocole de vérification **dans cet ordre exact** :

**Étape 1 — Capturer les deux images**
1. Prendre un `get_screenshot` du node Figma de référence (source de vérité)
2. Prendre un screenshot de l'implémentation dans le navigateur (même viewport 402px)

**Étape 2 — Comparaison élément par élément ("7 différences")**
Analyser les deux images côte à côte et lister TOUTES les différences trouvées, même mineures :
- **Spacing** : marges, paddings, gaps — comparer les valeurs px exactes
- **Typographie** : font-family, font-size, font-weight, line-height, letter-spacing, couleur du texte
- **Couleurs** : fond, bordures, ombres, opacités — vérifier les hex exactes
- **Tailles** : largeur/hauteur des éléments, border-radius, taille des icônes
- **Alignement** : centrage horizontal/vertical, position relative entre éléments
- **Assets** : icônes correctes, images non déformées, pas de placeholder

**Étape 3 — Rapport de différences**
Lister chaque différence trouvée sous ce format :
```
❌ [Élément] : Figma = [valeur attendue] → Implémentation = [valeur actuelle]
```
Si aucune différence : `✅ Aucune différence détectée`

**Étape 4 — Corriger**
Corriger TOUTES les différences listées, puis reprendre à l'Étape 2 jusqu'à obtenir `✅`.

**RÈGLES STRICTES** :
- Ne JAMAIS considérer un composant comme terminé sans avoir fait ce protocole
- Ne JAMAIS dire "c'est bon" sans avoir pris ET comparé les deux screenshots
- Être TATILLON : un écart de 2px, une couleur légèrement différente, un font-weight incorrect = ça compte comme une différence
- Le screenshot Figma est la SEULE source de vérité — pas le code généré par le MCP, pas la mémoire

---

## Subagents Spécialisés

Le projet dispose de 5 subagents dans `.claude/agents/`, invocables directement :

| Agent | Commande | Rôle |
|-------|----------|------|
| TS Migrator | `@agent-ts-migrator` | Migration JSX → TypeScript avec typage strict |
| Figma Implementer | `@agent-figma-implementer` | Intégration Figma → React avec workflow 7 étapes |
| Test Writer | `@agent-test-writer` | Tests unitaires & intégration (Vitest + RTL) |
| Code Reviewer | `@agent-code-reviewer` | Revue qualité, perf, accessibilité, design system |
| Supabase Architect | `@agent-supabase-architect` | Schéma BDD, migrations, RLS, types TS |

### Utilisation
```bash
# Dans Claude Code, mentionner le subagent :
@agent-ts-migrator migre le fichier src/pages/Home.jsx
@agent-figma-implementer implémente l'écran Profile (node 319:1342)
@agent-test-writer écris les tests pour useWorkoutSession
@agent-code-reviewer review les changements non-committés
@agent-supabase-architect crée la table programs avec RLS
```

---

## Système Mémoire

Le projet utilise un système mémoire multi-couches :

| Couche | Fichier | Rôle |
|--------|---------|------|
| Projet | `CLAUDE.md` | Instructions permanentes, design system, conventions |
| Roadmap | `PLAN.md` | Phases et tâches à accomplir |
| Setup | `SETUP.md` | Guide de première installation |
| Décisions | `memory/decisions.md` | Décisions architecturales (pourquoi + alternatives rejetées) |
| Patterns | `memory/patterns.md` | Patterns de code récurrents à réutiliser |
| Progression | `memory/progress.md` | État d'avancement par phase |

### Règles mémoire
- **Après chaque décision importante** → ajouter une entrée dans `memory/decisions.md`
- **Après chaque nouveau pattern** → documenter dans `memory/patterns.md`
- **Après chaque session** → mettre à jour `memory/progress.md`
- Ne jamais supprimer d'entrées — l'historique est précieux

---

## Priorités d'Intégration

1. **Structure & Migration TS** — Restructurer les dossiers, migrer en .tsx
2. **Design System** — Composants UI de base alignés sur Figma (Button, Card, Badge, TabBar)
3. **Home & Navigation** — Nouvelle tab bar 3 tabs, Home light avec calendrier
4. **Programme Hub** — Catalogue, recherche, filtres, planification
5. **Workout Player** — Flow non-linéaire complet (le coeur de l'app)
6. **Profil** — Stats, PR, historique, amis (dark mode)
7. **Communauté** — Placeholder (structure technique seulement)
