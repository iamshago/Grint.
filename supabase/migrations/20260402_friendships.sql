-- Migration: 20260402_friendships.sql
-- Création des tables profiles et friendships + fonctions utilitaires

-- ============================================================
-- TABLE: profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_id TEXT DEFAULT 'superman',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture publique : tout le monde peut voir les profils
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Mise à jour : uniquement son propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Insertion : uniquement pour son propre id
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: friendships
-- ============================================================

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement ses propres relations (envoyées ou reçues)
CREATE POLICY "Users can see their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Insertion : uniquement en tant que demandeur
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Mise à jour : uniquement les demandes reçues (pour accepter/refuser)
CREATE POLICY "Users can update friendships addressed to them"
  ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

-- Suppression : les deux parties peuvent supprimer la relation
CREATE POLICY "Users can delete their own friend requests"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============================================================
-- FUNCTION: check_username_available
-- Vérifie si un username est disponible (utilisé dans le popup de création)
-- ============================================================

CREATE OR REPLACE FUNCTION check_username_available(desired_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = desired_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: search_users_by_username
-- Recherche des utilisateurs par username (utilisé dans le popup "Ajouter un ami")
-- Exclut l'utilisateur courant des résultats
-- ============================================================

CREATE OR REPLACE FUNCTION search_users_by_username(search_query TEXT)
RETURNS TABLE(id UUID, username TEXT, display_name TEXT, avatar_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_id
  FROM profiles p
  WHERE p.username ILIKE '%' || search_query || '%'
    AND p.id != auth.uid()
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
