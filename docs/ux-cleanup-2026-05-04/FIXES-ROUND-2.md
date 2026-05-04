# Round 2 — Corrections après Round 1

> Round 1 (BRIEF.md) appliqué par Claude Code. 2 problèmes restants remontés par
> Pestakle après tests sur device. À corriger avant de considérer le round livré.

---

## Issue 1 — Gradient haut trop visible (ligne qui se dessine)

### Symptôme
Sur la page `/programs` (liste) et dans les modales programme/séance, le dégradé blanc opaque ajouté en haut pour masquer le texte derrière la status bar **descend trop bas** et **crée une ligne horizontale visible** où le dégradé se termine. Plutôt que d'être imperceptible, on voit nettement la frontière entre la zone "dégradée" et le reste de la page.

### Cause
Le gradient actuel a un point d'arrêt intermédiaire à 60% / 0.92 d'opacité, qui crée un plateau d'opacité presque pleine sur les premiers ~66% de la hauteur, puis chute abruptement de 0.92 → 0 sur les 34% restants. Cette chute brutale dessine une ligne. En plus, la hauteur totale (`env() + 56px` ≈ 110px sur iPhone 16 Pro) est trop grande — elle déborde largement sous la Dynamic Island.

### Fix
Dans **chaque endroit** où le gradient a été ajouté (cf. §5 du BRIEF.md — liste `/programs`, modale `previewProgram`, modale `previewWorkout`) :

- Réduire la hauteur : `calc(env(safe-area-inset-top, 0px) + 16px)` au lieu de `+ 56px`. Ça couvre la status bar + 16px de marge, point.
- Simplifier le gradient en une vraie progression linéaire sans palier intermédiaire, et avec une légère "fonte" sur les derniers pixels :
  ```ts
  backgroundImage: 'linear-gradient(to bottom, rgba(241,244,251,1) 0%, rgba(241,244,251,0.85) 70%, rgba(241,244,251,0) 100%)',
  ```
  La transition `1 → 0.85 → 0` reste douce et la ligne disparaît. La majorité de la hauteur reste opaque pour bien masquer le texte sous la status bar, et seuls les ~30% du bas font le fade.

