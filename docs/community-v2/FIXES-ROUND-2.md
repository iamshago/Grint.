# Round 2 — Corrections après première implémentation

> Round 1 implémenté par Claude Code. 4 problèmes remontés par Pestakle après tests sur device. Ces corrections sont à appliquer **avant** de considérer la V2 livrée.

---

## Issue 1 — Page `/community` : trop d'espace vertical en haut, page trop longue

### Symptôme
Énorme vide entre la status bar et le titre `Communauté`. La page scrolle alors qu'elle ne devrait pas avoir besoin (un seul défi + empty state des posts = tout doit tenir dans le viewport sans scroll).

### Référence
Voir le screenshot device fourni par l'utilisateur (titre `Communauté` qui apparaît bien plus bas que sur les autres pages de l'app).

### Fix
Aligner sur le pattern des autres pages light de l'app : `src/pages/Home.tsx`, `src/pages/Profile.tsx`.

- Utiliser le wrapper `LightLayout` (`src/components/layout/LightLayout.tsx`) au lieu d'un `<div className="min-h-screen bg-bg-1 ...">` brut. Les layouts gèrent déjà le safe-area-top et le padding-bottom pour la TabBar.
- Le titre `Communauté` doit être à la même position verticale qu'`Accueil` sur la Home et `Profil` sur le Profile (token `pt-[100px]` ou équivalent — ne PAS empiler une seconde fois `safe-area-inset-top` si le layout l'applique déjà).
- Vérifier la hauteur de la page quand l'état est : 1 défi + 0 post → la page ne doit PAS dépasser la hauteur du viewport (pas de scroll).
- Si Claude Code a ajouté un header sticky pour cette page, le retirer — la page Communauté n'a PAS de header sticky (à la différence de la page Détail défi, cf Issue 3).

---

## Issue 2 — Page `/community/challenges/:id/join` : titre illisible (texte sombre sur fond sombre)

### Symptôme
Le mot `Défi` (ou le titre du défi `KikicacAvengers`) est rendu en couleur sombre alors qu'il est par-dessus la photo immersive sombre / la card overlay sombre. Résultat : texte invisible.

### Fix
- Refetch `get_design_context` sur le node `556:5995` pour récupérer les couleurs exactes des textes.
- Sur la card overlay du bas (fond `#1f2021` ou équivalent dark) :
  - Titre du défi : `text-bg-1` (`#f1f4fb`) ou blanc pur selon le Figma.
  - Description : `text-bg-1` ou alpha clair (`rgba(255,255,255,0.8)`).
- Le bouton retour en haut à gauche doit rester un cercle blanc lisible sur la photo (déjà OK probablement).
- CTA `Rejoindre vos amis` : fond `#ffee8c`, texte `#1f2021` (déjà jaune sur sombre, OK).

Re-jouer le **jeu des 7 différences** sur cette page après fix.

---

## Issue 3 — Page `/community/challenges/:id` : header non sticky

### Symptôme
Le bandeau du haut (bouton retour à gauche + titre `Défis` + sous-titre `20 séances par semaine` + menu `...` à droite) **scrolle avec le contenu**. L'utilisateur veut qu'il reste **figé en haut** comme sur toutes les autres pages de drill-down de l'app.

### Référence pattern
- `src/pages/Friends.tsx` — header sticky avec back button + titre
- `src/pages/FriendProfile.tsx` — même pattern
- `src/pages/SessionHistory.tsx` — même pattern

### Fix
- Header avec `position: sticky; top: 0;` (ou `fixed` si plus simple selon le layout choisi).
- Background opaque (`bg-bg-1` `#f1f4fb` pour cette page light) pour ne pas voir le contenu défiler dessous.
- Le header occupe une hauteur fixe (cf Figma `553:2208` pour la valeur exacte).
- Le body en dessous a un `padding-top` égal à la hauteur du header pour ne pas être masqué au démarrage.
- Quand on scrolle la page :
  - Le header reste en place ✅
  - La carte progression, le podium, la liste des participants scrollent dessous ✅
