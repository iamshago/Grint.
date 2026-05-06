# BRIEF — Ajouter en ami depuis le profil d'un participant au défi

## Contexte

Sur la page **Communauté** (`/community`, Figma `427:1644`), des participants rejoignent un défi. L'utilisateur veut :

1. **Cliquer sur un participant** → arriver sur son profil
2. **Sur le profil**, si pas encore amis, voir « Ajouter en ami » qui envoie une demande
3. Si la personne nous a déjà envoyé une demande, voir directement « Accepter » / « Refuser » sur son profil

Le profil ami existe déjà à `/profile/friends/:id` (Figma `390:1107`, dark mode). On va **généraliser cette route** pour gérer 4 états : `not_friend`, `pending_outgoing`, `pending_incoming`, `friends`.

⚠️ **La page liste d'amis** (`/profile/friends`, Figma `383:1973`) a été cassée le 2026-05-04. **Ne pas y toucher**. Modifier UNIQUEMENT la route détail `/profile/friends/:id`.

## Changement demandé

### Partie 1 — Liste de participants (page Communauté)

- Sur la page `/community`, dans la carte/section qui liste les participants du défi, rendre **toute la ligne (avatar + nom)** cliquable
- Au tap → navigation vers `/profile/friends/:id` avec l'`id` du participant
- Touch target ≥ 44x44px (cf. règles UX CLAUDE.md)
- Optionnel : léger active state au tap pour feedback tactile

### Partie 2 — Profil ami généralisé (`/profile/friends/:id`)

