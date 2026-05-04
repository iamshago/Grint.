# Brief Claude Code — AvatarPicker : layout sticky comme les autres pages

> Brief préparé par Pestakle (Cowork) pour Claude Code.
> Date : 2026-05-04
> Cible : `src/pages/AvatarPicker.tsx`
> Stack : React 19 + Vite + Tailwind, mobile-first 402px.

---

## 0. Objectif

La page `/profile/avatar` (sélection de l'avatar) doit suivre le même pattern de layout que les autres pages "modales fullscreen" de l'app (ex : modale séance dans `src/pages/Program.tsx`, page `ChallengeJoin.tsx`) :

1. **Header sticky** en haut avec le bouton croix `X` à gauche + le titre `Choisis ton avatar` à sa droite, sur la même ligne, alignés verticalement.
2. **Grille d'avatars scrollable** au milieu — le contenu défile **sous** le header (le header reste visible et opaque).
3. **Bouton Valider sticky** tout en bas, avec un dégradé doux au-dessus pour marquer la transition avec le contenu qui scrolle. Quand on arrive en bas de la grille, les derniers avatars **doivent rester visibles au-dessus du bouton**, jamais cachés derrière.

---

## 1. État actuel — `src/pages/AvatarPicker.tsx`

```tsx
<DarkLayout scrollable hideTabBar className="flex flex-col px-[20px] pb-[32px]">
  <div className="pt-2 pb-[8px]">
    <button onClick={handleClose} className="bg-[#1b1d1f] p-[12px] rounded-[24px]" style={{ width: 44, height: 44 }}>
      <X size={20} ... />
    </button>
  </div>

  <h1 className="font-serif font-bold text-[24px] text-bg-1 mt-[20px] mb-[28px]">
    Choisis ton avatar
  </h1>

  <div className="grid grid-cols-4 gap-[12px] flex-1">
    {AVATARS.map(...)}
  </div>

  <div className="mt-[32px]">
    <button onClick={handleValidate} ...>Valider</button>
  </div>
</DarkLayout>
```

**Problèmes** :
- Le titre est sur sa propre ligne, sous la croix. Pas d'alignement croix ↔ titre.
- Quand on scrolle, le titre et la croix défilent avec le contenu et disparaissent en haut. Pas de "header sticky".
- Le bouton Valider est en flux normal en bas → quand la grille est plus haute que le viewport, il scrolle aussi, et il peut chevaucher les derniers avatars sans gradient pour adoucir la transition.

---

## 2. État cible

```
┌─────────────────────────────────────┐
│  [X]  Choisis ton avatar            │  ← header sticky, fond opaque #0c0c0c
├─────────────────────────────────────┤
│                                     │
│  ▢ ▢ ▢ ▢                           │  ← grille scrollable
│  ▢ ▢ ▢ ▢                           │
│  ▢ ▢ ▢ ▢                           │
│  ▢ ▢ ▢ ▢                           │
│         (scroll)                    │
│  ▢ ▢ ▢ ▢                           │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  ← gradient transparent → #0c0c0c
│         [   Valider   ]             │  ← CTA sticky, fond #0c0c0c, safe-area
└─────────────────────────────────────┘
```

---

## 3. Implémentation

### 3.1 Header sticky — croix + titre alignés

Référence visuelle : la barre du haut de `Friends.tsx` (back button + titre + bouton +). Sauf qu'ici on a juste croix + titre, et il faut le rendre **sticky** avec un fond opaque.

Remplacer :
```tsx
<div className="pt-2 pb-[8px]">
  <button onClick={handleClose} ...>
    <X ... />
  </button>
</div>

<h1 className="font-serif font-bold text-[24px] text-bg-1 mt-[20px] mb-[28px]">
  Choisis ton avatar
</h1>
```

par :
```tsx
{/* Header sticky — croix + titre alignés, fond opaque pour masquer le scroll dessous */}
<div
  className="sticky top-0 z-20 -mx-[20px] px-[20px] pt-2 pb-[12px] bg-[#0c0c0c] flex items-center gap-[12px]"
>
  <button
    onClick={handleClose}
    aria-label="Fermer sans sauvegarder"
    className="bg-[#1b1d1f] p-[12px] rounded-[24px] flex items-center justify-center shrink-0"
    style={{ width: 44, height: 44 }}
  >
    <X size={20} color="#f1f4fb" strokeWidth={2} />
  </button>
  <h1 className="font-serif font-bold text-[24px] text-bg-1 leading-tight">
    Choisis ton avatar
  </h1>
</div>
```

**Notes** :
- `sticky top-0` colle la barre en haut quand on scrolle (fonctionne car parent a `overflow-y-auto` via `scrollable`).
- `-mx-[20px] px-[20px]` étend le fond noir sur toute la largeur (le parent a un `px-[20px]` qu'on neutralise).
- `bg-[#0c0c0c]` est le fond du dark layout — opaque, donc le contenu qui scrolle dessous est invisible.
- `gap-[12px]` espace la croix et le titre. Le titre n'est pas centré : il est aligné à gauche, juste à côté de la croix, comme dans la screenshot du brief de l'utilisateur.
- `z-20` reste au-dessus de la grille (qui est en flux normal, z-auto).

### 3.2 Padding bas de la grille pour ne pas être cachée par le bouton Valider

La grille n'a plus besoin de `flex-1` (qui n'a de sens qu'avec un parent `flex-col` à hauteur fixe). Le scroll se fait au niveau du DarkLayout entier.

Remplacer :
```tsx
<div className="grid grid-cols-4 gap-[12px] flex-1">
```

par :
```tsx
<div
  className="grid grid-cols-4 gap-[12px] mt-[24px]"
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)' }}
>
```

`120px` correspond à : ~52px hauteur du bouton Valider + 16px padding interne du sticky bottom + ~20px de fade gradient + marge confort. La grille peut maintenant scroller jusqu'à ce que ses derniers avatars apparaissent **bien au-dessus** du bouton Valider sticky.

### 3.3 Bouton Valider sticky en bas avec gradient

Référence visuelle : le CTA de la modale séance dans `Program.tsx` (cherche `cta-bottom-safe` pour trouver le pattern exact).

Remplacer :
```tsx
<div className="mt-[32px]">
  <button onClick={handleValidate} ...>
    {saving ? 'Enregistrement…' : 'Valider'}
  </button>
</div>
```

par :
```tsx
{/* CTA sticky — gradient fade pour masquer le contenu qui scrolle dessous */}
<div
  className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none"
  style={{
    backgroundImage: 'linear-gradient(to bottom, rgba(12,12,12,0) 0%, #0c0c0c 32%)',
  }}
>
  <div className="px-[20px] pt-8 pointer-events-auto cta-bottom-safe">
    <button
      onClick={handleValidate}
      disabled={!hasChanged || saving}
      aria-label="Valider la sélection d'avatar"
      className="w-full rounded-[12px] p-[16px] font-sans font-semibold text-[16px] transition-opacity"
      style={{
        backgroundColor: hasChanged ? '#ffee8c' : 'rgba(255,238,140,0.25)',
        color: hasChanged ? '#1b1d1f' : 'rgba(27,29,31,0.5)',
        cursor: hasChanged && !saving ? 'pointer' : 'default',
      }}
    >
      {saving ? 'Enregistrement…' : 'Valider'}
    </button>
  </div>
</div>
```

**Notes** :
- `fixed bottom-0` ancre le CTA au bas du viewport (pas au bas du DarkLayout scrollable).
- `pointer-events-none` sur le wrapper laisse passer les clics sur la grille à travers la zone du gradient. `pointer-events-auto` sur le child le réactive uniquement sur le bouton.
- `cta-bottom-safe` est une classe utilitaire déjà définie dans `src/styles/index.css` qui ajoute `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px)` — elle gère le home indicator iPhone.
- `z-30` met le CTA au-dessus de la grille, mais en-dessous d'éventuelles modales d'erreur (qui sont en `z-[9999]`).
- Le gradient va de transparent (haut) à `#0c0c0c` opaque (bas, au niveau du bouton). 32% du chemin pour atteindre l'opaque → fade doux sur ~16px puis solide.

### 3.4 Nettoyage du DarkLayout

Le `pb-[32px]` dans `className="...px-[20px] pb-[32px]"` n'a plus de sens (le padding bottom est désormais géré par la grille elle-même). Retire-le :

```tsx
<DarkLayout scrollable hideTabBar className="px-[20px]">
```

Le `flex flex-col` n'est plus utile non plus puisque la grille n'utilise plus `flex-1`. Retire-le aussi.

---

## 4. Cas particuliers / pièges

- **`sticky` ne marche pas si un ancêtre a `overflow: hidden`**. Vérifie que `DarkLayout scrollable` produit bien `overflow-y-auto` (regarde `src/components/layout/DarkLayout.tsx`). Si oui, le sticky fonctionne. Sinon, signaler.
- **iOS Safari + `position: sticky`** : ça marche correctement depuis iOS 13+. Pas de hack nécessaire.
- **Le bouton Valider est `fixed` mais le `disabled` doit rester réactif** : `hasChanged` est calculé à chaque render, pas de souci de stale closure.
- **Empty state** : si l'utilisateur n'a sélectionné aucun avatar différent (`hasChanged === false`), le bouton reste visible mais grisé/non-cliquable, comme actuellement.

---

## 5. Validation

### 5.1 Typecheck
```bash
npx tsc --noEmit -p tsconfig.json
```

### 5.2 Test manuel

1. Ouvre `/profile`, tap sur ton avatar → tu arrives sur `/profile/avatar`.
2. Vérifie le header : la croix `X` et le texte "Choisis ton avatar" sont **sur la même ligne**, alignés verticalement.
3. Scrolle la grille vers le bas : le header reste **figé en haut**, la grille passe dessous (le fond noir du header masque ce qui scrolle dessous).
4. Continue à scroller : le bouton Valider reste **figé en bas**, avec un dégradé qui adoucit la transition entre les derniers avatars et le bouton.
5. Arrivé en bas de la grille : les derniers avatars doivent être **entièrement visibles au-dessus du bouton**, pas tronqués.
6. Tap sur un avatar différent → le bouton Valider devient jaune et cliquable.
7. Tap sur Valider → enregistrement OK, retour à `/profile`.

### 5.3 Commit

Message proposé :
```
fix(avatar-picker): header sticky + CTA sticky pour cohérence avec les autres pages

- Croix X et titre "Choisis ton avatar" alignés sur la même ligne, header sticky
  avec fond #0c0c0c opaque pour masquer le contenu qui scrolle dessous
- Grille d'avatars en scroll naturel, paddingBottom de 120px + safe-area pour
  que les derniers avatars restent visibles au-dessus du CTA sticky
- Bouton Valider en position fixed bottom avec gradient fade, comme les autres
  modales fullscreen de l'app (cf. previewWorkout dans Program.tsx)
```
