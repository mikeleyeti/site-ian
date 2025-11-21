-- ============================================
-- Migration: Ajout de la table public_events
-- Pour gérer les événements publics de la timeline
-- ============================================

-- Créer la table pour les événements publics
CREATE TABLE IF NOT EXISTS public_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Référence à l'utilisateur créateur
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Informations sur le créateur (dénormalisées pour performance)
    author_name TEXT,
    author_email TEXT,

    -- Données de l'événement
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    objective TEXT NOT NULL,
    description TEXT,
    link TEXT,

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS public_events_user_id_idx ON public_events(user_id);
CREATE INDEX IF NOT EXISTS public_events_date_idx ON public_events(date);
CREATE INDEX IF NOT EXISTS public_events_type_idx ON public_events(type);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Activer RLS
ALTER TABLE public_events ENABLE ROW LEVEL SECURITY;

-- Policy: Tous les utilisateurs authentifiés peuvent lire les événements publics
CREATE POLICY "Authenticated users can read public events"
    ON public_events
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Les utilisateurs peuvent créer leurs propres événements
CREATE POLICY "Users can insert own events"
    ON public_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres événements
CREATE POLICY "Users can update own events"
    ON public_events
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres événements
CREATE POLICY "Users can delete own events"
    ON public_events
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Trigger pour auto-update des timestamps
-- ============================================

CREATE TRIGGER update_public_events_updated_at
    BEFORE UPDATE ON public_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Instructions d'application
-- ============================================
-- Copiez et exécutez ce SQL dans l'éditeur SQL de Supabase
-- Dashboard -> SQL Editor -> New Query -> Coller et Exécuter
-- ============================================
