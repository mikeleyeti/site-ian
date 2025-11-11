# Configuration CouchDB (Sans Backend Node.js)

Guide complet pour utiliser CouchDB sur votre propre serveur avec PouchDB, **sans serveur Node.js** !

## 🎯 Avantages de cette solution

✅ **Votre serveur** - Contrôle total de vos données
✅ **Aucun backend Node.js** - Juste CouchDB + fichier JS
✅ **Gratuit** et open source
✅ **Simple** comme Firebase
✅ **Synchronisation automatique** entre navigateur et serveur

## 📋 Architecture

```
┌─────────────────┐          ┌──────────────────┐
│   Navigateur    │          │  Votre Serveur   │
│                 │          │                  │
│  PouchDB.js     │◄────────►│    CouchDB       │
│  (local DB)     │   HTTP   │  (serveur DB)    │
│                 │   REST   │                  │
└─────────────────┘          └──────────────────┘
```

- **PouchDB** : Base de données dans le navigateur (comme IndexedDB)
- **CouchDB** : Base de données sur votre serveur
- **Synchronisation** : Automatique et bidirectionnelle
- **Pas de backend** : CouchDB a une API REST native

## 🚀 Étape 1 : Installer CouchDB sur votre serveur

### Sur Ubuntu/Debian (VPS OVH)

#### 1. Connexion SSH
```bash
ssh root@votre-serveur-ovh.com
```

#### 2. Ajouter le dépôt CouchDB
```bash
# Activer le dépôt Apache CouchDB
sudo apt update && sudo apt install -y curl apt-transport-https gnupg

# Ajouter la clé GPG
curl https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1

# Ajouter le dépôt (pour Debian/Ubuntu)
source /etc/os-release
echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ ${VERSION_CODENAME} main" \
    | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null
```

#### 3. Installer CouchDB
```bash
sudo apt update
sudo apt install -y couchdb
```

Pendant l'installation, vous aurez des questions :

**Question 1 : Configuration type**
- Choisissez **standalone** (serveur unique)
- Appuyez sur Entrée

**Question 2 : Adresse d'écoute**
- Pour test local : `127.0.0.1`
- Pour accès externe : `0.0.0.0` (attention : configurez le pare-feu !)
- Recommandé : `0.0.0.0` avec pare-feu

**Question 3 : Mot de passe admin**
- Créez un **mot de passe fort** pour l'admin
- **⚠️ Notez-le bien !**
- Exemple : `MonMotDePasseSecurise123!`

#### 4. Démarrer CouchDB
```bash
sudo systemctl start couchdb
sudo systemctl enable couchdb
```

#### 5. Vérifier l'installation
```bash
curl http://127.0.0.1:5984/
```

Vous devriez voir :
```json
{
  "couchdb": "Welcome",
  "version": "3.x.x",
  "git_sha": "...",
  "uuid": "...",
  "features": [...]
}
```

✅ **CouchDB est installé !**

### Sur d'autres systèmes

