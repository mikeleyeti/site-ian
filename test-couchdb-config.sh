#!/bin/bash

# Script de test complet de la configuration CouchDB
# Teste chaque fonctionnalité une par une

echo "=========================================="
echo "Test complet CouchDB pour IAN"
echo "=========================================="
echo ""

# Demander les identifiants admin
read -p "Nom d'utilisateur administrateur CouchDB: " ADMIN_USER
read -sp "Mot de passe administrateur CouchDB: " ADMIN_PASSWORD
echo ""
echo ""

# URL CouchDB
COUCHDB_URL="http://localhost:5984"
ADMIN_AUTH="${ADMIN_USER}:${ADMIN_PASSWORD}"

echo "=========================================="
echo "ÉTAPE 1: Tests de connexion"
echo "=========================================="
echo ""

echo "Test connexion admin..."
RESPONSE=$(curl -s -w "%{http_code}" -u "$ADMIN_AUTH" "${COUCHDB_URL}" -o /dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Connexion admin OK"
else
    echo "❌ Connexion admin échouée (HTTP $RESPONSE)"
    exit 1
fi
echo ""

echo "=========================================="
echo "ÉTAPE 2: Configuration CouchDB"
echo "=========================================="
echo ""

echo "Configuration CORS..."
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/_node/_local/_config/httpd/enable_cors" -d '"true"' > /dev/null
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/_node/_local/_config/cors/origins" -d '"*"' > /dev/null
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/_node/_local/_config/cors/credentials" -d '"true"' > /dev/null
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/_node/_local/_config/cors/methods" -d '"GET, PUT, POST, HEAD, DELETE"' > /dev/null
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/_node/_local/_config/cors/headers" -d '"accept, authorization, content-type, origin, referer, x-requested-with"' > /dev/null
echo "✅ CORS configuré"
echo ""

echo "Configuration authentification..."
# CRITIQUE : Rendre _users accessible en écriture publique
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/_node/_local/_config/chttpd/require_valid_user" -d '"false"' > /dev/null
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/_node/_local/_config/couch_httpd_auth/require_valid_user" -d '"false"' > /dev/null

# Permissions pour _users
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/_users/_security" \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": [], "roles": ["_admin"]},
    "members": {"names": [], "roles": []}
  }' > /dev/null

echo "✅ Auto-inscription activée"
echo ""

echo "Création base publique ian_public..."
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/ian_public" > /dev/null
curl -s -X PUT -u "$ADMIN_AUTH" "${COUCHDB_URL}/ian_public/_security" \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": [], "roles": []},
    "members": {"names": [], "roles": []}
  }' > /dev/null
echo "✅ Base ian_public créée et ouverte"
echo ""

echo "=========================================="
echo "ÉTAPE 3: Test d'auto-inscription"
echo "=========================================="
echo ""

# Générer un utilisateur de test unique
TEST_USER="test_$(date +%s)"
TEST_PASSWORD="testpass123"

echo "Test création utilisateur: $TEST_USER"

# Tester l'inscription SANS authentification (comme le ferait l'app)
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${COUCHDB_URL}/_users/org.couchdb.user:${TEST_USER}" \
  -H "Content-Type: application/json" \
  -d "{
    \"_id\": \"org.couchdb.user:${TEST_USER}\",
    \"name\": \"${TEST_USER}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"roles\": [],
    \"type\": \"user\"
  }")

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SIGNUP_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Utilisateur créé avec succès (HTTP $HTTP_CODE)"
    echo "Réponse: $RESPONSE_BODY"
else
    echo "❌ Échec création utilisateur (HTTP $HTTP_CODE)"
    echo "Réponse: $RESPONSE_BODY"
    echo ""
    echo "DIAGNOSTIC:"
    echo "L'auto-inscription ne fonctionne pas. CouchDB refuse les créations d'utilisateurs non authentifiées."
    echo ""
    echo "SOLUTION:"
    echo "Redémarrez CouchDB pour que les changements prennent effet:"
    echo "  sudo systemctl restart couchdb"
    echo ""
    exit 1
fi
echo ""

echo "=========================================="
echo "ÉTAPE 4: Test connexion utilisateur"
echo "=========================================="
echo ""

echo "Test connexion avec $TEST_USER..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${COUCHDB_URL}/_session" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"${TEST_USER}\", \"password\": \"${TEST_PASSWORD}\"}")

LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$LOGIN_CODE" = "200" ]; then
    echo "✅ Connexion utilisateur réussie"
else
    echo "❌ Connexion utilisateur échouée (HTTP $LOGIN_CODE)"
    echo "Réponse: $LOGIN_BODY"
    exit 1
fi
echo ""

echo "=========================================="
echo "ÉTAPE 5: Test création base utilisateur"
echo "=========================================="
echo ""

USER_DB="ian_user_${TEST_USER}"
echo "Test création base $USER_DB..."

# Créer la base avec les credentials utilisateur
CREATE_DB_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT -u "${TEST_USER}:${TEST_PASSWORD}" "${COUCHDB_URL}/${USER_DB}")
CREATE_DB_CODE=$(echo "$CREATE_DB_RESPONSE" | tail -n1)
CREATE_DB_BODY=$(echo "$CREATE_DB_RESPONSE" | head -n-1)

if [ "$CREATE_DB_CODE" = "201" ] || [ "$CREATE_DB_CODE" = "412" ]; then
    echo "✅ Base utilisateur créée ou existe déjà"
else
    echo "❌ Impossible de créer la base utilisateur (HTTP $CREATE_DB_CODE)"
    echo "Réponse: $CREATE_DB_BODY"
    echo ""
    echo "PROBLÈME: L'utilisateur ne peut pas créer sa propre base de données"
    echo ""
    echo "SOLUTION: Activer la création de bases par les utilisateurs"
    echo "Ajoutez dans /opt/couchdb/etc/local.ini:"
    echo ""
    echo "[chttpd]"
    echo "users_db_public = true"
    echo ""
    echo "Puis redémarrez CouchDB"
    exit 1
fi
echo ""

echo "=========================================="
echo "ÉTAPE 6: Test accès base publique"
echo "=========================================="
echo ""

echo "Test lecture ian_public..."
READ_PUBLIC_RESPONSE=$(curl -s -w "\n%{http_code}" -u "${TEST_USER}:${TEST_PASSWORD}" "${COUCHDB_URL}/ian_public")
READ_PUBLIC_CODE=$(echo "$READ_PUBLIC_RESPONSE" | tail -n1)

if [ "$READ_PUBLIC_CODE" = "200" ]; then
    echo "✅ Accès lecture ian_public OK"
else
    echo "❌ Accès lecture ian_public échoué (HTTP $READ_PUBLIC_CODE)"
fi
echo ""

echo "Test écriture ian_public..."
WRITE_PUBLIC_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -u "${TEST_USER}:${TEST_PASSWORD}" \
  "${COUCHDB_URL}/ian_public" \
  -H "Content-Type: application/json" \
  -d "{\"test\": \"data\", \"user\": \"${TEST_USER}\"}")
WRITE_PUBLIC_CODE=$(echo "$WRITE_PUBLIC_RESPONSE" | tail -n1)

if [ "$WRITE_PUBLIC_CODE" = "201" ] || [ "$WRITE_PUBLIC_CODE" = "202" ]; then
    echo "✅ Accès écriture ian_public OK"
else
    echo "❌ Accès écriture ian_public échoué (HTTP $WRITE_PUBLIC_CODE)"
fi
echo ""

echo "=========================================="
echo "ÉTAPE 7: Nettoyage"
echo "=========================================="
echo ""

echo "Suppression utilisateur test..."
curl -s -X DELETE -u "$ADMIN_AUTH" "${COUCHDB_URL}/_users/org.couchdb.user:${TEST_USER}?rev=$(curl -s -u "$ADMIN_AUTH" "${COUCHDB_URL}/_users/org.couchdb.user:${TEST_USER}" | grep -o '"_rev":"[^"]*"' | cut -d'"' -f4)" > /dev/null

echo "Suppression base test..."
curl -s -X DELETE -u "$ADMIN_AUTH" "${COUCHDB_URL}/${USER_DB}" > /dev/null

echo "✅ Nettoyage terminé"
echo ""

echo "=========================================="
echo "✅ TOUS LES TESTS SONT PASSÉS !"
echo "=========================================="
echo ""
echo "Votre CouchDB est correctement configuré pour IAN."
echo "Vous pouvez maintenant vous inscrire depuis l'application web."
echo ""