**Avant/après attendu** : la zone du haut reste lisiblement opaque sur les 16-18 premiers px (couvre l'heure, la batterie, les antennes), puis fade en douceur sur les ~6-8 px suivants. Aucune frontière visible. La page apparaît comme si la status bar avait juste un léger effet de vignettage en dessous.

> **Note** : si après ce fix tu trouves que le résultat est encore trop "fort" sur certains écrans, n'hésite pas à passer le `0.85` à `0.7` pour plus de subtilité — mais ne descends pas en dessous de `0.6`, sinon le texte qui scrolle dessous redevient visible derrière la status bar.

---

## Issue 2 — Photos d'amis : toujours Superman par défaut

### Symptôme
Après le Round 1, dans :
- `/profile` → carte "Amis" (mini-avatars empilés)
- `/profile/friends` → liste d'amis (avatars 48px)
- `/profile/friends/:id` → profil d'un ami (avatar 120px)

…les amis affichent **tous le même Superman**, alors qu'ils sont connectés via Google OAuth et ont donc une photo de profil Google.

### Cause
Le code applique correctement `resolveAvatarSrc(profile)` (priorité `avatar_url > avatar_id > Superman`). Le helper retombe sur Superman parce que :
- `profiles.avatar_url` est **null** pour tous les amis (la colonne existe — sinon les requêtes auraient toutes échoué — mais elle n'est jamais alimentée).
- `profiles.avatar_id` reste sur le défaut `'superman'` (cf. `supabase/migrations/20260402_friendships.sql` ligne 12 : `avatar_id TEXT DEFAULT 'superman'`).

L'app ne sait pas que les utilisateurs ont une photo Google parce que celle-ci vit dans `auth.users.raw_user_meta_data->>'avatar_url'` (ou `'picture'` selon le provider) et n'est jamais copiée dans `public.profiles`.

### Fix

Trois pas à appliquer dans cet ordre, dans Supabase.

#### 2.1 Migration — backfill des `avatar_url` existants depuis l'OAuth metadata

Crée le fichier `supabase/migrations/20260504_backfill_avatar_url_from_oauth.sql` :

```sql
-- Migration: 20260504_backfill_avatar_url_from_oauth.sql
-- Recopie les photos de profil OAuth (Google, etc.) depuis auth.users.raw_user_meta_data
-- vers profiles.avatar_url pour les comptes qui n'ont pas encore de photo perso.

UPDATE public.profiles p
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
FROM auth.users u
WHERE u.id = p.id
  AND p.avatar_url IS NULL
  AND COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ) IS NOT NULL;
```

`COALESCE` couvre les deux clés possibles : Google OAuth Supabase utilise généralement `avatar_url`, mais on prend `picture` en fallback si jamais.

#### 2.2 Migration — trigger pour synchroniser à chaque connexion / nouvel utilisateur

Crée le fichier `supabase/migrations/20260504_sync_avatar_url_trigger.sql` :

```sql
-- Migration: 20260504_sync_avatar_url_trigger.sql
-- Garantit que profiles.avatar_url est tenu à jour avec la photo OAuth la plus
-- récente :
--  - À la création d'un nouveau profil → recopie depuis auth.users.
--  - À chaque mise à jour de auth.users (refresh token, re-link OAuth) → idem,
--    UNIQUEMENT si profiles.avatar_url est vide ou égal à l'ancienne valeur OAuth
--    (on respecte une éventuelle photo uploadée manuellement par l'utilisateur).

-- ============================================================
-- Helper : extrait l'URL OAuth depuis raw_user_meta_data
-- ============================================================
CREATE OR REPLACE FUNCTION public.oauth_avatar_url(user_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture'
  )
  FROM auth.users
  WHERE id = user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- Trigger 1 : à la création d'une ligne profiles, hydrate avatar_url
-- ============================================================
CREATE OR REPLACE FUNCTION public.populate_avatar_url_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.avatar_url IS NULL THEN
    NEW.avatar_url := public.oauth_avatar_url(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_populate_avatar_url ON public.profiles;
CREATE TRIGGER profiles_populate_avatar_url
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_avatar_url_on_profile_insert();

-- ============================================================
-- Trigger 2 : à chaque update de auth.users, propage la photo OAuth si elle a
-- changé ET si profiles.avatar_url est null OU égal à l'ancienne photo OAuth
-- (pas une photo perso uploadée par l'utilisateur).
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_avatar_url_from_auth()
RETURNS TRIGGER AS $$
DECLARE
  new_oauth_url TEXT;
  old_oauth_url TEXT;
BEGIN
  new_oauth_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  old_oauth_url := COALESCE(
    OLD.raw_user_meta_data->>'avatar_url',
    OLD.raw_user_meta_data->>'picture'
  );

  IF new_oauth_url IS NOT NULL AND new_oauth_url IS DISTINCT FROM old_oauth_url THEN
    UPDATE public.profiles
    SET avatar_url = new_oauth_url,
        updated_at = now()
    WHERE id = NEW.id
      AND (avatar_url IS NULL OR avatar_url = old_oauth_url);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auth_users_sync_avatar_url ON auth.users;
CREATE TRIGGER auth_users_sync_avatar_url
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_avatar_url_from_auth();
```

> Si Supabase refuse les triggers sur `auth.users` (RLS strict du schéma auth), on tombera back sur juste le trigger #1 (insert profiles) + le backfill 2.1, et on accepte que la photo OAuth ne se rafraîchisse plus automatiquement après le premier login. Pour ce projet en early stage c'est acceptable.

#### 2.3 Appliquer les migrations

```bash
npx supabase db push
```

Ou via le dashboard Supabase → SQL Editor → coller le contenu de chaque fichier dans l'ordre (2.1 puis 2.2).

#### 2.4 Vérification post-migration

Après application, lance cette requête dans le SQL Editor pour vérifier qu'au moins quelques `avatar_url` ont été remplis :

```sql
SELECT
  p.id,
  p.username,
  CASE
    WHEN p.avatar_url IS NULL THEN 'NULL'
    WHEN length(p.avatar_url) > 60 THEN substring(p.avatar_url, 1, 60) || '...'
    ELSE p.avatar_url
  END AS avatar_url_preview,
  p.avatar_id
FROM public.profiles p
ORDER BY p.username;
```

Au moins les utilisateurs connectés via Google devraient avoir une URL `https://lh3.googleusercontent.com/...` dans `avatar_url`. Si une majorité reste à `NULL`, c'est probablement que ces utilisateurs n'ont pas de photo Google (compte sans photo, ou méthode de connexion sans avatar) — dans ce cas, le fallback `avatar_id` reste correct, et il faudra envisager dans un futur round l'upload custom dans `AvatarPicker`.

#### 2.5 Test côté app

1. Reload l'app dans le navigateur (ou redémarre `npm run dev`).
2. Va sur `/profile` → la carte "Amis" doit maintenant afficher les vraies photos Google des 2 amis empilés.
3. Va sur `/profile/friends` → @lu_vtrr et @nahui doivent avoir leur photo Google.
4. Tap sur un ami → son profil affiche l'avatar 120px en photo Google.
5. Va sur `/community` → les avatars participants doivent aussi être en photo Google.

**Si après ces étapes les avatars sont toujours en Superman, c'est que les amis n'ont littéralement PAS de photo Google dans leur compte** (ou qu'ils se sont connectés via une autre méthode). Dans ce cas, le comportement actuel est correct et il faudra prévoir un upload custom plus tard.

---

## Validation finale Round 2

1. `npx tsc --noEmit -p tsconfig.json` → 0 erreur.
2. Vérification gradient sur device : pas de ligne visible, la zone status bar reste lisiblement masquée.
3. Vérification §2.4 (SQL) que les `avatar_url` sont peuplés.
4. Vérification §2.5 (app) que les vrais avatars s'affichent.
5. Commit séparé du Round 1, message proposé :

```
fix(ux): round 2 — gradient haut adouci + sync avatar_url depuis OAuth Google

- Gradient status bar : hauteur réduite (env+16px) + stops simplifiés
  pour supprimer la ligne visible signalée sur device
- Migrations Supabase :
  - 20260504_backfill_avatar_url_from_oauth.sql — recopie les photos
    Google des comptes existants depuis auth.users.raw_user_meta_data
  - 20260504_sync_avatar_url_trigger.sql — trigger BEFORE INSERT sur
    profiles + AFTER UPDATE sur auth.users pour maintenir avatar_url à jour
- Pas de changement code app (resolveAvatarSrc déjà en place)
```

6. Mémoire à mettre à jour : ajouter une entrée dans `memory/decisions.md` :

```
### 2026-05-04 — Sync auto avatar_url depuis OAuth Google
**Contexte** : après Round 1 UX cleanup, les amis affichaient toujours Superman
parce que profiles.avatar_url restait à NULL pour tout le monde — la photo
Google vit dans auth.users.raw_user_meta_data et n'était jamais copiée.
**Décision** : 2 migrations — un backfill UPDATE pour les comptes existants,
+ un trigger BEFORE INSERT sur profiles et AFTER UPDATE sur auth.users qui
recopie raw_user_meta_data->>'avatar_url' (fallback ->>'picture'). Le trigger
respecte les photos uploadées manuellement (ne réécrit que si profiles.avatar_url
est null ou égal à l'ancienne URL OAuth).
**Alternative rejetée** : faire la résolution côté app (jointure avec auth.users
à chaque fetch) — plus lent, plus complexe, et auth.users est en RLS strict
côté client. La sync DB est invisible et performante.
```
