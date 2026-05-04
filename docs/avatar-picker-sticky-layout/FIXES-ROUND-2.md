# Round 2 — AvatarPicker : aligner sur le pattern "Record personnel"

> Round 1 (BRIEF.md de ce dossier) appliqué par Claude Code. Pestakle a comparé
> avec la modale `Record personnel` (PRPickerModal dans `src/pages/Profile.tsx`)
> et veut le même rendu propre, pas la version actuelle où le titre est énorme
> et collé à gauche.

---

## Référence visuelle — `Record personnel`

La modale `PRPickerModal` dans `src/pages/Profile.tsx` (autour de la ligne 1163) est exactement le rendu attendu :

```
┌─────────────────────────────────────┐
│  (X)         Record personnel       │  ← header sticky, X gauche, titre centré
├─────────────────────────────────────┤   ↑ même hauteur partout, sobre
│                                     │
│  ▢▢▢▢   contenu scrollable          │
│  ▢▢▢▢                               │
│         (scroll dessous)            │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  ← gradient fade
│         [   Valider   ]             │  ← CTA sticky bottom
└─────────────────────────────────────┘
```

Caractéristiques clés à reproduire dans AvatarPicker :
- **Bouton X** : 40×40 px, `bg-tx-1` (#1b1d1f), `rounded-[24px]`, icône X 16px blanche, ombre douce.
- **Titre** : `text-xl` (20px) — pas 24px ni 32px. Police PT Serif Bold. **Centré** dans la zone disponible via `flex-1 text-center`. Tracking `-0.6px`.
- **Spacer à droite** de 40 px de large pour équilibrer le X de gauche → le titre est mathématiquement centré dans la fenêtre.
- **Header en `flex items-center`** sur une seule ligne. Padding `px-4 pb-4 pt-2`.

---

## Issue 1 — Header du AvatarPicker pas aligné sur le pattern

### Symptôme
- Le titre `Choisis ton avatar` est en `text-[24px]` → trop gros par rapport aux autres pages de l'app.
- Le titre est aligné à gauche, juste à côté du X. Pas centré.
- Aucun spacer à droite → la mise en page ne respecte pas le rythme des autres modales.
- Le header n'est pas sticky de la même manière (le `bg-[#0c0c0c]` est OK mais le rendu diffère légèrement de la référence).

### Fix

Dans `src/pages/AvatarPicker.tsx`, remplacer le bloc header actuel par celui-ci, qui est calqué pixel-pour-pixel sur `PRPickerModal` (avec adaptation : on garde `sticky` au lieu de `flex-col shrink-0` puisque AvatarPicker utilise `DarkLayout scrollable` et non un wrapper flex `fixed inset-0`) :

```tsx
{/* Header sticky — calqué sur le pattern PRPickerModal (cf. Profile.tsx) */}
<div
  className="sticky top-0 z-20 -mx-[20px] px-4 pt-2 pb-4 bg-[#0c0c0c] flex items-center"
>
  <button
    onClick={handleClose}
    aria-label="Fermer sans sauvegarder"
    className="w-10 h-10 bg-tx-1 rounded-[24px] flex items-center justify-center shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] active:scale-95 transition-transform shrink-0"
  >
    <X size={16} className="text-bg-1" />
  </button>
  <h1 className="flex-1 text-center font-serif font-bold text-xl text-bg-1 tracking-[-0.6px]">
    Choisis ton avatar
  </h1>
  <div className="w-10 shrink-0" /> {/* Spacer pour équilibrer le X */}
</div>
```

Notes sur les différences vs la version Round 1 :
- `text-xl` (20px) au lieu de `text-[24px]`. Compacte et propre.
- `flex-1 text-center` sur le `<h1>` → titre centré dans l'espace entre le X et le spacer.
- `<div className="w-10 shrink-0" />` à la fin → équilibre le X de 40px à gauche.
- `w-10 h-10` (40×40) au lieu de `p-[12px]` + `style width 44 height 44` → matche le PRPickerModal exactement.
- `<X size={16}>` au lieu de `<X size={20}>` → matche la référence (icône plus petite, plus harmonieuse).
- `shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)]` ajouté sur le X → léger glow comme sur la modale Record personnel.
- `text-bg-1` sur le X (au lieu de `color="#f1f4fb"`) → cohérent avec les classes Tailwind du projet.
- `gap-[12px]` retiré : le `flex-1` du titre + le spacer `w-10` font tout le boulot.
- Padding header : `px-4 pb-4 pt-2` (matche pixel pour pixel `PRPickerModal`).

### Pourquoi ça marche

La structure `[X 40px][titre flex-1 centré][spacer 40px]` garantit que le titre est centré quelle que soit la longueur du texte. Le `text-xl` réduit la taille à 20px (vs 24px ou 32px en serif bold qui sont énormes pour un header de modale). Le résultat est sobre et identique au rendu de la page "Record personnel" que l'utilisateur veut comme référence.

---

## Issue 2 — Pas d'autre changement

Le reste du Round 1 est OK :
- Le bouton Valider sticky en bas avec gradient fade fonctionne déjà bien (même pattern que PRPickerModal lignes 1238-1252).
- Le `paddingBottom` de la grille pour ne pas être cachée derrière le CTA est OK.
- Le `cta-bottom-safe` gère le safe-area iPhone correctement.

**Ne pas toucher** au reste du fichier.

---

## Validation

### Typecheck
```bash
npx tsc --noEmit -p tsconfig.json
```

### Test manuel — comparaison côte-à-côte

1. Ouvre `/profile`, scroll jusqu'à la carte "Record personnel" jaune, tap → tu arrives sur la modale `PRPickerModal`. Note bien :
   - taille du titre,
   - taille et style du bouton X,
   - hauteur du header,
   - centrage du titre.
2. Ferme la modale, tap sur ton avatar en haut → tu arrives sur `/profile/avatar`.
3. Le header doit avoir **strictement la même apparence** que celui de `PRPickerModal` (à part le texte du titre lui-même).
4. Scroll la grille des avatars : le header reste sticky en haut, fond `#0c0c0c` opaque, ne bouge pas.
5. Tap sur un avatar différent → bouton Valider devient jaune et cliquable.
6. Tap Valider → retour `/profile`.

### Commit

Message proposé :
```
fix(avatar-picker): aligner le header sur le pattern PRPickerModal

- Titre passé de text-[24px] à text-xl (20px) — taille standard des modales
- Titre centré via flex-1 text-center + spacer w-10 à droite (équilibre le X)
- Bouton X passé en w-10 h-10 avec icône 16px et shadow douce — matche pixel
  pour pixel le bouton X de la modale Record personnel (Profile.tsx:1167)
- Padding header aligné px-4 pb-4 pt-2

Pas de changement sur le scroll, le sticky, ou le CTA bottom — déjà OK depuis
le Round 1.
```
