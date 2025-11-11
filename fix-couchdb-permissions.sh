#!/bin/bash

# Script de correction des permissions CouchDB
# À exécuter APRÈS avoir redémarré le container avec le nouveau docker-compose

echo "=========================================="
echo "Correction permissions CouchDB"
echo "=========================================="
echo ""

# Demander les identifiants admin
read -p "Nom d'utilisateur admin CouchDB: " ADMIN_USER
read -sp "Mot de passe admin CouchDB: " ADMIN_PASSWORD
echo ""
echo ""

COUCHDB_URL="http://${ADMIN_USER}:${ADMIN_PASSWORD}@51.195.90.16:5984"

echo "1. Vérification connexion..."
RESPONSE=$(curl -s -w "%{http_code}" "${COUCHDB_URL}" -o /dev/null)
if [ "$RESPONSE" != "200" ]; then
    echo "❌ Connexion échouée (HTTP $RESPONSE)"
    echo "Vérifiez vos credentials"
    exit 1
fi
echo "✅ Connexion OK"
echo ""

echo "2. Configuration permissions base _users (CRITIQUE)..."
curl -X PUT "${COUCHDB_URL}/_users/_security" \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {
      "names": [],
      "roles": ["_admin"]
    },
    "members": {
      "names": [],
      "roles": []
    }
  }'
echo ""
echo "✅ Base _users ouverte pour auto-inscription"
echo ""

echo "3. Création base publique ian_public..."
curl -X PUT "${COUCHDB_URL}/ian_public"
echo ""

echo "4. Configuration permissions ian_public (ouverte à tous)..."
curl -X PUT "${COUCHDB_URL}/ian_public/_security" \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {
      "names": [],
      "roles": []
    },
    "members": {
      "names": [],
      "roles": []
    }
  }'
echo ""
echo "✅ Base ian_public configurée"
echo ""

echo "5. Test auto-inscription..."
TEST_USER="test_$(date +%s)"
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "http://51.195.90.16:5984/_users/org.couchdb.user:${TEST_USER}" \
  -H "Content-Type: application/json" \
  -d "{
    \"_id\": \"org.couchdb.user:${TEST_USER}\",
    \"name\": \"${TEST_USER}\",
    \"password\": \"testpass123\",
    \"roles\": [],
    \"type\": \"user\"
  }")

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SIGNUP_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Auto-inscription fonctionne ! (HTTP $HTTP_CODE)"

    # Nettoyage
    REV=$(echo "$RESPONSE_BODY" | grep -o '"rev":"[^"]*"' | cut -d'"' -f4)
    curl -s -X DELETE "${COUCHDB_URL}/_users/org.couchdb.user:${TEST_USER}?rev=$REV" > /dev/null

    echo ""
    echo "=========================================="
    echo "✅ Configuration réussie !"
    echo "=========================================="
    echo ""
    echo "Vous pouvez maintenant créer un compte sur votre site web"
    echo "avec seulement email + mot de passe."
    echo ""
else
    echo "❌ Auto-inscription échouée (HTTP $HTTP_CODE)"
    echo "Réponse: $RESPONSE_BODY"
    echo ""
    echo "Les variables Docker ne sont peut-être pas appliquées."
    echo "Vérifiez avec: docker exec couchdb env | grep REQUIRE_VALID_USER"
    echo ""
    echo "Si la variable n'apparaît pas, les configs Docker ne sont pas prises en compte."
    echo "Vous devez alors les appliquer manuellement (voir ci-dessous)."
fi

echo ""
echo "=========================================="
echo "Configuration manuelle si Docker ne marche pas"
echo "=========================================="
echo ""
echo "Si l'auto-inscription ne fonctionne toujours pas,"
echo "configurez manuellement dans le container:"
echo ""
echo "docker exec -it couchdb bash"
echo ""
echo "Puis éditez /opt/couchdb/etc/local.ini et ajoutez:"
echo ""
echo "[chttpd]"
echo "require_valid_user = false"
echo ""
echo "[couch_httpd_auth]"
echo "require_valid_user = false"
echo ""
echo "Puis redémarrez: docker restart couchdb"
echo ""
