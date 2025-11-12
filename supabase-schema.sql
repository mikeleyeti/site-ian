-- ============================================
-- IAN - Écosystème Interactif
-- Supabase Database Schema Migration
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Private user data)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- IAN Profile (stored as JSONB for flexibility)
    ian_profile JSONB DEFAULT '{}'::jsonb,

    -- Arrays of user data
    directory_profiles JSONB DEFAULT '[]'::jsonb,
    newsletters JSONB DEFAULT '[]'::jsonb,
    actualites JSONB DEFAULT '[]'::jsonb,
    usages JSONB DEFAULT '[]'::jsonb,
    contacts JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS users_id_idx ON users(id);

-- ============================================
-- 2. PUBLIC_DIRECTORY TABLE (Public profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public_directory (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- User identification
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Public profile fields
    display_name TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    discipline TEXT,
    department TEXT,
    academic_email TEXT,
    objectives TEXT,
    avatar TEXT,

    -- Metadata
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS public_directory_id_idx ON public_directory(id);
CREATE INDEX IF NOT EXISTS public_directory_user_id_idx ON public_directory(user_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_directory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Policy: Users can only read their own data
CREATE POLICY "Users can read own data"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
    ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own data
CREATE POLICY "Users can delete own data"
    ON users
    FOR DELETE
    USING (auth.uid() = id);

-- ============================================
-- PUBLIC_DIRECTORY TABLE POLICIES
-- ============================================

-- Policy: Authenticated users can read all public profiles
CREATE POLICY "Authenticated users can read public directory"
    ON public_directory
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Users can insert their own public profile
CREATE POLICY "Users can insert own public profile"
    ON public_directory
    FOR INSERT
    WITH CHECK (auth.uid() = id AND auth.uid() = user_id);

-- Policy: Users can update their own public profile
CREATE POLICY "Users can update own public profile"
    ON public_directory
    FOR UPDATE
    USING (auth.uid() = id AND auth.uid() = user_id)
    WITH CHECK (auth.uid() = id AND auth.uid() = user_id);

-- Policy: Users can delete their own public profile
CREATE POLICY "Users can delete own public profile"
    ON public_directory
    FOR DELETE
    USING (auth.uid() = id AND auth.uid() = user_id);

-- ============================================
-- 4. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for public_directory table
CREATE TRIGGER update_public_directory_updated_at
    BEFORE UPDATE ON public_directory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. FONCTION OPTIONNELLE (NON UTILISÉE)
-- ============================================

-- Note: La création des profils utilisateur est gérée directement
-- dans le code JavaScript (supabase-service.js) après l'inscription.
-- Cela évite les conflits avec les politiques RLS et donne plus de contrôle.

-- Si vous souhaitez quand même utiliser un trigger automatique,
-- décommentez le code ci-dessous :

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, ian_profile, directory_profiles, newsletters, actualites, usages, contacts, last_updated)
    VALUES (
        NEW.id,
        '{}'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        NOW()
    );

    -- Insert into public_directory table
    INSERT INTO public.public_directory (id, user_id, display_name, email, last_updated)
    VALUES (
        NEW.id,
        NEW.id,
        NEW.raw_user_meta_data->>'display_name',
        NEW.email,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
*/

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query -> Paste and Run
-- ============================================
