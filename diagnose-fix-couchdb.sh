#!/bin/bash

# Script de diagnostic et correction CouchDB pour IAN
# Ce script vérifie et corrige toutes les configurations nécessaires

echo "=========================================="
echo "Diagnostic et correction CouchDB"
echo "=========================================="
echo ""

# Demander les identifiants admin
read -p "Nom d'utilisateur administrateur CouchDB: " ADMIN_USER
read -sp "Mot de passe administrateur CouchDB: " ADMIN_PASSWORD
echo ""
echo ""

# URL CouchDB
COUCHDB_URL="http://${ADMIN_USER}:${ADMIN_PASSWORD}@localhost:5984"

echo "1. Vérification de la connexion CouchDB..."
RESPONSE=$(curl -s -w "%{http_code}" "${COUCHDB_URL}" -o /dev/null)
if [ "$RESPONSE" != "200" ]; then
    echo "❌ Impossible de se connecter à CouchDB (HTTP $RESPONSE)"
    echo "Vérifiez vos credentials admin"
    exit 1
fi
echo "✅ Connexion CouchDB OK"
echo ""

echo "2. Configuration CORS..."
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/httpd/enable_cors" -d '"true"' 2>/dev/null
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/origins" -d '"*"' 2>/dev/null
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/credentials" -d '"true"' 2>/dev/null
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/methods" -d '"GET, PUT, POST, HEAD, DELETE"' 2>/dev/null
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/headers" -d '"accept, authorization, content-type, origin, referer, x-requested-with"' 2>/dev/null
echo "✅ CORS configuré"
echo ""

echo "3. Activation de l'auto-inscription des utilisateurs..."
# CRITIQUE : Permettre aux utilisateurs de s'inscrire eux-mêmes
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/couch_httpd_auth/public_fields" -d '"name"' 2>/dev/null
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/couch_httpd_auth/users_db_public" -d '"true"' 2>/dev/null

# Permettre la création de bases par les utilisateurs authentifiés
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/chttpd/users_db_public" -d '"true"' 2>/dev/null

echo "✅ Auto-inscription activée"
echo ""

echo "4. Création de la base publique ian_public..."
CREATE_RESPONSE=$(curl -s -w "%{http_code}" -X PUT "${COUCHDB_URL}/ian_public" -o /dev/null)
if [ "$CREATE_RESPONSE" = "201" ]; then
    echo "✅ Base ian_public créée"
elif [ "$CREATE_RESPONSE" = "412" ]; then
    echo "ℹ️  Base ian_public existe déjà"
else
    echo "⚠️  Réponse inattendue: HTTP $CREATE_RESPONSE"
fi
echo ""

echo "5. Configuration des permissions de ian_public (OUVERTE À TOUS)..."
# Permissions très permissives pour la base publique
curl -X PUT "${COUCHDB_URL}/ian_public/_security" \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": [], "roles": []},
    "members": {"names": [], "roles": []}
  }' 2>/dev/null
echo ""
echo "✅ Permissions ian_public configurées"
echo ""

echo "6. Vérification de la configuration..."
echo ""
echo "CORS activé:"
curl -s "${COUCHDB_URL}/_node/_local/_config/httpd/enable_cors"
echo ""

echo "Auto-inscription (_users):"
curl -s "${COUCHDB_URL}/_node/_local/_config/couch_httpd_auth/users_db_public"
echo ""

echo "Création de bases par users:"
curl -s "${COUCHDB_URL}/_node/_local/_config/chttpd/users_db_public"
echo ""

echo "Sécurité ian_public:"
curl -s "${COUCHDB_URL}/ian_public/_security" | python3 -m json.tool 2>/dev/null || curl -s "${COUCHDB_URL}/ian_public/_security"
echo ""

echo ""
echo "=========================================="
echo "✅ Configuration terminée !"
echo "=========================================="
echo ""
echo "IMPORTANT : Redémarrage de CouchDB recommandé"
echo "Pour que tous les changements prennent effet, redémarrez CouchDB:"
echo ""
echo "  sudo systemctl restart couchdb"
echo ""
echo "Ou si installé manuellement:"
echo "  sudo service couchdb restart"
echo ""
echo "Après le redémarrage, testez l'inscription sur votre application web."
echo ""
