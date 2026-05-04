# Communauté V2 — Dossier de production

Tout ce que Claude Code doit savoir pour implémenter la refonte de l'onglet Communauté de Grint.

## Contenu

| Fichier | Rôle |
|---------|------|
| `BRIEF.md` | Spec complète — 3 pages, migrations Supabase, hooks, RLS, règles UX, ordre d'implémentation, décisions verrouillées |
| `01-community.png` | Screenshot Figma — page Communauté (node `551:1854`) |
| `02-rejoindre.png` | Screenshot Figma — page Rejoindre le défi (node `556:5995`) |
| `03-detail-defi.png` | Screenshot Figma — page Détail défi avec podium (node `553:2208`) |

## Micro-prompt (à copier-coller dans Claude Code)

```
Implémente la V2 de l'onglet Communauté en suivant docs/community-v2/BRIEF.md de bout en bout.
Toutes les décisions sont verrouillées au §9 — n'en repose aucune.
Ordre d'exécution : §8 (migrations Supabase d'abord, puis pages dans l'ordre).
Pour chaque page, applique le workflow figma-implement-design (get_design_context → screenshot → assets → adapt → jeu des 7 différences) sur les nodes 551:1854, 556:5995, 553:2208 (file XMTeGCX6yPiARJ0Z5jyeUr).
Respecte CLAUDE.md. Mets à jour memory/decisions.md et memory/progress.md à la fin.
```

## Variante longue (si la session Claude Code est fraîche, sans contexte)

```
Tu vas implémenter la refonte V2 de l'onglet Communauté de l'app Grint (mobile-first, React 19 + Vite + Supabase, codebase dans le repo courant).

1. Lis intégralement docs/community-v2/BRIEF.md — c'est ta source de vérité.
2. Lis aussi CLAUDE.md (conventions projet) et memory/decisions.md (décisions précédentes).
3. Toutes les décisions produit sont verrouillées au §9 du brief. N'en repose AUCUNE.
4. Suis l'ordre d'implémentation du §8 :
   a. Migrations Supabase (tables challenges, challenge_participants, posts, post_reactions, exercise_pr_records + trigger PR + RLS + backfill).
   b. Vérifie le trigger en simulant un INSERT user_progress qui dépasse l'ancien max → un row doit apparaître dans posts.
   c. Types TS + hooks (data layer).
   d. Page Communauté (réécriture totale de src/pages/Community.tsx — l'actuelle est l'ancien design).
   e. Page Détail défi (NEW).
   f. Page Rejoindre (NEW).
   g. Modale réacteurs.
   h. Branchement routes dans App.tsx (le placeholder 🚧 actuel est à remplacer).
5. Pour chaque page : workflow figma-implement-design complet (get_design_context → get_screenshot → assets → adapter aux conventions → jeu des 7 différences pixel-perfect avant de considérer terminé).
6. À la fin : update memory/decisions.md (entry "Communauté V2") et memory/progress.md (Phase 6 V2).

File Figma : XMTeGCX6yPiARJ0Z5jyeUr
Nodes : 551:1854 (Communauté), 556:5995 (Rejoindre), 553:2208 (Détail défi).
Photo hero du défi déjà déposée dans public/assets/challenges/kikicac-hero.jpg.

Si tu rencontres un blocage non couvert par le brief, demande-moi avant d'inventer.
```

## Notes opérationnelles

- Le défi initial `KikicacAvengers` est à seeder en base après les migrations. Le SQL est dans le §9.4 du brief avec un placeholder pour la `description` — Claude Code copie le texte exact depuis le node Figma `556:5995` au moment du seed (règle pixel-perfect §9.10).
- Les tables `profiles`, `friendships`, `user_progress`, `completed_workouts`, `workouts`, `exercises` existent déjà en prod. Ne pas les recréer.
- La page `/community` dans `App.tsx` (lignes 123-130) est un placeholder 🚧 — à remplacer par le vrai routing.
- Le composant `src/pages/Community.tsx` existant correspond à l'ancien design (carousel 3 défis + posts mockés) — réécriture totale.

## Si une page nouvelle vient s'ajouter dans le Figma

Refaire un round avec moi (Cowork) pour générer un brief complémentaire dans le même dossier (ex. `BRIEF-COMMUNITY-V3.md`). Garder ce dossier comme la source de vérité du tracking Communauté.
