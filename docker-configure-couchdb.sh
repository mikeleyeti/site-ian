#!/bin/bash

# Script de configuration CouchDB dans Docker pour IAN
# Configure CouchDB pour permettre l'auto-inscription des utilisateurs

echo "=========================================="
echo "Configuration CouchDB Docker pour IAN"
echo "=========================================="
echo ""

# Demander les identifiants admin
read -p "Nom d'utilisateur administrateur CouchDB: " ADMIN_USER
read -sp "Mot de passe administrateur CouchDB: " ADMIN_PASSWORD
echo ""
echo ""

# Trouver le container CouchDB
echo "Recherche du container CouchDB..."
CONTAINER_ID=$(docker ps --filter "ancestor=couchdb" --format "{{.ID}}" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
    # Essayer par nom
    CONTAINER_ID=$(docker ps --filter "name=couchdb" --format "{{.ID}}" | head -n 1)
fi

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Container CouchDB non trouvé"
    echo ""
    echo "Containers en cours d'exécution :"
    docker ps
    echo ""
    echo "Spécifiez manuellement le nom ou ID du container:"
    read -p "Container ID ou nom: " CONTAINER_ID
fi

echo "✅ Container trouvé: $CONTAINER_ID"
echo ""

# URL CouchDB
COUCHDB_URL="http://${ADMIN_USER}:${ADMIN_PASSWORD}@localhost:5984"

echo "=========================================="
echo "Configuration via Docker exec"
echo "=========================================="
echo ""

echo "1. Configuration CORS..."
docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/httpd/enable_cors" -d '"true"' > /dev/null

docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/cors/origins" -d '"*"' > /dev/null

docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/cors/credentials" -d '"true"' > /dev/null

docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/cors/methods" -d '"GET, PUT, POST, HEAD, DELETE"' > /dev/null

docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/cors/headers" -d '"accept, authorization, content-type, origin, referer, x-requested-with"' > /dev/null

echo "✅ CORS configuré"
echo ""

echo "2. Désactivation de require_valid_user (CRITIQUE pour auto-inscription)..."
docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/chttpd/require_valid_user" -d '"false"' > /dev/null

docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/couch_httpd_auth/require_valid_user" -d '"false"' > /dev/null

echo "✅ Auto-inscription activée"
echo ""

echo "3. Configuration permissions base _users..."
docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_users/_security" \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": [], "roles": ["_admin"]},
    "members": {"names": [], "roles": []}
  }' > /dev/null

echo "✅ Permissions _users configurées"
echo ""

echo "4. Création et configuration base ian_public..."
docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/ian_public" > /dev/null

docker exec $CONTAINER_ID curl -s -X PUT -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/ian_public/_security" \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {"names": [], "roles": []},
    "members": {"names": [], "roles": []}
  }' > /dev/null

echo "✅ Base ian_public créée et ouverte"
echo ""

echo "=========================================="
echo "Vérification de la configuration"
echo "=========================================="
echo ""

echo "CORS:"
docker exec $CONTAINER_ID curl -s -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/httpd/enable_cors"
echo ""

echo "Require valid user (doit être false):"
docker exec $CONTAINER_ID curl -s -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  "http://localhost:5984/_node/_local/_config/chttpd/require_valid_user"
echo ""

echo ""
echo "=========================================="
echo "Test d'auto-inscription"
echo "=========================================="
echo ""

TEST_USER="test_$(date +%s)"
TEST_PASSWORD="testpass123"

echo "Création utilisateur test: $TEST_USER"

SIGNUP_RESULT=$(docker exec $CONTAINER_ID curl -s -w "\n%{http_code}" -X PUT \
  "http://localhost:5984/_users/org.couchdb.user:${TEST_USER}" \
  -H "Content-Type: application/json" \
  -d "{
    \"_id\": \"org.couchdb.user:${TEST_USER}\",
    \"name\": \"${TEST_USER}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"roles\": [],
    \"type\": \"user\"
  }")

HTTP_CODE=$(echo "$SIGNUP_RESULT" | tail -n1)
RESPONSE=$(echo "$SIGNUP_RESULT" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Auto-inscription fonctionne ! (HTTP $HTTP_CODE)"

    # Nettoyage
    REV=$(echo "$RESPONSE" | grep -o '"rev":"[^"]*"' | cut -d'"' -f4)
    docker exec $CONTAINER_ID curl -s -X DELETE -u "$ADMIN_USER:$ADMIN_PASSWORD" \
      "http://localhost:5984/_users/org.couchdb.user:${TEST_USER}?rev=$REV" > /dev/null

    echo ""
    echo "=========================================="
    echo "✅ Configuration réussie !"
    echo "=========================================="
    echo ""
    echo "Votre CouchDB Docker est maintenant configuré pour IAN."
    echo "Les utilisateurs peuvent s'inscrire sans credentials admin."
    echo ""
    echo "⚠️ IMPORTANT: Pour persister cette configuration :"
    echo ""
    echo "1. Ajoutez ces variables d'environnement au docker-compose.yml:"
    echo ""
    echo "  environment:"
    echo "    - COUCHDB_USER=$ADMIN_USER"
    echo "    - COUCHDB_PASSWORD=$ADMIN_PASSWORD"
    echo "    - COUCHDB_SECRET=une_chaine_secrete_aleatoire"
    echo "    - COUCHDB_CONFIG_CHTTPD_REQUIRE_VALID_USER=false"
    echo ""
    echo "2. Montez un volume pour persister la config:"
    echo ""
    echo "  volumes:"
    echo "    - couchdb-data:/opt/couchdb/data"
    echo "    - couchdb-config:/opt/couchdb/etc/local.d"
    echo ""
    echo "3. Redémarrez avec: docker-compose restart"
    echo ""
else
    echo "❌ Auto-inscription échouée (HTTP $HTTP_CODE)"
    echo "Réponse: $RESPONSE"
    echo ""
    echo "La configuration n'a pas fonctionné."
    echo "Vérifiez les credentials admin ou contactez le support."
fi