- La TabBar reste masquée (déjà décidé en §9.8 du brief, à vérifier dans `HIDE_TABBAR_ROUTES`).

Re-jouer le **jeu des 7 différences** + tester le scroll au doigt.

---

## Issue 4 — Avatars : tout le monde affiche l'avatar par défaut

### Symptôme
- Sur la page Communauté (carte défi avec mini-avatars participants, posts du feed) → mes amis ET moi affichons l'avatar par défaut `superman` au lieu de l'avatar choisi.
- Sur la page Amis (`/profile/friends`) → même problème : tous les amis ont l'avatar par défaut.

### Cause probable
- **Pour les amis** : la query Supabase ne ramène pas `profiles.avatar_id` correctement, ou le mapping `friend.avatar_id || friend.avatarId` tombe sur `undefined` (cf `src/pages/Friends.tsx` ligne 50, `src/components/features/SessionCard.tsx`, etc.).
- **Pour soi** : on utilise `localStorage.selectedAvatarId` qui peut ne pas être à jour si l'avatar a été changé sur un autre device, ou si la première écriture en base n'a pas écrit dans localStorage.

### Fix
1. **Côté requêtes** : pour toute donnée affichant un avatar d'un autre utilisateur (posts du feed, participants d'un défi, amis), faire une jointure sur `profiles` pour récupérer `avatar_id`. Exemple :
   ```ts
   // Posts du feed
   const { data } = await supabase
     .from('posts')
     .select('*, profile:profiles!user_id(avatar_id, display_name, username)')
     .order('created_at', { ascending: false })

   // Participants d'un défi
   const { data } = await supabase
     .from('challenge_participants')
     .select('*, profile:profiles!user_id(avatar_id, display_name, username)')
     .eq('challenge_id', challengeId)
   ```
   Vérifier que `profiles_id_fkey` est bien la foreign key utilisée pour les jointures (sinon adapter le hint : `profiles!profile_id_fkey`).

