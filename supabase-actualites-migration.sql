-- ============================================
-- Migration: Ajout de la table actualites
-- Pour gérer les actualités du numérique éducatif
-- ============================================

-- Créer la table pour les actualités publiques
CREATE TABLE IF NOT EXISTS actualites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Référence à l'utilisateur créateur
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Informations sur le créateur (dénormalisées pour performance)
    author_name TEXT,
    author_email TEXT,

    -- Données de l'actualité
    date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    tags TEXT, -- Stocké comme chaîne, séparé par des virgules

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS actualites_user_id_idx ON actualites(user_id);
CREATE INDEX IF NOT EXISTS actualites_date_idx ON actualites(date DESC);
CREATE INDEX IF NOT EXISTS actualites_priority_idx ON actualites(priority);
CREATE INDEX IF NOT EXISTS actualites_created_at_idx ON actualites(created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Activer RLS
ALTER TABLE actualites ENABLE ROW LEVEL SECURITY;

-- Policy: Tous les utilisateurs authentifiés peuvent lire les actualités
CREATE POLICY "Authenticated users can read actualites"
    ON actualites
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Les utilisateurs peuvent créer leurs propres actualités
CREATE POLICY "Users can insert own actualites"
    ON actualites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres actualités
CREATE POLICY "Users can update own actualites"
    ON actualites
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres actualités
CREATE POLICY "Users can delete own actualites"
    ON actualites
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Trigger pour auto-update des timestamps
-- ============================================

CREATE TRIGGER update_actualites_updated_at
    BEFORE UPDATE ON actualites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Instructions d'application
-- ============================================
-- Copiez et exécutez ce SQL dans l'éditeur SQL de Supabase
-- Dashboard -> SQL Editor -> New Query -> Coller et Exécuter
-- ============================================