| État relation | Visible UI | Comportement clic |
|---|---|---|
| `not_friend` | Bouton **« Ajouter en ami »** primary (gold `#ffee8c` sur dark) | INSERT `friendships` (user_a=moi, user_b=lui, status='pending') |
| `pending_outgoing` (j'ai envoyé) | Bouton **« Demande envoyée »** disabled grisé | Aucun (non cliquable) |
| `pending_incoming` (il m'a envoyé) | Boutons **« Accepter »** primary + **« Refuser »** secondary/ghost côte à côte | Accepter : UPDATE status='accepted'. Refuser : DELETE ligne |
| `friends` | État actuel de la page (rien ou « Retirer ») | Ne pas régresser le comportement existant |

#### États post-action (sans rechargement complet)

- Clic « Ajouter en ami » → bouton bascule immédiatement en **« Demande envoyée »** disabled (optimistic UI). En cas d'échec serveur → revert + toast d'erreur.
- Clic « Accepter » → page bascule en `friends` (boutons accepter/refuser disparaissent)
- Clic « Refuser » → page bascule en `not_friend` (« Ajouter en ami » réapparaît)

#### Race condition (demandes croisées)

Si A envoie une demande à B au moment précis où B en envoie une à A : la base ne doit pas avoir deux lignes `pending` croisées. Solution : **avant tout INSERT pending, vérifier si une demande inverse existe ; si oui, faire un UPDATE direct vers `accepted`** (les deux ont consenti). À implémenter dans le service front ou via trigger Supabase.

### Partie 3 — Schéma BDD `friendships`

Vérifier l'existence et le schéma de la table `friendships`. Schéma attendu minimum :

```sql
friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- demandeur
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- destinataire
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b)
);
CREATE INDEX idx_friendships_userb_status ON friendships(user_b, status);
```

- Si la table n'existe pas → migration via `@agent-supabase-architect`
- Si elle existe avec un schéma différent → s'aligner sur l'existant, ne pas casser
- **Refus = DELETE de la ligne** (pas de statut `'declined'`), permet de re-tenter plus tard

#### Fonction utilitaire `getFriendshipStatus(currentUserId, otherUserId)`

Retourne : `'not_friend' | 'pending_outgoing' | 'pending_incoming' | 'friends'`

```sql
SELECT * FROM friendships
WHERE (user_a = me AND user_b = other)
   OR (user_a = other AND user_b = me)
LIMIT 1;
```

- Aucune ligne → `not_friend`
- `status = 'accepted'` → `friends`
- `status = 'pending'` AND `user_a = me` → `pending_outgoing`
- `status = 'pending'` AND `user_a = other` → `pending_incoming`

#### RLS (Row Level Security) Supabase

- INSERT : autorisé uniquement si `auth.uid() = user_a`
- UPDATE (status pending → accepted) : autorisé uniquement si `auth.uid() = user_b` ET ligne actuelle en `pending`
- DELETE : autorisé si `auth.uid() = user_a` (annulation demande sortante) OU `auth.uid() = user_b` (refus / suppression d'ami)
- SELECT : autorisé si `auth.uid() IN (user_a, user_b)`

## Ce qu'on NE TOUCHE PAS

- ⛔ La **page liste d'amis** (`/profile/friends`, Figma `383:1973`) — interdite, scope hors-brief (incident 2026-05-04). Si un changement semble nécessaire pendant l'implémentation, **stopper et demander confirmation** avant toute modif.
- `public/assets/streak-flame.svg` → verrouillé per CLAUDE.md
- Reste de la page Communauté (feed, défi, barres de progression — autre brief) → inchangé
- Home, Workout Player, Profile own → inchangées sauf si nécessaire pour cohérence (composant partagé extrait)
- Routing global → inchangé (réutilise `/profile/friends/:id` existant, pas de nouvelle route)

## Validation visuelle obligatoire

Protocole « Jeu des 7 différences » de CLAUDE.md, à 402px de large, **dark mode** pour le profil :

### Page Communauté
1. Tap sur un participant (avatar OU nom) → bien naviguer vers `/profile/friends/:id` du bon utilisateur
2. Touch target visuel ≥ 44px de haut → ✅
3. Pas de régression sur le reste de la page

### `/profile/friends/:id` — tester les 4 états
4. État `not_friend` → bouton « Ajouter en ami » primary visible
5. État `pending_outgoing` → bouton « Demande envoyée » disabled, grisé, non cliquable
6. État `pending_incoming` → deux boutons « Accepter » (primary) + « Refuser » (secondary)
7. État `friends` → comportement actuel **non régressé** (vérifier sur un ami existant)
8. Transitions : « Ajouter en ami » → bouton bascule immédiatement (optimistic). Recharger : état persisté.
9. « Accepter » → bascule en `friends`. « Refuser » → bascule en `not_friend`.
10. Race condition : créer manuellement deux demandes croisées en BDD → INSERT promeut la relation à `accepted`, pas de doublon.

### Accessibilité
- `aria-label` explicite : « Envoyer une demande d'ami à [nom] », « Accepter la demande de [nom] », « Refuser la demande de [nom] »
- Contraste boutons ≥ 4.5:1 sur fond dark `#0C0C0C`
- Bouton disabled « Demande envoyée » → `aria-disabled="true"` ET `disabled` HTML

## Fichiers probablement concernés

(À confirmer en explorant — ne pas faire confiance aveuglément)

- **À modifier** :
  - `src/pages/Community.tsx` (ou `.jsx`) — rendre les participants cliquables
  - `src/pages/FriendProfile.tsx` (ou équivalent à `/profile/friends/:id`) — ajouter logique d'état + boutons
  - Composants `ParticipantRow` / `ParticipantList` dans `src/components/features/` si extraits
- **À créer** :
  - Composant `FriendStatusButton` (ou `RelationButton`) dans `src/components/features/`
  - Hook `useFriendshipStatus(otherUserId)` dans `src/hooks/` → `{ status, sendRequest, acceptRequest, declineRequest, isLoading }`
  - Migration Supabase si `friendships` n'existe pas
- ⛔ **À NE PAS toucher** :
  - `src/pages/Friends.tsx` (ou équivalent à `/profile/friends`, la liste)
  - `public/assets/streak-flame.svg`

## Subagent suggéré

- **Schéma BDD + RLS + types TS** : `@agent-supabase-architect` pour migration + policies
- **Implémentation UI** : direct, design system de CLAUDE.md
- **Tests** : `@agent-test-writer` pour `getFriendshipStatus` (4 cas + race condition)
- **Revue post-implémentation** : `@agent-code-reviewer` — qualité, accessibilité, **et confirmer qu'aucun fichier de la liste d'amis n'a été modifié**

## Décisions tranchées (locked)

| Sujet | Décision |
|-------|----------|
| Route pour profil non-ami | **Généraliser `/profile/friends/:id`** (pas de nouvelle route, pas de modal) |
| État après envoi de demande | **« Demande envoyée »** disabled grisé (pas d'option d'annulation V1) |
| Cas demande reçue | **« Accepter » + « Refuser »** côte à côte directement sur le profil |
| Zone cliquable participants | **Avatar + nom (toute la ligne)** |
| Refus d'une demande | **DELETE** la ligne (pas de statut `'declined'`) |
| Race condition (demandes croisées) | Promouvoir directement à `accepted` (pas de doublon) |

## Questions ouvertes (résoudre pendant l'implémentation)

- Composant profil détail existe-t-il sous `FriendProfile.tsx` ou autre nom ? grep avant de coder.
- Table `friendships` existe-t-elle déjà avec ce schéma ? Vérifier via `@agent-supabase-architect` ou `list_tables`.
- Avatars participants stockés dans `profiles.avatar_url` ? Si oui, l'utiliser ; sinon fallback initiales.
