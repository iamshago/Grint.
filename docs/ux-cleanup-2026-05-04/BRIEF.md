# Brief Claude Code — UX Cleanup Round 1 (Home, Programs, Friends)

> Brief préparé par Pestakle (Cowork) pour Claude Code.
> Date : 2026-05-04
> Stack : React 19 + Vite + Tailwind + Supabase, mobile-first 402px (iPhone 16/17 Pro).
> Mode de test : iPhone 15 Pro / Safari (pas en PWA installée).

---

## 0. Objectif

Corriger 6 bugs UX remontés sur device après tests sur la Home, la page `/programs` (liste + modales programme/séance) et les pages Profil / Amis. Tous les bugs sont à régler dans le **même passage** — ils touchent en partie les mêmes fichiers et il faut éviter les conflits de refactor.

À la fin :
1. `npx tsc --noEmit -p tsconfig.json` → **aucune erreur**.
2. Nettoyer les imports devenus inutiles (`AVATARS`, `getAvatarById`, `getDefaultAvatar` quand plus utilisés).
3. Mettre à jour `memory/decisions.md` et `memory/progress.md` avec un résumé du round.

---

## 1. Bug — TabBar trop haute au lancement sur iOS Safari

### Symptôme
Sur iPhone 15 Pro / Safari (pas PWA), au premier lancement de l'app sur la Home, la TabBar apparaît "haute" sur l'écran (la barre d'URL Safari est encore visible et réduit le viewport). Quand on slide vers la page Profil ou Communauté (qui sont scrollables), la barre d'URL se masque et la TabBar redescend à sa position normale. Au retour Home, elle reste correcte.

### Cause
- Home utilise `LightLayout` non-scrollable (`h-[100dvh] overflow-hidden`) → aucun scroll possible, donc la barre d'URL ne se masque jamais d'elle-même.
- La TabBar est positionnée `fixed; bottom: env(safe-area-inset-bottom) + 12px`. `env()` et `100dvh` varient tous les deux selon la visibilité de la barre d'URL Safari → la TabBar saute visuellement.

### Fix
Dans `src/App.tsx`, ajouter un hook `useHideMobileUrlBar()` qui force le masquage de la barre d'URL Safari au premier paint via le scroll-trick :

```ts
function useHideMobileUrlBar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const isStandalone = (navigator as any).standalone === true
    if (!isIOS || isStandalone) return // PWA déjà fullscreen, rien à faire

    const html = document.documentElement
    const body = document.body
    const prevHtmlH = html.style.height
    const prevBodyMin = body.style.minHeight
    const prevBodyOverflow = body.style.overflowY

    const trigger = () => {
      // Rendre body brièvement scrollable pour permettre window.scrollTo(0, 1)
      html.style.height = 'auto'
      body.style.minHeight = `${window.innerHeight + 50}px`
      body.style.overflowY = 'auto'

      requestAnimationFrame(() => {
        window.scrollTo(0, 1)
        setTimeout(() => {
          window.scrollTo(0, 0)
          html.style.height = prevHtmlH
          body.style.minHeight = prevBodyMin
          body.style.overflowY = prevBodyOverflow
        }, 350)
      })
    }

    const t = setTimeout(trigger, 80) // attendre le premier paint
    return () => clearTimeout(t)
  }, [])
}
```

Appeler le hook tout en haut du composant `App()` (avant le `useEffect` qui charge la session Supabase).

**Test device** : sur iPhone Safari (pas PWA), au lancement de l'app, la TabBar doit être stable dès le premier rendu sur la Home, sans avoir besoin de naviguer vers Profil/Communauté.

---

## 2. Bug — Bouton retour désaligné sur "Programmer mes séances"

### Symptôme
Sur `/programs`, le bouton retour (cercle blanc avec `←`) est positionné en haut à gauche en `position: fixed` à `top: env() + 8px` tandis que le titre `Programmer mes séances` est dans le flux normal du document. Résultat : ils ne sont pas alignés verticalement, le bouton paraît "flotter" au-dessus du titre.

### Référence
Le user veut un alignement comme dans `src/pages/Friends.tsx` ou `src/pages/SessionHistory.tsx` — bouton retour DANS la même flex row que le titre, pas en `fixed`.

### Fix
Dans `src/pages/Program.tsx`, remplacer le bloc actuel (bouton fixed + spacer + titre) par un seul flex row :

```tsx
<div className="relative z-40 px-4 pt-2 pb-4 flex items-center gap-3">
  <button
    onClick={() => navigate('/home')}
    aria-label="Retour"
    className="bg-white rounded-[24px] p-3 cursor-pointer active:scale-95 transition-transform shadow-[0px_2px_8px_rgba(0,0,0,0.08)] shrink-0"
  >
    <ArrowLeft size={16} className="text-tx-1" />
  </button>
  <h1 className="font-serif font-bold text-xl text-tx-1 tracking-tight text-center flex-1 pr-[40px]">
    Programmer mes séances
  </h1>
</div>
```

Le `pr-[40px]` sur le titre compense la largeur du bouton retour à gauche pour que le titre paraisse centré dans la zone restante.

Pas besoin de garder le bouton visible au scroll : il scrolle avec le titre, ce qui garantit l'alignement.

---

## 3. Bug — Cartes séance pas cliquables en entier

### Symptôme
Dans `src/components/features/WorkoutCard.tsx`, seul le rond play en bas-droite ouvre la séance. L'utilisateur veut pouvoir tap **n'importe où** sur la carte (image, titre, durée…).

### Fix
Transformer la racine du composant en `<button>` quand `onPlay` est fourni :

```tsx
const Wrapper: any = onPlay ? 'button' : 'div'
const interactiveProps = onPlay
  ? {
      onClick: onPlay,
      type: 'button' as const,
      'aria-label': isCompleted ? `Revoir ${title}` : `Lancer ${title}`,
    }
  : {}

return (
  <Wrapper
    {...interactiveProps}
    className={cn(
      'relative rounded-[16px] overflow-hidden h-[168px] block w-full text-left',
      onPlay && 'cursor-pointer active:scale-[0.98] transition-transform',
      className,
    )}
  >
    {/* ... image, gradient, badge, titre, infos ... */}

    {/* Indicateur play / coche — visuel uniquement (le clic est géré par le wrapper) */}
    {onPlay && (
      <div
        className="absolute right-4 bottom-4 w-12 h-12 rounded-12 flex items-center justify-center pointer-events-none"
        style={{ backgroundColor: styles.playBg }}
        aria-hidden="true"
      >
        {isCompleted ? <Check ... /> : <Play ... />}
      </div>
    )}
  </Wrapper>
)
```

**Important** :
- Le rond play passe de `<button>` à `<div>` pour éviter button-in-button (HTML invalide).
- `pointer-events-none` sur le rond play pour que le clic traverse jusqu'au wrapper.
- `block w-full text-left` sur la racine pour que le `<button>` se comporte comme un div en termes de layout.

---

## 4. Bug — TabBar masque le bas du contenu (liste + modales programme)

### Symptôme
1. Sur `/programs` (liste "Toutes les séances"), la dernière carte (`Upper Body (F)`) est à moitié cachée derrière la TabBar flottante.
2. Même problème dans les modales programme (BBL Bootcamp, Upper / Lower) : la dernière séance du programme est tronquée par la TabBar.

### Cause
- La liste `/programs` utilise `<LightLayout hideTabBar>` ce qui DÉSACTIVE le `pb-tabbar` du layout. Or la TabBar persistante (rendue par `App.tsx`) reste visible sur cette route → contenu pas dégagé.
- La modale programme (`previewProgram`) est rendue **inline** dans `LightLayout` avec `z-[80]`. Elle est censée recouvrir la TabBar (`z-50`) mais à cause des stacking contexts iOS Safari, la TabBar passe parfois devant. Et son padding interne `pb-10` (40px) est trop court pour dégager une éventuelle TabBar visible.

### Fix dans `src/pages/Program.tsx`

**a) Liste** :
- Retirer `hideTabBar` de `<LightLayout>` → le `pb-tabbar` (= `padding-bottom: calc(env() + 100px)`, défini dans `src/styles/index.css`) sera appliqué.
- Garder `scrollable`. Le `className="pb-10"` peut être retiré (devient redondant).

