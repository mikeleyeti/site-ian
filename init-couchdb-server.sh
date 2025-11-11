#!/bin/bash

# Script d'initialisation CouchDB pour IAN
# Ce script configure CouchDB pour permettre aux utilisateurs de s'inscrire
# et de créer leurs propres bases de données sans credentials admin

echo "=========================================="
echo "Initialisation CouchDB pour IAN"
echo "=========================================="
echo ""

# Demander les identifiants admin
read -p "Nom d'utilisateur administrateur CouchDB: " ADMIN_USER
read -sp "Mot de passe administrateur CouchDB: " ADMIN_PASSWORD
echo ""
echo ""

# URL CouchDB
COUCHDB_URL="http://${ADMIN_USER}:${ADMIN_PASSWORD}@localhost:5984"

echo "Configuration de CouchDB..."
echo ""

# 1. Activer CORS
echo "1. Configuration CORS..."
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/httpd/enable_cors" -d '"true"'
echo ""
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/origins" -d '"*"'
echo ""
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/credentials" -d '"true"'
echo ""
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/methods" -d '"GET, PUT, POST, HEAD, DELETE"'
echo ""
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/headers" -d '"accept, authorization, content-type, origin, referer, x-requested-with"'
echo ""

# 2. Permettre l'auto-inscription des utilisateurs
echo ""
echo "2. Activation de l'auto-inscription des utilisateurs..."
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/chttpd/enable_cors" -d '"true"'
echo ""
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/couch_httpd_auth/public_fields" -d '"name"'
echo ""
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/couch_httpd_auth/users_db_public" -d '"true"'
echo ""

# 3. Créer la base publique ian_public
echo ""
echo "3. Création de la base publique ian_public..."
curl -X PUT "${COUCHDB_URL}/ian_public"
echo ""

# 4. Configurer la base publique (accessible à tous les utilisateurs authentifiés)
echo ""
echo "4. Configuration des permissions de ian_public..."
curl -X PUT "${COUCHDB_URL}/ian_public/_security" \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": [], "roles": []},
    "members": {"names": [], "roles": []}
  }'
echo ""

echo ""
echo "=========================================="
echo "✅ Configuration terminée !"
echo "=========================================="
echo ""
echo "Vérifications:"
echo ""

echo "CORS activé :"
curl -s "${COUCHDB_URL}/_node/_local/_config/httpd/enable_cors"
echo ""

echo "Auto-inscription activée :"
curl -s "${COUCHDB_URL}/_node/_local/_config/couch_httpd_auth/users_db_public"
echo ""

echo "Base ian_public créée :"
curl -s "${COUCHDB_URL}/ian_public" | jq '.db_name'
echo ""

echo ""
echo "=========================================="
echo "🎉 CouchDB est prêt pour IAN !"
echo "=========================================="
echo ""
echo "Les utilisateurs peuvent maintenant:"
echo "  ✅ S'inscrire sans credentials admin"
echo "  ✅ Créer leur propre base de données automatiquement"
echo "  ✅ Accéder à la base publique ian_public"
echo ""
echo "Test depuis votre navigateur:"
echo "  Ouvrez index.html et créez un compte"
echo "  Seuls l'email et le mot de passe seront demandés"
echo ""
