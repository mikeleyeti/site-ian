# Configuration MongoDB Atlas (Sans Backend)

Guide complet pour utiliser MongoDB Atlas directement depuis le navigateur, **sans serveur Node.js** !

## 🎯 Avantages de cette solution

✅ **Gratuit** jusqu'à 512 MB de stockage
✅ **Aucun backend** à gérer
✅ **Simple** comme Firebase
✅ **Sécurisé** avec règles d'accès
✅ **Hébergement cloud** par MongoDB

## 📋 Étape 1 : Créer un compte MongoDB Atlas

### 1. Inscription
1. Allez sur [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Créez un compte gratuit (vous pouvez utiliser Google, GitHub, ou email)
3. Acceptez les conditions d'utilisation

### 2. Créer un nouveau projet
1. Une fois connecté, cliquez sur **"New Project"**
2. Nommez votre projet : **"IAN-Application"** (ou autre nom)
3. Cliquez sur **"Next"** puis **"Create Project"**

## 🗄️ Étape 2 : Créer un cluster gratuit

### 1. Créer un cluster
1. Cliquez sur **"Build a Database"**
2. Choisissez **"M0 FREE"** (le tier gratuit)
3. Sélectionnez un fournisseur cloud proche de vous :
   - **Provider** : AWS, Google Cloud, ou Azure
   - **Region** : Choisissez une région proche (ex: Europe - Paris ou Frankfurt)
4. Nommez votre cluster : **"Cluster0"** (par défaut)
5. Cliquez sur **"Create Cluster"** (peut prendre 1-3 minutes)

### 2. Configuration de la sécurité

#### A. Créer un utilisateur de base de données
Une popup apparaît :
1. **Username** : `ian_user` (ou autre nom)
2. **Password** : Générez un mot de passe fort (notez-le !)
   - Exemple : `MySecurePassword123!`
3. Cliquez sur **"Create User"**

#### B. Configurer l'accès réseau
1. Dans la section **"Where would you like to connect from?"**
2. Choisissez **"Add My Current IP Address"**
3. **IMPORTANT** : Pour permettre l'accès depuis n'importe quel navigateur :
   - Cliquez sur **"Add IP Address"**
   - Entrez : `0.0.0.0/0` (permet tous les accès)
   - Description : "Allow browser access"
   - ⚠️ **Note** : En production, restreignez à des IPs spécifiques si possible
4. Cliquez sur **"Finish and Close"**

## 🔧 Étape 3 : Créer une base de données

1. Dans votre cluster, cliquez sur **"Browse Collections"**
2. Cliquez sur **"Add My Own Data"**
3. **Database name** : `ian-database`
4. **Collection name** : `users`
5. Cliquez sur **"Create"**

### Créer la seconde collection
1. Cliquez sur le bouton **"+"** à côté de `ian-database`
2. **Collection name** : `public_profiles`
3. Cliquez sur **"Create"**

Vous devriez maintenant avoir :
- Base de données : `ian-database`
  - Collection : `users`
  - Collection : `public_profiles`

## 🔑 Étape 4 : Activer la Data API

### 1. Accéder aux App Services
1. Dans le menu latéral gauche, cliquez sur **"App Services"**
2. Cliquez sur **"Create a New App"**
3. **Application Name** : `ian-app` (ou autre nom)
4. Sélectionnez votre cluster : **"Cluster0"** (ou le nom que vous avez choisi)
5. Cliquez sur **"Create App Service"**

### 2. Activer la Data API
1. Dans le menu de gauche de votre App, cliquez sur **"HTTPS Endpoints"**
2. En haut, activez **"Data API"** en cliquant sur le toggle
3. Cochez **"Enable Data API"**
4. Cliquez sur **"Save"**

### 3. Obtenir l'URL de votre Data API
Une fois la Data API activée, vous verrez :
```
Data API Base URL: https://data.mongodb-api.com/app/YOUR-APP-ID/endpoint/data/v1
```

**📝 Notez cette URL !** Vous en aurez besoin.

Exemple :
```
https://data.mongodb-api.com/app/application-0-abcde/endpoint/data/v1
```

## 🔐 Étape 5 : Créer une API Key

### 1. Créer une clé API
1. Dans le menu de gauche, cliquez sur **"Authentication"**
2. Cliquez sur l'onglet **"API Keys"**
3. Cliquez sur **"Create API Key"**
4. **Name** : `browser-api-key`
5. Cliquez sur **"Generate Key"**

### 2. Récupérer votre clé
Une popup affiche votre clé API :
```
API Key: abcdefghijklmnopqrstuvwxyz1234567890ABCD
```

**⚠️ IMPORTANT** : Copiez cette clé immédiatement ! Elle ne sera plus affichée.

**📝 Notez cette clé !**

## 📝 Étape 6 : Configurer les règles d'accès (Sécurité)

Pour sécuriser votre base de données, configurez les règles d'accès :

### 1. Règles pour la collection `users`
1. Dans le menu de gauche, cliquez sur **"Rules"**
2. Cliquez sur **"users"**
3. Cliquez sur l'onglet **"Filters"**
4. Activez **"Apply user-specific filters"**
5. Ajoutez cette règle (en JSON) :

```json
{
  "email": "%%user.email"
}
```

Cette règle permet à chaque utilisateur de voir uniquement ses propres données.

### 2. Règles pour la collection `public_profiles`
1. Cliquez sur **"public_profiles"**
2. Laissez les permissions par défaut (lecture pour tous, écriture restreinte)
3. Ou configurez des règles plus spécifiques selon vos besoins

### 3. Sauvegarder
1. Cliquez sur **"Save"** en haut à droite
2. Cliquez sur **"Review Draft & Deploy"**
3. Cliquez sur **"Deploy"**

## ⚙️ Étape 7 : Configurer votre application

Maintenant, configurez votre fichier `mongodb-atlas-service.js` :

### 1. Ouvrir le fichier
Éditez le fichier `/mongodb-atlas-service.js` (lignes 9-17)

### 2. Remplacer les valeurs
```javascript
this.config = {
    // Remplacez par votre URL Data API (de l'étape 4)
    dataApiUrl: 'https://data.mongodb-api.com/app/application-0-abcde/endpoint/data/v1',

    // Remplacez par votre API Key (de l'étape 5)
    apiKey: 'abcdefghijklmnopqrstuvwxyz1234567890ABCD',

    // Nom de votre cluster (généralement "Cluster0")
    dataSource: 'Cluster0',

    // Nom de votre base de données
    database: 'ian-database'
};
```

### 3. Mettre à jour index.html
Remplacez `api-service.js` par `mongodb-atlas-service.js` :

```html
<!-- Remplacer cette ligne -->
<script src="api-service.js"></script>

<!-- Par celle-ci -->
<script src="mongodb-atlas-service.js"></script>
```

## 🚀 Étape 8 : Tester l'application

### 1. Ouvrir l'application
```bash
# Depuis la racine du projet
npx http-server -p 8080
```

Ouvrez votre navigateur : [http://localhost:8080](http://localhost:8080)

### 2. Créer un compte
1. Cliquez sur l'onglet **"Inscription"**
2. Entrez votre email et mot de passe
3. Cliquez sur **"Créer un compte"**

### 3. Vérifier dans MongoDB Atlas
1. Retournez dans MongoDB Atlas
2. Allez dans **"Browse Collections"**
3. Vous devriez voir votre nouvel utilisateur dans la collection `users` !

## 🔍 Vérification des données

### Dans MongoDB Atlas Console
1. Cliquez sur **"Browse Collections"**
2. Collection **"users"** : Vos données privées (profil complet)
3. Collection **"public_profiles"** : Profils publics (sans notes)

### Structure des données

**Collection `users` :**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "jean.dupont@ac-orleans-tours.fr",
  "password": "hashed_password_here",
  "displayName": "Jean Dupont",
  "ianProfile": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "discipline": "Mathématiques",
    "notes": "Notes privées..."
  },
  "contacts": [],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Collection `public_profiles` :**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "email": "jean.dupont@ac-orleans-tours.fr",
  "displayName": "Jean Dupont",
  "firstName": "Jean",
  "lastName": "Dupont",
  "discipline": "Mathématiques",
  "lastUpdated": "2024-01-15T10:35:00Z"
}
```

## 🔒 Sécurité

### Points importants

1. **API Key visible** : La clé API est dans le code JavaScript
   - ✅ **C'est normal** pour la Data API
   - ✅ **Sécurisé** grâce aux règles d'accès MongoDB
   - ✅ **Lecture uniquement de ses propres données**

2. **Mot de passe** : Hashé avec SHA-256 côté client
   - ⚠️ Pour une sécurité maximale, utilisez bcrypt.js
   - 📦 Ajoutez : `<script src="https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js"></script>`

3. **HTTPS** : En production, utilisez toujours HTTPS

### Règles de sécurité recommandées

Dans MongoDB Atlas, configurez ces règles avancées :

**Pour `users` :**
```json
{
  "email": "%%user.email"
}
```
→ Un utilisateur ne peut accéder qu'à ses propres données

**Pour `public_profiles` :**
- **Read** : Tous les utilisateurs authentifiés
- **Write** : Uniquement le propriétaire du profil

## 📊 Limites du tier gratuit

| Resource | Limite |
|----------|--------|
| Stockage | 512 MB |
| RAM | Partagée |
| Connexions simultanées | 500 |
| Bande passante | Illimitée |

**💡 Largement suffisant pour une application IAN avec plusieurs centaines d'utilisateurs !**

## 🆘 Résolution de problèmes

### Erreur : "API Key invalid"
- Vérifiez que vous avez bien copié la clé complète
- Vérifiez qu'elle est activée dans Atlas

### Erreur : "Network access denied"
- Ajoutez `0.0.0.0/0` dans "Network Access"
- Attendez 1-2 minutes que les changements se propagent

### Erreur : "Collection not found"
- Vérifiez que les collections `users` et `public_profiles` existent
- Vérifiez le nom de la database dans le code

### L'utilisateur ne peut pas se connecter
- Vérifiez que le mot de passe est correct
- Consultez les logs de la console du navigateur (F12)

### Données non sauvegardées
- Vérifiez les règles d'accès dans MongoDB Atlas
- Vérifiez que la Data API est bien activée

## 🔄 Migration depuis Firestore (Optionnel)

Si vous avez des données dans Firestore, vous pouvez les exporter :

### 1. Export depuis Firestore
```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Exporter les données
firebase firestore:export export-folder
```

### 2. Import dans MongoDB Atlas
1. Convertir les données Firestore en format MongoDB
2. Utiliser MongoDB Compass ou mongoimport
3. Ou créer un script personnalisé

## 📚 Ressources

- [Documentation MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Data API Documentation](https://www.mongodb.com/docs/atlas/app-services/data-api/)
- [MongoDB Query Language](https://www.mongodb.com/docs/manual/tutorial/query-documents/)

## 🎉 Félicitations !

Votre application IAN utilise maintenant MongoDB Atlas directement depuis le navigateur, sans serveur backend ! 🚀

**Avantages :**
- ✅ Gratuit (tier M0)
- ✅ Simple à configurer
- ✅ Hébergement cloud managé
- ✅ Aucun serveur à gérer
- ✅ Compatible avec l'infrastructure existante
