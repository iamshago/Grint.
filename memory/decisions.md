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

### 2026-05-04 — Avatars : Supabase comme source de vérité, localStorage = cache miroir
**Contexte** : Sur la page Friends et la page Communauté V2, tous les amis ET soi-même affichaient l'avatar par défaut `superman`. Cause : `AvatarPicker` n'écrivait QUE dans `localStorage` (jamais dans `profiles.avatar_id`), donc Supabase restait à la valeur par défaut pour tout le monde. Les requêtes amis/posts/participants ramenaient bien `avatar_id`, mais c'était toujours `superman`.
**Décision** :
- Toute requête qui affiche un avatar d'un autre utilisateur fait une jointure sur `profiles(avatar_id, display_name, username)` — déjà OK dans le code.
- `AvatarPicker.handleValidate()` persiste désormais dans `profiles.avatar_id` via Supabase, puis miroir localStorage (cache).
- Profile.tsx hydrate `avatar_id` depuis `profiles` au mount (et au focus retour AvatarPicker), Supabase prime sur localStorage.
- Hook partagé `useCurrentUserProfile()` + `persistCurrentAvatar(id)` dans `src/hooks/useCurrentUserProfile.ts` pour centraliser.
**Alternative rejetée** : Stocker `avatar_id` uniquement en cache local + invalidation manuelle — fragile cross-device, sans sync entre amis (chacun voit son propre cache, jamais celui des autres).

### 2026-05-04 — Communauté V2 : feed PR auto + défi unique avec podium
**Contexte** : Refonte de l'onglet Communauté V1 (mock 3 défis carousel + posts manuels) vers V2 fonctionnelle (un défi actif, feed auto-alimenté par les PR de soi + amis, réactions persistées)
**Décision** :
- Trigger Postgres `trg_user_progress_pr` sur INSERT user_progress → posts auto de type 'pr' (uniquement quand `weight_used` dépasse le record précédent)
- Cache `exercise_pr_records` (user_id, exercise_id, best_weight) pour éviter de recalculer ET ne pas poster sur le premier set d'un nouvel exo
- Backfill du cache au déploiement à partir des max() historiques de user_progress (sinon les premiers sets post-deploy auraient été faussement marqués comme PR)
- Un seul défi actif à un instant T, mais schéma `challenges`/`challenge_participants` multi-défis pour V3
- RLS posts/reactions visibles uniquement pour soi + amis acceptés (helper `is_friend_or_self(uuid)`)
- 4 emojis cumulables par utilisateur, UNIQUE sur (post_id, user_id, emoji)
- Sortie défi UNIQUEMENT via "..." de la page Détail + modale de confirmation rouge (anti abandon accidentel)
- TabBar masquée sur `/community/challenges/*` (préfixe ajouté à HIDE_TABBAR_ROUTES)
- Pixel-perfect strict aligné sur Figma 551:1854 / 553:2208 / 556:5995 (textes copiés au caractère, apostrophes typographiques U+2019 incluses, dates formatées en UTC pour matcher la valeur stockée en base)
**Alternative rejetée** : Recalcul applicatif des PR à chaque save de set côté client — fragile (court-circuitable si on modifie le client), et pose des problèmes de cohérence si plusieurs devices saisissent en parallèle. Le trigger Postgres est la source de vérité unique.

### 2026-04-02 — Flamme badge glow : CSS blur plutôt que SVG filter
**Contexte** : Le SVG glow avec feGaussianBlur rendait n'importe quoi dans le navigateur
**Décision** : Utiliser une copie floutée de la flamme SVG (opacity:0.25, scale:1.35, blur:7px) comme glow derrière
**Alternative rejetée** : SVG avec filter feGaussianBlur (rendu cassé), CSS radial-gradient (pas assez naturel)

