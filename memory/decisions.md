# Décisions Architecturales — Grint.

> Ce fichier est lu automatiquement par Claude Code pour se souvenir des décisions prises au fil des sessions.
> Ajouter chaque décision importante ici pour éviter de re-débattre les mêmes sujets.

## Format
```
### [DATE] — Titre de la décision
**Contexte** : Pourquoi cette décision a été prise
**Décision** : Ce qui a été choisi
**Alternative rejetée** : Ce qui a été écarté et pourquoi
```

---

### 2026-03-31 — Garder la codebase existante plutôt que repartir de zéro
**Contexte** : L'app a été buildée avec Gemini, migration vers Claude Code
**Décision** : Réutiliser la base existante (auth Supabase, routing, Vercel déployé)
**Alternative rejetée** : Repartir from scratch — trop de travail pour refaire ce qui marche déjà

### 2026-03-31 — Migration progressive JSX → TypeScript
**Contexte** : Le code existant est en JSX, le nouveau code doit être en TSX
**Décision** : Migrer fichier par fichier en commençant par les utilitaires, puis les composants UI, puis les pages
**Alternative rejetée** : Migration big-bang — trop risqué, casse tout d'un coup

### 2026-03-31 — Thème dual Light/Dark par route
**Contexte** : Le design Figma utilise deux modes selon les sections
**Décision** : Light pour Home/Programs/Community, Dark pour Profile/Workout Player
**Alternative rejetée** : Toggle utilisateur — le design n'est pas prévu pour ça

### 2026-03-31 — Figma MCP comme source de vérité (pas screenshots seuls)
**Contexte** : Deux approches possibles pour l'intégration Figma
**Décision** : Utiliser le MCP Figma pour les tokens + screenshots pour validation visuelle
**Alternative rejetée** : Screenshots seuls — perd les valeurs exactes de spacing/couleurs

### 2026-03-31 — Rester sur Claude Code (pas Cursor ni Windsurf)
**Contexte** : Évaluation des alternatives AI coding tools
**Décision** : Claude Code dans VS Code — meilleur raisonnement architectural, MCP Figma natif, plus grand contexte
**Alternative rejetée** : Cursor (autocomplete rapide mais pas de Figma natif), Windsurf (instable, pas de Figma)

### 2026-04-01 — Catégorisation upper/lower/bbl des séances
**Contexte** : Le streak doit valider qu'on a fait haut ET bas du corps dans la semaine
**Décision** : Colonne `category` sur workouts ('upper'/'lower'/'bbl'), couleurs jaune/bleu/rose, streak = semaines consécutives avec au moins 1 upper ET 1 lower
**Alternative rejetée** : Simple comptage de séances sans distinction — ne motive pas l'équilibre haut/bas

### 2026-04-01 — Easter egg BBL (rose)
**Contexte** : La séance BBL est un type spécial (bas du corps mais marketing distinct)
**Décision** : BBL compté comme "lower" pour le streak, mais affiché en rose (#FF69B4) partout — checkbox, carte séance du jour, badge programme, workout player
**Alternative rejetée** : Traiter BBL comme lower sans distinction visuelle — perd l'aspect fun/gamification

### 2026-04-01 — Node-ids Figma nettoyés
**Contexte** : 3 node-ids invalides (Home Empty 216:460, Home With Workout 216:410, Splash 145:66 supprimés du Figma)
**Décision** : Home unique = 195:732 (complet), Login nouveau = 465:2633, Splash supprimé
**Alternative rejetée** : Garder les anciens IDs qui cassent les appels MCP

### 2026-04-02 — Hook partagé useStreak (élimination duplication)
**Contexte** : Le calcul du streak était dupliqué dans 4 fichiers (Home, Profile, Friends, FriendProfile) — 30+ lignes identiques à chaque fois
**Décision** : Créer src/hooks/useStreak.ts avec useStreak() hook + computeStreakForUser() utility. Exports aussi CATEGORY_ACCENT et DAY_LABELS
**Alternative rejetée** : Laisser le code dupliqué — maintenance impossible, risque d'inconsistance

### 2026-04-02 — Seuil "actuellement en séance" = 10 min
**Contexte** : Initialement 2h, mais c'est trop long après une séance terminée
**Décision** : Un ami est "en séance" si son dernier completed_workout date de < 10 min. Au-delà, afficher "dernière séance il y a X"
**Alternative rejetée** : 2h — trop permissif, montre "en séance" alors que la personne a fini depuis longtemps

### 2026-04-02 — TabBar animation : useEffect pour prevActiveIndex (fix StrictMode)
**Contexte** : L'animation spring du tab indicator ne fonctionnait plus — duration:0 appliquée à tort
**Décision** : Déplacer `prevActiveIndex.current = activeIndex` dans un useEffect au lieu de le faire pendant le render. React StrictMode double-render causait le ref à se mettre à jour avant le 2nd render, rendant tabChanged=false
**Alternative rejetée** : Retirer StrictMode — cache d'autres bugs potentiels

### 2026-04-02 — PR card positionnement Figma-exact
**Contexte** : La valeur PR et le badge exercice étaient mal positionnés (left:16px et right:16px)
**Décision** : Utiliser les positions exactes du Figma : left:calc(50%-84px) pour la valeur, left:calc(50%+49px) avec -translate-x-1/2 pour le badge
**Alternative rejetée** : Garder left/right:16px — ne matche pas le design Figma

### 2026-04-02 — Flamme badge glow : CSS blur plutôt que SVG filter
**Contexte** : Le SVG glow avec feGaussianBlur rendait n'importe quoi dans le navigateur
**Décision** : Utiliser une copie floutée de la flamme SVG (opacity:0.25, scale:1.35, blur:7px) comme glow derrière
**Alternative rejetée** : SVG avec filter feGaussianBlur (rendu cassé), CSS radial-gradient (pas assez naturel)
