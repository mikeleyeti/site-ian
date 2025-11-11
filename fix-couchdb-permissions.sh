#!/bin/bash

# Script pour corriger les permissions CouchDB existantes
# Ce script met à jour les permissions de toutes les bases existantes

echo "=========================================="
echo "Correction des permissions CouchDB"
echo "=========================================="
echo ""

# Demander les identifiants admin
read -p "Nom d'utilisateur administrateur CouchDB: " ADMIN_USER
read -sp "Mot de passe administrateur CouchDB: " ADMIN_PASSWORD
echo ""
echo ""

# URL CouchDB
COUCHDB_URL="http://${ADMIN_USER}:${ADMIN_PASSWORD}@localhost:5984"

echo "Récupération de la liste de toutes les bases de données..."
DATABASES=$(curl -s "${COUCHDB_URL}/_all_dbs" | jq -r '.[]' | grep -E '^ian_')

if [ -z "$DATABASES" ]; then
    echo "Aucune base de données IAN trouvée."
    exit 0
fi

echo "Bases de données trouvées:"
echo "$DATABASES"
echo ""

# Traiter chaque base de données
for DB in $DATABASES; do
    echo "----------------------------------------"
    echo "Traitement de: $DB"

    if [ "$DB" = "ian_public" ]; then
        echo "Configuration de la base publique (tous les utilisateurs)..."

        # Récupérer les utilisateurs existants
        USERS=$(curl -s "${COUCHDB_URL}/_users/_all_docs" | jq -r '.rows[] | select(.id | startswith("org.couchdb.user:")) | .id' | sed 's/org.couchdb.user://')

        # Créer le tableau JSON des noms d'utilisateurs
        USER_NAMES=$(echo "$USERS" | jq -R -s -c 'split("\n") | map(select(length > 0))')

        # Configurer la sécurité
        SECURITY_DOC="{
            \"admins\": {
                \"names\": [],
                \"roles\": []
            },
            \"members\": {
                \"names\": $USER_NAMES,
                \"roles\": []
            }
        }"

        curl -X PUT "${COUCHDB_URL}/${DB}/_security" \
            -H "Content-Type: application/json" \
            -d "$SECURITY_DOC"

        echo ""
        echo "✅ Base publique configurée avec $(echo $USER_NAMES | jq 'length') utilisateurs"

    elif [[ "$DB" =~ ^ian_user_ ]]; then
        # Extraire le nom d'utilisateur de la base
        USERNAME=${DB#ian_user_}
        echo "Configuration pour l'utilisateur: $USERNAME"

        # Configurer la sécurité pour cet utilisateur uniquement
        SECURITY_DOC="{
            \"admins\": {
                \"names\": [],
                \"roles\": []
            },
            \"members\": {
                \"names\": [\"$USERNAME\"],
                \"roles\": []
            }
        }"

        curl -X PUT "${COUCHDB_URL}/${DB}/_security" \
            -H "Content-Type: application/json" \
            -d "$SECURITY_DOC"

        echo ""
        echo "✅ Base utilisateur configurée pour: $USERNAME"
    fi

    echo ""
done

echo "=========================================="
echo "✅ Toutes les permissions ont été corrigées !"
echo "=========================================="
echo ""
echo "Vérification des permissions de ian_public:"
curl -s "${COUCHDB_URL}/ian_public/_security" | jq '.'
echo ""
