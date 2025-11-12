-- ============================================
-- Script de nettoyage et correction
-- ============================================
-- Exécutez ce script si vous avez déjà exécuté
-- la version précédente de supabase-schema.sql
-- et que l'inscription bloque
-- ============================================

-- Supprimer le trigger automatique s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer la fonction s'elle existe
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- Vérification (optionnel)
-- ============================================

-- Vérifier que le trigger est bien supprimé
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- Devrait retourner 0 lignes

-- Vérifier que la fonction est bien supprimée
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
-- Devrait retourner 0 lignes

-- ============================================
-- TERMINÉ
-- ============================================
-- La création des profils est maintenant gérée
-- directement dans le code JavaScript
-- (supabase-service.js fonction signUp)
-- ============================================
