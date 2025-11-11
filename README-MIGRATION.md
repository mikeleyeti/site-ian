# Migration de Firestore vers MongoDB

Ce guide vous accompagne dans la migration de votre application IAN de Firebase/Firestore vers MongoDB hébergé sur votre VPS OVH.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation de MongoDB sur OVH](#installation-de-mongodb-sur-ovh)
4. [Configuration du backend](#configuration-du-backend)
5. [Migration des données](#migration-des-données)
6. [Démarrage de l'application](#démarrage-de-lapplication)
7. [Configuration de production](#configuration-de-production)
8. [Résolution des problèmes](#résolution-des-problèmes)

## 🎯 Vue d'ensemble

### Architecture avant migration
- **Frontend**: Application web HTML/JS/CSS
- **Authentification**: Firebase Auth
- **Base de données**: Firestore
- **Hébergement**: Client-side uniquement

### Architecture après migration
- **Frontend**: Application web HTML/JS/CSS (inchangé)
- **Backend**: Node.js + Express
- **Authentification**: JWT (JSON Web Tokens)
- **Base de données**: MongoDB (sur VPS OVH)
- **API REST**: Communication frontend ↔ backend

## 📦 Prérequis

### Logiciels nécessaires
- Node.js >= 18.x
- npm >= 9.x
- MongoDB >= 6.x (sur votre VPS OVH)
- Accès SSH à votre VPS OVH

### Connaissances recommandées
- Bases de Linux/SSH
- Configuration de MongoDB
- Gestion de processus Node.js (PM2 recommandé)

## 🚀 Installation de MongoDB sur OVH

### 1. Connexion à votre VPS
```bash
ssh root@votre-ip-ovh
```

### 2. Installation de MongoDB

#### Pour Ubuntu/Debian :
```bash
# Importer la clé publique MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Ajouter le dépôt MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Mettre à jour et installer
sudo apt-get update
sudo apt-get install -y mongodb-org

# Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Vérifier le statut
sudo systemctl status mongod
```

### 3. Configuration de MongoDB

#### Créer un utilisateur administrateur
```bash
# Se connecter à MongoDB
mongosh

# Dans le shell MongoDB
use admin
db.createUser({
  user: "admin",
  pwd: "votre_mot_de_passe_securise",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

# Créer un utilisateur pour la base IAN
use ian-database
db.createUser({
  user: "ian_user",
  pwd: "mot_de_passe_ian_securise",
  roles: [ { role: "readWrite", db: "ian-database" } ]
})

exit
```

#### Activer l'authentification
```bash
# Éditer le fichier de configuration
sudo nano /etc/mongod.conf

# Modifier/ajouter ces lignes :
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 127.0.0.1,votre-ip-ovh  # Remplacer par l'IP de votre VPS

# Redémarrer MongoDB
sudo systemctl restart mongod
```

#### Configuration du pare-feu
```bash
# Autoriser le port MongoDB (si vous voulez y accéder depuis l'extérieur)
sudo ufw allow 27017/tcp

# Ou restreindre à une IP spécifique (recommandé)
sudo ufw allow from VOTRE_IP_LOCALE to any port 27017
```

## ⚙️ Configuration du backend

### 1. Installation des dépendances

```bash
cd server
npm install
```

### 2. Configuration de l'environnement

Éditez le fichier `server/.env` :

```bash
# Configuration MongoDB
# Si MongoDB est sur le même serveur que le backend :
MONGODB_URI=mongodb://ian_user:mot_de_passe_ian_securise@localhost:27017/ian-database

# Si MongoDB est sur un serveur distant :
MONGODB_URI=mongodb://ian_user:mot_de_passe_ian_securise@IP_VPS_OVH:27017/ian-database

# Port du serveur API
PORT=3000

# Secret JWT (TRÈS IMPORTANT : changez cette valeur !)
# Générez une clé aléatoire sécurisée avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=votre_secret_jwt_tres_securise_a_changer

# Durée de validité du token (24 heures = 86400 secondes)
JWT_EXPIRATION=86400

# Environnement
NODE_ENV=production
```

### 3. Test du backend

```bash
# Démarrer le serveur en mode développement
npm run dev

# Tester l'API
curl http://localhost:3000/health
```

## 📊 Migration des données

### 1. Préparer la migration

Si vous souhaitez migrer vos données existantes de Firestore vers MongoDB :

#### a. Télécharger les credentials Firebase Admin
1. Allez dans [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Project Settings** > **Service Accounts**
4. Cliquez sur **Generate New Private Key**
5. Sauvegardez le fichier JSON dans `server/serviceAccountKey.json`

#### b. Installer les dépendances de migration
```bash
cd server
npm install firebase-admin
```

#### c. Lancer la migration
```bash
node migrate-firestore-to-mongodb.js
```

⚠️ **IMPORTANT** : Le script crée un mot de passe par défaut `ChangeMe123!` pour tous les utilisateurs. Ils devront le changer lors de leur première connexion.

### 2. Migration manuelle (alternative)

Si vous préférez ne pas utiliser le script, vous pouvez :
1. Exporter vos données de Firestore en JSON
2. Les transformer au format MongoDB
3. Les importer avec `mongoimport`

## 🎬 Démarrage de l'application

### 1. Configuration du frontend

Éditez `api-service.js` pour pointer vers votre backend :

```javascript
// URL de l'API backend
this.apiUrl = 'http://votre-ip-ovh:3000/api';
// Ou si vous utilisez un nom de domaine :
this.apiUrl = 'https://api.votre-domaine.com/api';
```

### 2. Démarrer le backend

#### Mode développement
```bash
cd server
npm run dev
```

#### Mode production avec PM2 (recommandé)
```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
cd server
pm2 start server.js --name ian-backend

# Configurer PM2 pour démarrer au boot
pm2 startup
pm2 save

# Vérifier le statut
pm2 status
pm2 logs ian-backend
```

### 3. Servir le frontend

#### Option 1: Serveur HTTP simple pour dev
```bash
# Depuis la racine du projet
npx http-server -p 8080
```

#### Option 2: Nginx (production)
```bash
# Installer Nginx
sudo apt-get install nginx

# Créer la configuration
sudo nano /etc/nginx/sites-available/ian

# Contenu :
server {
    listen 80;
    server_name votre-domaine.com;
    root /chemin/vers/site-ian;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy vers l'API backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activer le site
sudo ln -s /etc/nginx/sites-available/ian /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Configuration de production

### 1. HTTPS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

### 2. Sécurité MongoDB

```bash
# Désactiver l'accès externe (si le backend est sur le même serveur)
# Dans /etc/mongod.conf :
net:
  bindIp: 127.0.0.1

# Redémarrer
sudo systemctl restart mongod
```

### 3. Variables d'environnement sécurisées

- Ne JAMAIS commiter `.env` dans Git
- Utiliser des mots de passe forts et uniques
- Régénérer `JWT_SECRET` régulièrement
- Limiter les durées de session (`JWT_EXPIRATION`)

### 4. Monitoring

```bash
# Logs du backend avec PM2
pm2 logs ian-backend

# Logs MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Monitoring système
pm2 monit
```

## 🔧 Résolution des problèmes

### Erreur de connexion MongoDB

```bash
# Vérifier que MongoDB est démarré
sudo systemctl status mongod

# Vérifier les logs
sudo tail -f /var/log/mongodb/mongod.log

# Tester la connexion
mongosh "mongodb://ian_user:password@localhost:27017/ian-database"
```

### CORS Error

Si vous avez des erreurs CORS, vérifiez la configuration dans `server/server.js` :

```javascript
// Configurer CORS pour accepter votre domaine frontend
app.use(cors({
  origin: 'https://votre-domaine.com',
  credentials: true
}));
```

### Token JWT expiré

Les tokens JWT expirent après 24 heures par défaut. L'utilisateur doit se reconnecter.

### Problème de connexion utilisateur après migration

Les utilisateurs migrés ont un mot de passe par défaut. Implémentez un système de réinitialisation de mot de passe ou communiquez le mot de passe par défaut aux utilisateurs.

## 📝 Différences avec Firebase

| Feature | Firebase | MongoDB |
|---------|----------|---------|
| Authentification | Firebase Auth | JWT + bcrypt |
| Stockage | Firestore | MongoDB |
| Temps réel | ✅ Natif | ❌ (nécessite Socket.io) |
| Offline | ✅ Natif | ❌ |
| Coût | Basé sur l'usage | Fixe (VPS) |
| Contrôle | Limité | Total |

## 🆘 Support

Pour toute question ou problème :
1. Vérifiez les logs : `pm2 logs ian-backend`
2. Vérifiez MongoDB : `sudo systemctl status mongod`
3. Testez l'API : `curl http://localhost:3000/health`

## 📚 Ressources

- [Documentation MongoDB](https://www.mongodb.com/docs/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