- **CentOS/RHEL** : [Guide CouchDB CentOS](https://docs.couchdb.org/en/stable/install/unix.html#installation-using-the-apache-couchdb-convenience-binary-packages)
- **Docker** : `docker run -p 5984:5984 -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password couchdb`
- **Windows** : [Télécharger l'installateur](https://couchdb.apache.org/#download)

## 🔧 Étape 2 : Configuration de CouchDB

### 1. Accéder à l'interface Fauxton

Ouvrez dans votre navigateur :
```
http://votre-serveur-ovh.com:5984/_utils
```

**Identifiants** :
- Username : `admin`
- Password : Le mot de passe que vous avez créé

### 2. Créer les bases de données

Dans Fauxton (l'interface web) :

#### Base 1 : ian_users (données privées)
1. Cliquez sur **"Create Database"**
2. Nom : `ian_users`
3. Options : Laissez les paramètres par défaut
4. Cliquez sur **"Create"**

#### Base 2 : ian_public_profiles (profils publics)
1. Cliquez sur **"Create Database"**
2. Nom : `ian_public_profiles`
3. Options : Laissez les paramètres par défaut
4. Cliquez sur **"Create"**

### 3. Configurer CORS (important pour le navigateur)

CouchDB doit autoriser les requêtes depuis votre domaine frontend.

#### Option A : Via Fauxton (interface)
1. Allez dans **Configuration** (icône d'engrenage)
2. Section **CORS**
3. Activez **"Enable CORS"**
4. **Origins** : `*` (pour autoriser tous les domaines)
   - En production : `https://votre-domaine.com`
5. Sauvegardez

#### Option B : Via ligne de commande
```bash
# Activer CORS
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/httpd/enable_cors -d '"true"'

# Autoriser tous les origines (pour développement)
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/origins -d '"*"'

# Autoriser les credentials
curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/cors/credentials -d '"true"'
```

## 🔐 Étape 3 : Configuration de la sécurité

### 1. Créer les utilisateurs (un par personne IAN)

Les utilisateurs CouchDB seront créés automatiquement lors de l'inscription dans l'application.

Mais vous pouvez aussi les créer manuellement :

```bash
# Créer un utilisateur
curl -X PUT http://admin:password@127.0.0.1:5984/_users/org.couchdb.user:jean.dupont@ac-orleans-tours.fr \
     -H "Content-Type: application/json" \
     -d '{
       "name": "jean.dupont@ac-orleans-tours.fr",
       "password": "motdepasse123",
       "type": "user",
       "roles": []
     }'
```

### 2. Configurer les permissions des bases

#### Permissions pour `ian_users`
Chaque utilisateur doit pouvoir lire/écrire **seulement ses propres documents**.

Dans Fauxton :
1. Allez dans la base **ian_users**
2. Cliquez sur **Permissions** (icône cadenas)
3. Section **Members** :
   - **Roles** : Laissez vide
   - **Names** : Laissez vide (tous les utilisateurs authentifiés)

4. Créez un **Design Document** pour filtrer par utilisateur :

Cliquez sur le **+** puis **New Doc**, créez ce document :

```json
{
  "_id": "_design/users",
  "language": "javascript",
  "validate_doc_update": "function(newDoc, oldDoc, userCtx) {\n  if (userCtx.roles.indexOf('_admin') !== -1) {\n    return;\n  }\n  if (newDoc.email !== userCtx.name) {\n    throw({forbidden: 'Vous ne pouvez modifier que vos propres données'});\n  }\n}"
}
```

Cette fonction de validation empêche les utilisateurs de modifier les documents des autres.

#### Permissions pour `ian_public_profiles`
Tous les utilisateurs peuvent **lire** tous les profils, mais **écrire** seulement le leur.

1. Allez dans la base **ian_public_profiles**
2. Permissions → **Members** : Laissez vide

3. Créez un Design Document de validation :

```json
{
  "_id": "_design/profiles",
  "language": "javascript",
  "validate_doc_update": "function(newDoc, oldDoc, userCtx) {\n  if (userCtx.roles.indexOf('_admin') !== -1) {\n    return;\n  }\n  if (oldDoc && newDoc.email !== oldDoc.email) {\n    throw({forbidden: 'Vous ne pouvez pas changer l\\'email du profil'});\n  }\n  if (newDoc.email !== userCtx.name) {\n    throw({forbidden: 'Vous ne pouvez modifier que votre propre profil'});\n  }\n}"
}
```

## 🌐 Étape 4 : Configuration du pare-feu

### Autoriser le port CouchDB

```bash
# UFW (Ubuntu)
sudo ufw allow 5984/tcp

# Ou restreindre à des IPs spécifiques (recommandé)
sudo ufw allow from VOTRE_IP_BUREAU to any port 5984
```

### Avec Nginx (HTTPS recommandé en production)

Créez un reverse proxy pour utiliser HTTPS :

```nginx
server {
    listen 443 ssl;
    server_name db.votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/db.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/db.votre-domaine.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5984;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Ssl on;
    }
}
```

Ensuite, dans votre application, utilisez :
```javascript
couchdbUrl: 'https://db.votre-domaine.com'
```

## ⚙️ Étape 5 : Configurer votre application

### 1. Modifier `pouchdb-service.js`

Ouvrez le fichier et modifiez la configuration (lignes 9-17) :

```javascript
this.config = {
    // URL de votre serveur CouchDB
    // Développement :
    couchdbUrl: 'http://localhost:5984',

    // Production (recommandé avec HTTPS) :
    // couchdbUrl: 'https://db.votre-domaine.com',

    // Ou directement l'IP :
    // couchdbUrl: 'http://51.83.45.10:5984',

    // Noms des bases (ne pas changer si vous avez suivi le guide)
    usersDbName: 'ian_users',
    publicProfilesDbName: 'ian_public_profiles'
};
```

### 2. Modifier `index.html`

Ajoutez PouchDB avant votre service :

```html
<!-- Bibliothèque PouchDB (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js"></script>

<!-- Votre service PouchDB -->
<script src="pouchdb-service.js"></script>
```

## 🧪 Étape 6 : Tester l'application

### 1. Démarrer un serveur web local

```bash
# Depuis la racine du projet
npx http-server -p 8080
```

### 2. Ouvrir l'application

Allez sur [http://localhost:8080](http://localhost:8080)

### 3. Créer un compte

1. Cliquez sur **"Inscription"**
2. Entrez email et mot de passe
3. Créez votre compte

### 4. Vérifier dans CouchDB

Retournez dans Fauxton : [http://votre-serveur:5984/_utils](http://votre-serveur:5984/_utils)

Dans la base **ian_users**, vous devriez voir votre utilisateur !

## 🔄 Fonctionnement de la synchronisation

### Synchronisation automatique

PouchDB synchronise **automatiquement** les données :

```
┌────────────────────────────────────────┐
│  1. Utilisateur modifie son profil     │
│     dans le navigateur                  │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│  2. PouchDB sauvegarde localement      │
│     (dans IndexedDB du navigateur)     │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│  3. Synchronisation automatique avec   │
│     CouchDB sur le serveur             │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│  4. Données disponibles sur le serveur │
│     et tous les autres navigateurs     │
└────────────────────────────────────────┘
```

### Mode offline

✅ **L'application fonctionne hors ligne !**

Si la connexion est perdue :
- Les modifications sont sauvegardées localement
- Dès que la connexion revient, tout se synchronise automatiquement

## 🛡️ Sécurité

### Points de sécurité CouchDB

1. **Authentification** : Chaque utilisateur a son login/password
2. **Validation** : Les fonctions de validation empêchent les modifications non autorisées
3. **HTTPS** : Utilisez toujours HTTPS en production
4. **Pare-feu** : Limitez l'accès au port 5984

### Recommandations

#### Développement
```javascript
couchdbUrl: 'http://localhost:5984'
```

#### Production
```javascript
couchdbUrl: 'https://db.votre-domaine.com'
```

⚠️ **Ne jamais utiliser HTTP en production** (les mots de passe sont visibles !)

## 📊 Administration

### Consulter les logs CouchDB

```bash
sudo tail -f /var/log/couchdb/couchdb.log
```

### Sauvegarder les données

```bash
# Sauvegarder une base
curl -X GET http://admin:password@127.0.0.1:5984/ian_users/_all_docs?include_docs=true > backup_users.json

# Restaurer
# (Utilisez l'interface Fauxton ou un script de restauration)
```

### Compacter une base (libérer de l'espace)

```bash
curl -X POST http://admin:password@127.0.0.1:5984/ian_users/_compact -H "Content-Type: application/json"
```

### Monitorer la taille des bases

Dans Fauxton, vous pouvez voir :
- Nombre de documents
- Taille sur disque
- Statistiques de réplication

## 🆘 Résolution de problèmes

### Erreur : Connection refused

**Cause** : CouchDB n'est pas démarré ou n'écoute pas sur la bonne adresse

**Solution** :
```bash
# Vérifier le statut
sudo systemctl status couchdb

# Redémarrer
sudo systemctl restart couchdb

# Vérifier la configuration
sudo nano /opt/couchdb/etc/local.ini
# Ligne bind_address = 0.0.0.0
```

### Erreur : CORS

**Cause** : CouchDB refuse les requêtes du navigateur

**Solution** : Vérifier la configuration CORS (voir Étape 2.3)

### Erreur : Unauthorized

**Cause** : Mauvais identifiants ou permissions

**Solution** :
- Vérifier le mot de passe admin
- Vérifier les permissions des bases
- Vérifier que l'utilisateur existe

### Erreur : Name conflict

**Cause** : Un document avec le même `_id` existe déjà

**Solution** : C'est normal, PouchDB gère les conflits automatiquement

### La synchronisation est lente

**Cause** : Beaucoup de données ou connexion lente

**Solutions** :
- Activer la compression : `curl -X PUT http://admin:password@127.0.0.1:5984/_node/_local/_config/httpd/compression -d '"true"'`
- Configurer les index pour les requêtes fréquentes

## 📚 Ressources

- [Documentation CouchDB](https://docs.couchdb.org/)
- [Documentation PouchDB](https://pouchdb.com/guides/)
- [Guide CORS CouchDB](https://docs.couchdb.org/en/stable/config/http.html#cross-origin-resource-sharing)
- [Sécurité CouchDB](https://docs.couchdb.org/en/stable/intro/security.html)

## 🎉 Félicitations !

Votre application IAN utilise maintenant CouchDB sur votre propre serveur, **sans backend Node.js** ! 🚀

**Récapitulatif :**
- ✅ CouchDB installé sur votre serveur
- ✅ PouchDB dans le navigateur
- ✅ Synchronisation automatique
- ✅ Fonctionne offline
- ✅ Sécurisé avec authentification
- ✅ Gratuit et open source
- ✅ Contrôle total de vos données

**Prochaines étapes :**
1. Testez avec plusieurs utilisateurs
2. Configurez HTTPS en production
3. Mettez en place des sauvegardes régulières
4. Profitez de votre application autonome !
