-- ============================================
-- Script de correction pour l'inscription
-- ============================================
-- Exécutez ce script pour corriger le problème
-- d'inscription qui bloque à cause des politiques RLS
-- ============================================

-- Étape 1 : Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Étape 2 : Créer la nouvelle fonction avec SECURITY DEFINER
-- Cette fonction contourne les politiques RLS lors de la création des profils
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
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 3 : Créer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Vérification
-- ============================================

-- Vérifier que le trigger existe
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- Devrait retourner 1 ligne avec tgenabled = 'O' (Originale, activé)

-- Vérifier que la fonction existe
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
-- Devrait retourner 1 ligne avec prosecdef = true (SECURITY DEFINER)

-- ============================================
-- TERMINÉ
-- ============================================
-- Le trigger est maintenant configuré correctement.
-- Les profils seront créés automatiquement lors de l'inscription.
-- ============================================