**b) Modale `previewProgram`** :
- La passer en `createPortal(..., document.body)` (comme `previewWorkout` qui l'est déjà). Ça évite les problèmes de stacking context iOS.
- z-index racine de la modale : `z-[9999]` (cohérence avec `previewWorkout`).
- Le wrapper de contenu interne (la div `bg-bg-1 rounded-t-[24px] ...`) reçoit en style inline :
  ```tsx
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}
  ```
  au lieu de la classe `pb-10`. 140px dégage proprement la TabBar (76px hauteur + 12px bottom + safe area).

**c) Bouton retour de la modale `previewProgram`** :
- Passer en `fixed left-4 z-[110]` + classe `fixed-top-button` (déjà définie dans `index.css` : `top: env() + 8px`). Cohérence avec `previewWorkout`.
- Retirer le `top-[72px]` hardcodé.

---

## 5. Bug — Texte illisible derrière la status bar pendant le scroll

### Symptôme
Sur les pages programme (liste `/programs` + modales détail Upper/Lower, BBL Bootcamp + modale séance), quand on scrolle, le titre passe **sous la zone de la status bar iPhone** (heure, batterie). Le texte noir du titre devient illisible par-dessus la status bar transparente noire.

### Référence
Test reproduit par l'utilisateur sur la modale Upper / Lower : le titre `Upper / Lower` chevauche `03:55` (heure) après scroll de quelques pixels.

