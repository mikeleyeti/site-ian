-- ============================================
-- Script de correction pour les tables
-- Supprime et recrée les tables avec gen_random_uuid()
-- ============================================

-- Supprimer les anciennes tables si elles existent
DROP TABLE IF EXISTS actualites CASCADE;
DROP TABLE IF EXISTS public_events CASCADE;

-- Maintenant, exécuter les scripts de migration dans l'ordre :
-- 1. supabase-public-events-migration.sql
-- 2. supabase-actualites-migration.sql

-- ============================================
-- Instructions
-- ============================================
-- 1. Exécuter ce script dans l'éditeur SQL de Supabase
-- 2. Ensuite, exécuter supabase-public-events-migration.sql
-- 3. Enfin, exécuter supabase-actualites-migration.sql
-- ============================================