2. **Côté rendering** : `getAvatarById(profile?.avatar_id)` doit fallback sur `getDefaultAvatar()` UNIQUEMENT si `avatar_id` est nul/absent. Si la valeur est présente mais ne matche pas un avatar du registre `src/lib/avatars.ts`, logger un warning (l'avatar a été supprimé ou renommé) et tomber sur le default. NE PAS silencer.

3. **Pour self (l'utilisateur courant)** : au mount des pages Communauté / Détail défi, hydrater `avatar_id` depuis Supabase plutôt que depuis `localStorage` :
   ```ts
   const { data: { user } } = await supabase.auth.getUser()
   if (user) {
     const { data: profile } = await supabase
       .from('profiles')
       .select('avatar_id')
       .eq('id', user.id)
       .single()
     if (profile?.avatar_id) {
       localStorage.setItem('selectedAvatarId', profile.avatar_id) // re-sync cache local
     }
   }
   ```
   Idéalement, encapsuler cette logique dans un hook `useCurrentUserProfile()` partagé pour éviter la duplication.

4. **Vérification** : ouvrir la page `/profile/friends` et vérifier que chaque ami montre son avatar choisi (pas `superman` par défaut). Idem dans la page Communauté pour les avatars de la carte défi et les avatars des posts.

> Cette correction d'avatars est probablement un bug existant antérieur à la V2 Communauté. La page Friends affiche déjà des avatars par défaut → confirme que c'est un problème de fetch et non pas de design. À fixer transversalement (pas juste dans la Communauté).

---

## Issue 5 — Page `/community/challenges/:id` : ligne d'avertissement sur 3 lignes au lieu de 2

### Symptôme
Dans la carte progression (fond `#1f2021`), la ligne :
> `Attention, le nombre à atteindre change selon le nombre de participants au défi !`

doit s'afficher sur **2 lignes** comme sur le Figma `553:2208` :
- Ligne 1 : `Attention, le nombre à atteindre change`
- Ligne 2 : `selon le nombre de participants au défi !`

L'implémentation actuelle wrappe sur **3 lignes** car la `font-size` est trop grande et/ou la `line-height` est trop espacée et/ou le padding gauche n'est pas assez serré contre l'icône `i`. Résultat : pas pro.

### Fix
- Refetch `get_design_context` sur le node `553:2208` pour récupérer la `font-size` et `line-height` exactes du texte de cette ligne (probablement `12px` ou `13px` Figtree, line-height ~`1.3`).
- Aligner les valeurs CSS sur celles du Figma.
- Vérifier le `gap` entre l'icône `i` (cercle blanc, ~`24px`) et le texte — probablement `12px` ou `8px`.
- Vérifier la largeur disponible : la carte fait `width: 370px` (cf Figma) avec un padding interne `~16px` → la zone de texte fait `~330px - icône - gap`. À ce ratio, la phrase tient sur 2 lignes.
- Test : ouvrir un viewport `402×874` (iPhone 16 Pro) et confirmer le wrap sur 2 lignes exactement.

---

## Issue 6 — Badge `X pts` mal centré dans son container jaune

### Symptôme
Le badge `0 pts` (ou plus globalement `X pts`) qui apparaît :
- À droite de chaque card participant (liste classement)
- Au-dessus de chaque marche du podium (`23 pts`, `15 pts`, `13 pts`)

→ le texte n'est PAS centré horizontalement dans la pilule jaune. Effet bâclé.

### Référence
Voir Figma `553:2208` : sur les badges du podium et de la liste, le texte est parfaitement centré (à la fois horizontalement et verticalement) dans la pilule jaune `#ffee8c`.

### Fix
- Sur le composant `PtsBadge` (ou inline dans `ParticipantRow.tsx` / `ChallengePodium.tsx`) :
  - `display: inline-flex; align-items: center; justify-content: center;` (ou Tailwind `flex items-center justify-center`)
  - Padding **symétrique** (ex. `px-[12px] py-[6px]`) — pas d'asymétrie qui décale le texte
  - `text-align: center` en bonus si le texte n'est pas dans un flex
- Vérifier qu'aucune `letter-spacing` négative n'est appliquée (le `tracking-[-0.X]` du PT Serif est OK pour les titres mais pas pour les badges Figtree).
- Si le badge a une largeur fixe (ex. `w-[64px]`), s'assurer que la valeur est suffisante pour `XX pts` ET `X pts` (ne pas donner l'impression que `8 pts` est aligné à gauche dans une boîte large faite pour `23 pts`).
- Test : créer un participant fictif avec `0 pts`, `5 pts`, `15 pts`, `123 pts` → vérifier que tous les badges ont le texte parfaitement centré.

---

## Ordre suggéré de correction

1. **Issue 4** (avatars) en premier — c'est transversal, ça impacte la perception des autres Issues quand on revérifie en device.
2. **Issue 1** (espace vertical /community).
3. **Issue 3** (header sticky /community/challenges/:id).
4. **Issue 5** (ligne avertissement sur 2 lignes) + **Issue 6** (badge pts centré) — pixel-perfect sur la page Détail défi.
5. **Issue 2** (couleur texte page Rejoindre).
6. Re-jouer le **jeu des 7 différences** sur les 3 pages après tous les fixes.
7. Update `memory/decisions.md` :
   ```
   ### 2026-05-XX — Avatars : fetch via jointure profiles partout
   **Contexte** : Les amis et l'utilisateur courant affichaient l'avatar par défaut `superman` car le code reposait sur localStorage / champs non-peuplés
   **Décision** : Toute requête qui affiche un avatar fait une jointure sur profiles(avatar_id, display_name, username). Self est hydraté depuis Supabase au mount, pas depuis localStorage
   **Alternative rejetée** : Stocker avatar_id en cache local + invalidation manuelle — fragile cross-device
   ```