### Fix
Ajouter un overlay `position: fixed` plein-largeur en haut, hauteur `calc(env(safe-area-inset-top, 0px) + 56px)`, `pointer-events: none`, avec un dégradé du fond opaque vers transparent :

```tsx
<div
  className="fixed top-0 left-0 right-0 pointer-events-none"
  style={{
    height: 'calc(env(safe-area-inset-top, 0px) + 56px)',
    backgroundImage:
      'linear-gradient(to bottom, rgba(241,244,251,1) 0%, rgba(241,244,251,0.92) 60%, rgba(241,244,251,0) 100%)',
  }}
  aria-hidden="true"
/>
```

(`#f1f4fb` = `bg-1`, le fond light de l'app.)

**Où l'ajouter** :
- **Liste `/programs`** : tout en haut du contenu de `<LightLayout>`, classe `z-30`.
- **Modale `previewProgram` (en portal)** : juste après le bouton retour, classe `z-[100]` (en dessous du bouton qui est en `z-[110]`).
- **Modale `previewWorkout` (déjà en portal)** : pareil que `previewProgram`, `z-[100]`.

L'overlay doit rester EN DESSOUS du bouton retour mais AU-DESSUS du contenu scrollable.

---

## 6. Bug — Amis affichent l'avatar par défaut "superman" à la place de leur photo

### Symptôme
Dans la page Profil (carte "Amis" en haut à droite), dans `/profile/friends` (liste d'amis), dans `/profile/friends/:id` (profil d'un ami), tous les amis affichent l'avatar Superman par défaut au lieu de leur vraie photo de profil.

### Contexte
Une nouvelle colonne `avatar_url` (text, nullable) existe sur la table `profiles` Supabase (créée par un round Claude Code précédent). Elle contient l'URL de la vraie photo de profil de l'utilisateur (uploadée ou OAuth Google). **Aucune requête actuelle ne sélectionne `avatar_url`** → tout le monde retombe sur le fallback `avatar_id` du catalogue prédéfini (`AVATARS` dans `src/lib/avatars.ts`), qui est `superman` par défaut quand non renseigné.

L'utilisateur indique que cette logique est **déjà censée être appliquée dans l'onglet Communauté** (mais elle ne l'est pas en réalité — toutes les requêtes du repo sont à patcher).

### Fix

#### a) Helper central — `src/lib/avatars.ts`

Ajouter en bas du fichier :

```ts
/**
 * Résout la source de l'image à afficher pour un profil.
 *
 * Ordre de priorité :
 * 1. `avatar_url` — photo personnalisée (uploadée ou OAuth) stockée sur
 *    `profiles.avatar_url` Supabase.
 * 2. `avatar_id` — id du catalogue prédéfini (héros, dessins animés…).
 * 3. Fallback `superman` (défaut Figma).
 */
export function resolveAvatarSrc(profile: {
  avatar_url?: string | null
  avatarUrl?: string | null
  avatar_id?: string | null
  avatarId?: string | null
} | null | undefined): string {
  if (!profile) return getDefaultAvatar().src
  const url = profile.avatar_url ?? profile.avatarUrl ?? null
  if (url && url.trim().length > 0) return url
  const id = profile.avatar_id ?? profile.avatarId ?? null
  if (id) {
    const found = getAvatarById(id)
    if (found) return found.src
  }
  return getDefaultAvatar().src
}
```

#### b) Type partagé — `src/types/index.ts`

Ajouter le champ à `ProfileSummary` :

```ts
export interface ProfileSummary {
  id: string
  display_name: string | null
  avatar_id: string | null
  /** URL de la photo personnalisée — prioritaire sur avatar_id */
  avatar_url: string | null
  username: string | null
}
```

#### c) Patcher TOUTES les requêtes Supabase qui sélectionnent `avatar_id`

`grep -rn "avatar_id" src/` pour les trouver. Ajouter `avatar_url` à chaque `.select()` :

| Fichier | Occurrences |
|---------|-------------|
| `src/hooks/useCurrentUserProfile.ts` | 1 |
| `src/hooks/useFeed.ts` | 2 |
| `src/hooks/useChallengeProgress.ts` | 1 |
| `src/pages/Profile.tsx` | 2 |
| `src/pages/Friends.tsx` | 4 |
| `src/pages/FriendProfile.tsx` | 1 |
| `src/pages/Community.tsx` | 1 |

Exemple : `.select('id, display_name, avatar_id, username')` → `.select('id, display_name, avatar_id, avatar_url, username')`.

#### d) Remplacer `getAvatarById(...)` par `resolveAvatarSrc(profile)` dans les composants d'AFFICHAGE

| Fichier | Endroits |
|---------|----------|
| `src/components/features/FeedPostCard.tsx` | avatar auteur + reactor preview |
| `src/components/features/ParticipantRow.tsx` | avatar participant |
| `src/components/features/ChallengeCard.tsx` | avatars empilés |
| `src/components/features/ReactionsModal.tsx` | avatars dans la liste de réacteurs |
| `src/pages/FriendProfile.tsx` | avatar 120px de l'ami |
| `src/pages/Friends.tsx` | `FriendCard`, `FriendRequestCard`, résultats recherche `AddFriendPopup`, demandes envoyées |
| `src/pages/Profile.tsx` | avatar 124px du user courant + mini-avatars sur la carte "Amis" |

**Cas particulier `Profile.tsx` (user courant)** :
- Ajouter un state `selectedAvatarUrl` hydraté depuis `profileData.avatar_url` au mount.
- Calculer `currentAvatarSrc = resolveAvatarSrc({ avatar_url: selectedAvatarUrl, avatar_id: selectedAvatarId })`.
- Le state `friends: { id, avatarId, avatarUrl, name }[]` doit aussi stocker `avatarUrl`. Hydrater depuis `p.avatar_url ?? null` lors du mapping des `friendProfiles`.

**Cas particulier `AvatarPicker.tsx`** :
- **NE PAS le modifier.** C'est l'écran de sélection du catalogue prédéfini → continue de manipuler `avatar_id` uniquement. L'upload de photo custom est hors-scope de ce round.

#### e) Nettoyer les imports

Après le refactor, beaucoup de fichiers n'importent plus `getAvatarById`, `AVATARS`, `getDefaultAvatar`. Retirer les imports inutiles pour éviter les warnings ESLint.

---

## 7. Validation

### Typecheck
```bash
npx tsc --noEmit -p tsconfig.json
```
→ Aucune erreur attendue.

### Tests device manuels
1. **iOS Safari (pas PWA), Home** : la TabBar est stable dès le premier rendu, pas de saut au premier scroll.
2. **`/programs` liste** : back button aligné avec le titre, dégradé visible derrière la status bar pendant le scroll, dernière séance entièrement visible (pas cachée par la TabBar).
3. **Tap sur une carte séance** (image / titre / durée) : ouvre la modale de la séance — pas obligé de viser le rond play.
4. **Modale BBL Bootcamp / Upper Lower** : dernière séance du programme entièrement visible, pas tronquée par la TabBar.
5. **Profil / Mes amis / Profil d'un ami** : les amis qui ont défini leur avatar (via `avatar_url`) affichent leur vraie photo, pas Superman.

### Mémoire à mettre à jour

`memory/decisions.md` — ajouter une entrée datée :
```
### 2026-05-04 — Avatar custom : profiles.avatar_url prioritaire sur avatar_id
**Contexte** : nouvelle colonne `avatar_url` sur `profiles` (photo perso uploadée
ou OAuth Google). L'app continuait à n'afficher que `avatar_id` (catalogue
prédéfini) → tous les amis apparaissaient en Superman par défaut.
**Décision** : helper central `resolveAvatarSrc(profile)` dans `src/lib/avatars.ts`
avec priorité `avatar_url > avatar_id > defaultAvatar`. Toutes les requêtes
profil sélectionnent désormais les deux colonnes. AvatarPicker reste sur
`avatar_id` (sélection dans le catalogue prédéfini) — l'upload custom est
hors-scope de ce round.
```

`memory/progress.md` — cocher les 6 fixes ci-dessus dans la section appropriée
(ou créer une section "Round UX cleanup 2026-05-04").
