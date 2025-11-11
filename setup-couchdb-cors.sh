#!/bin/bash

# Script de configuration CORS pour CouchDB
# Ce script doit être exécuté sur le serveur VPS où CouchDB est installé

echo "=========================================="
echo "Configuration CORS pour CouchDB"
echo "=========================================="
echo ""

# Demander les identifiants admin
read -p "Nom d'utilisateur administrateur CouchDB: " ADMIN_USER
read -sp "Mot de passe administrateur CouchDB: " ADMIN_PASSWORD
echo ""

# URL CouchDB (localhost car ce script s'exécute sur le serveur)
COUCHDB_URL="http://${ADMIN_USER}:${ADMIN_PASSWORD}@localhost:5984"

echo ""
echo "Configuration de CORS..."

# Activer CORS
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/httpd/enable_cors" -d '"true"'
echo ""

# Configurer les origins (autoriser tous les domaines)
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/origins" -d '"*"'
echo ""

# Activer les credentials
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/credentials" -d '"true"'
echo ""

# Configurer les méthodes HTTP autorisées
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/methods" -d '"GET, PUT, POST, HEAD, DELETE"'
echo ""

# Configurer les headers autorisés
curl -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/headers" -d '"accept, authorization, content-type, origin, referer, x-requested-with"'
echo ""

echo ""
echo "=========================================="
echo "Configuration CORS terminée !"
echo "=========================================="
echo ""
echo "Vérification de la configuration..."

# Vérifier la configuration
echo "CORS activé :"
curl -s "${COUCHDB_URL}/_node/_local/_config/httpd/enable_cors"
echo ""

echo "Origins autorisées :"
curl -s "${COUCHDB_URL}/_node/_local/_config/cors/origins"
echo ""

echo "Credentials :"
curl -s "${COUCHDB_URL}/_node/_local/_config/cors/credentials"
echo ""

echo ""
echo "✅ CouchDB est maintenant configuré avec CORS !"
echo ""
echo "Vous pouvez maintenant accéder à CouchDB depuis votre application web."
echo ""
echo "Test de connexion depuis l'extérieur :"
echo "curl http://51.195.90.16:5984"
