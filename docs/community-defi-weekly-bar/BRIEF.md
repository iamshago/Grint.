# BRIEF — Barre de progression hebdomadaire collective sur la page Défi

## Contexte

Page concernée : **Communauté** (route `/community`, Figma `427:1644`, light mode)
Section concernée : la **carte / bloc « Défi »** en haut de la page.

Aujourd'hui, le défi affiche **une seule barre de progression** : celle du quota total **collectif du groupe** sur toute la durée du défi (somme des séances de tous les participants vs cible totale).

Problème UX : aucune visualisation du **rythme hebdomadaire collectif**, alors que le défi impose un quota hebdo précis pour le groupe.

## Important — logique COLLECTIVE (groupe), pas individuelle

⚠️ Les deux barres représentent **l'avancement du GROUPE entier participant au défi**, pas celui de l'utilisateur seul.

## Changement demandé

Ajouter **une seconde barre de progression hebdomadaire collective** au-dessus de la barre totale existante, qui se **réinitialise chaque semaine**.

### Les deux barres, dans cet ordre vertical

1. **Barre HEBDO COLLECTIVE (nouveau)**
   - Label gauche : « Cette semaine »
   - Label droit : compteur format `X / N` sans le mot "séances" (ex. `14 / 21`)
   - Remplissage : `X / N` en pourcentage, plafonné à 100%
   - **Reset chaque lundi à 00:00 (heure locale utilisateur)**
   - **État « quota groupe atteint »** quand `X >= N` :
     - Barre pleine à 100%
     - Le compteur `X / N` passe en **couleur de succès saturée** (token `pr-1` `#ffee8c` saturé, ou vert si un token de succès existe déjà — au choix au moment de l'implémentation, en cohérence avec le design system)
     - **Pas** d'icône check, **pas** de label additionnel — uniquement le changement de couleur du compteur

2. **Barre TOTALE COLLECTIVE (existante)** — visuel inchangé, juste vérifier l'harmonie visuelle.

### Hiérarchie visuelle

- Hebdo : épaisseur ~8-10px, remplissage `#ffee8c` (token `pr-1`), fond track `#e6e8ed` (token `surface`)
- Totale : épaisseur ~6px, même palette
- Spacing entre les deux barres : ~16px minimum
- Labels : tokens typo Figtree existants (cf. CLAUDE.md)

### Cas du défi terminé (date de fin dépassée)

- **Masquer la barre hebdo**
- Garder uniquement la barre totale, idéalement avec un label « Défi terminé » ou état figé visuel cohérent avec ce qui existe déjà

## Source de données

### Quota hebdo collectif (`N`) — DEUX OPTIONS au choix de l'implémenteur

- **Option A — quota fixe stocké** : ajouter colonne `weekly_quota INTEGER NOT NULL` sur la table défi. Pour le défi actuel : `weekly_quota = 3 × nb_participants_attendus` ou valeur globale fixée. À privilégier si pas de précédent.
- **Option B — dérivé** : `weekly_quota = sessions_per_user_per_week × COUNT(challenge_participants)`. Stocker `sessions_per_user_per_week` (ex. 3). Plus flexible si participants évolutifs.

→ **À trancher selon ce qui existe déjà en BDD**. Si rien n'existe (défi mocké), partir sur Option A avec valeur fixe en seed.

### Compteur hebdo collectif (`X`)

```sql
-- Pseudo-query
SELECT COUNT(*)
FROM completed_workouts cw
JOIN challenge_participants cp ON cp.user_id = cw.user_id
WHERE cp.challenge_id = :current_challenge_id
  AND cw.completed_at >= :monday_00h_local_iso
  AND cw.completed_at <= :sunday_23h59_local_iso;
```

- Bornage `lundi 00:00 → dimanche 23:59` calculé **côté client** (Date locale utilisateur), passé à la query Supabase comme paramètres ISO timestamp.
- Si la table `challenge_participants` n'existe pas, la créer (ou utiliser la structure équivalente déjà en place pour la barre totale, qui doit déjà agréger sur le groupe).
- Filtrer les séances qui comptent pour le défi (si le défi cible certains types de workouts, respecter ce filtre).
- Recalcul live à chaque ouverture de la page Communauté.

## Ce qu'on NE TOUCHE PAS

- Le reste de la page Communauté (feed, autres défis le cas échéant, header) → inchangé
- La logique du streak Home (1 upper + 1 lower) → inchangée
- La barre totale collective existante → logique inchangée
- `public/assets/streak-flame.svg` → verrouillé per CLAUDE.md
- Page Profil > Liste d'amis → interdite (incident 2026-05-04, brief uniquement)
- **Pas de règle BBL ici** : ce défi est global, aucun override rose à implémenter

## Validation visuelle obligatoire

Protocole « Jeu des 7 différences » de CLAUDE.md, à 402px de large :

1. Screenshot Figma `427:1644` — référence
2. Screenshot de l'implémentation
3. Vérifier point par point :
   - Barre hebdo collective au-dessus de la totale → ✅
   - Label « Cette semaine » + compteur `X / N` (sans "séances") → ✅
   - Spacing ~16px entre les deux barres → ✅
   - Couleurs `#ffee8c` sur fond `#e6e8ed` (light mode) → ✅
   - 0 séance dans le groupe cette semaine → barre vide
   - X = N → pleine + compteur en couleur de succès saturée
   - X > N → toujours 100%, pas de débordement
   - Défi terminé → hebdo masquée, totale visible avec état "terminé"
4. Vérifier que la barre totale n'a pas régressé visuellement
5. Tester reset lundi (changer date système) → hebdo retombe à 0

## Fichiers probablement concernés

(À confirmer en explorant — ne pas faire confiance aveuglément)

- `src/pages/Community.tsx` (ou `.jsx` si pas migré)
- Composant `ChallengeCard` ou similaire dans `src/components/features/`
- Si extraction nécessaire : `ProgressBar` réutilisable dans `src/components/ui/` (vérifier d'abord qu'il n'existe pas)
- Hook potentiel : `useChallengeWeeklyProgress(challengeId)` dans `src/hooks/` (renvoie `{ X, N, isReached, isExpired }`)
- Migration Supabase si nécessaire

## Subagent suggéré

- Si migration BDD : `@agent-supabase-architect` pour migration + types TS + RLS
- Implémentation UI : direct, design system de CLAUDE.md
- Revue : `@agent-code-reviewer` (qualité, accessibilité `role="progressbar"` + `aria-valuenow`/`aria-valuemax`, design system)

## Décisions tranchées (locked)

| Sujet | Décision |
|-------|----------|
| Logique des barres | **Collective (groupe)**, pas individuelle |
| Format compteur hebdo | `X / N` sans le mot "séances" |
| État quota atteint | Compteur en **couleur de succès saturée**, pas d'icône check, pas de label |
| Défi terminé | **Masquer la hebdo**, garder la totale en "terminé" |
| Règle BBL rose | **Pas applicable** ici (défi non typé BBL) |
| Reset hebdo | **Lundi 00:00 heure locale** utilisateur |

## Questions ouvertes (résoudre pendant l'implémentation)

- Quota hebdo collectif : Option A (valeur fixe stockée) vs Option B (dérivée). Trancher selon ce qui existe déjà en BDD. Préférer Option A si pas de précédent.
- Existe-t-il déjà un composant `ProgressBar` réutilisable ? grep avant de créer.