### 2026-05-04 — Avatar custom : profiles.avatar_url prioritaire sur avatar_id
**Contexte** : Nouvelle colonne `avatar_url` ajoutée à `profiles` (migration 20260504_add_avatar_url_to_profiles). Stocke la photo perso (uploadée ou OAuth Google). L'app continuait à n'afficher que `avatar_id` (catalogue prédéfini) → tous les amis apparaissaient en Superman par défaut. Le premier essai a cassé la liste d'amis parce que les requêtes `.select(..., avatar_url, ...)` étaient pushées avant que la colonne existe en base — d'où le pré-flight ajouté au brief (vérifier la colonne, créer la migration si absente, smoke test post-patch).
**Décision** : Helper central `resolveAvatarSrc(profile)` dans `src/lib/avatars.ts` avec priorité `avatar_url > avatar_id > defaultAvatar`. Toutes les requêtes profil sélectionnent désormais les deux colonnes (`useCurrentUserProfile`, `useFeed`, `useChallengeProgress`, `Profile`, `Friends`, `FriendProfile`, `Community`). Composants d'affichage migrés (`FeedPostCard`, `ParticipantRow`, `ChallengeCard`, `ReactionsModal`, `Friends`, `FriendProfile`, `Profile`). AvatarPicker reste sur `avatar_id` (sélection dans le catalogue prédéfini) — l'upload custom est hors-scope.
**Alternative rejetée** : Une seule colonne unique `avatar` text qui peut être soit un id soit une URL — trop ambigu côté requête, perte d'info sur le type.

### 2026-05-04 — TabBar stable au lancement iOS Safari : scroll-trick au mount
**Contexte** : Sur iPhone Safari (non-PWA), au premier lancement sur la Home, la TabBar paraît "haute" car la barre d'URL Safari est encore visible et réduit le viewport. La Home utilise `LightLayout` non-scrollable (`h-[100dvh] overflow-hidden`) → la barre d'URL ne se masque jamais d'elle-même, et `env(safe-area-inset-bottom)` + `100dvh` varient quand elle se masque ailleurs.
**Décision** : Hook `useHideMobileUrlBar()` dans `App.tsx` qui rend brièvement le body scrollable au mount, déclenche `window.scrollTo(0, 1)` pour forcer Safari à collapser la barre d'URL, puis restaure les styles. Inopérant en PWA standalone.
**Alternative rejetée** : Rendre la Home scrollable — change le layout fixe voulu par le design Figma. Forcer `100vh` au lieu de `100dvh` — casserait l'adaptation à la safe-area iOS.

### 2026-05-04 — Sync auto avatar_url depuis OAuth Google (round 2)
**Contexte** : Après round 1 UX cleanup, les amis affichaient toujours Superman parce que `profiles.avatar_url` restait à NULL pour tout le monde — la photo Google vit dans `auth.users.raw_user_meta_data` (clés `avatar_url` ou `picture` selon provider) et n'était jamais copiée dans `public.profiles`. La requête de vérification post-migration a confirmé : 3/3 profils maintenant peuplés avec `https://lh3.googleusercontent.com/...`.
**Décision** : Deux migrations — `20260504_backfill_avatar_url_from_oauth.sql` (UPDATE one-shot pour les comptes existants) + `20260504_sync_avatar_url_trigger.sql` qui définit (a) `oauth_avatar_url(uuid)` helper SECURITY DEFINER, (b) `populate_avatar_url_on_profile_insert()` trigger BEFORE INSERT sur `public.profiles`, et (c) `sync_avatar_url_from_auth()` trigger AFTER UPDATE sur `auth.users` qui propage seulement si `profiles.avatar_url` est null OU égal à l'ancienne URL OAuth (pour respecter une éventuelle photo uploadée manuellement).
**Alternative rejetée** : Faire la résolution côté app (jointure avec `auth.users` à chaque fetch) — plus lent, plus complexe, et `auth.users` est en RLS strict côté client. La sync DB est invisible et performante.

### 2026-05-04 — Gradient haut status bar : hauteur réduite + stops simplifiés
**Contexte** : Le gradient ajouté en round 1 (`env+56px`, stops `1/0.92@60%/0`) créait une ligne horizontale visible sur iPhone — la chute brutale 0.92 → 0 sur les 34% du bas dessinait une frontière. La hauteur 56px débordait largement sous la Dynamic Island.
**Décision** : Hauteur réduite à `env+16px` (couvre la status bar + 16px de marge, pas plus) et progression linéaire `1 → 0.85@70% → 0` qui fait disparaître la ligne. Appliqué aux 3 endroits dans `Program.tsx` (liste + 2 modales en portal).
**Alternative rejetée** : Garder un gradient long avec un blur CSS — coûteux en perf, et le blur sur iOS Safari hors-PWA est instable (rendering bugs en scroll).
