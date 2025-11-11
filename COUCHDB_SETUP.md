# Configuration CouchDB pour IAN

## ✅ Migration complète vers CouchDB + PouchDB

Votre application IAN a été migrée de Firebase/Firestore vers CouchDB avec synchronisation PouchDB.

---

## 🏗️ Architecture

- **PouchDB** : Base de données locale (IndexedDB) dans le navigateur
- **CouchDB** : Base de données distante sur votre VPS (`http://51.195.90.16:5984`)
- **Synchronisation** : Bidirectionnelle en temps réel (offline-first)

### Bases de données CouchDB :
1. `ian_user_{username}` - Données privées de chaque utilisateur
2. `ian_public` - Annuaire public des profils IAN
3. `_users` - Base système CouchDB pour l'authentification

---

## 🔧 Configuration requise sur le VPS

### 1. Activer CORS sur CouchDB

**IMPORTANT** : Pour que le navigateur puisse communiquer avec CouchDB, vous devez activer CORS.

Connectez-vous à votre VPS et exécutez :

```bash
# Se connecter au VPS
ssh user@51.195.90.16

# Configurer CORS avec curl
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/origins -d '"*"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/credentials -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer"'
```

**Remplacez `admin:password` par vos vrais identifiants administrateur CouchDB.**

### 2. Vérifier que CouchDB est accessible

```bash
# Depuis votre VPS
curl http://localhost:5984

# Depuis l'extérieur (votre machine locale)
curl http://51.195.90.16:5984
```

Vous devriez voir :
```json
{"couchdb":"Welcome","version":"3.x.x",...}
```

### 3. Créer un utilisateur administrateur (si ce n'est pas déjà fait)

Si vous n'avez pas encore d'utilisateur admin, créez-en un :

```bash
# Éditer le fichier de configuration CouchDB
sudo nano /opt/couchdb/etc/local.ini

# Ajouter sous [admins]
[admins]
admin = votre_mot_de_passe_hashé
```

Ou via l'interface web Fauxton : `http://51.195.90.16:5984/_utils`

---

## 🔐 Sécurité et Authentification

### Comment ça fonctionne

1. **Première connexion** : L'utilisateur entre ses identifiants admin CouchDB (une seule fois)
   - Ces credentials sont sauvegardés dans `localStorage`
   - Ils permettent de créer de nouveaux utilisateurs

2. **Inscription** : Création d'un nouvel utilisateur dans la base `_users` de CouchDB

3. **Connexion** : Authentification via CouchDB Session API

4. **Synchronisation** : PouchDB synchronise automatiquement avec CouchDB en arrière-plan

### Flux d'authentification

```
Utilisateur → Formulaire login/signup
    ↓
App demande credentials admin (si première fois)
    ↓
CouchDBService.initialize(url, adminUser, adminPass)
    ↓
CouchDBService.signIn(email, password)
    ↓
Création des bases PouchDB locales + sync CouchDB distant
    ↓
L'utilisateur travaille offline/online (sync auto)
```

---

## 📊 Structure des données

### Base `ian_user_{username}`

```json
{
  "_id": "user_data",
  "ianProfile": {
    "avatar": "👤",
    "firstName": "Jean",
    "lastName": "Dupont",
    "discipline": "Mathématiques",
    "department": "45",
    "academicEmail": "jean.dupont@ac-orleans-tours.fr",
    "objectives": "Former les enseignants...",
    "notes": "Notes privées (non partagées)"
  },
  "directoryProfiles": [],
  "newsletters": [],
  "actualites": [],
  "usages": [],
  "contacts": [...],
  "lastUpdated": "2025-11-11T10:30:00.000Z"
}
```

### Base `ian_public`

```json
{
  "_id": "profile_jean_dupont_ac_orleans_tours_fr",
  "userId": "jean_dupont_ac_orleans_tours_fr",
  "displayName": "Jean Dupont",
  "email": "jean.dupont@ac-orleans-tours.fr",
  "firstName": "Jean",
  "lastName": "Dupont",
  "discipline": "Mathématiques",
  "department": "45",
  "academicEmail": "jean.dupont@ac-orleans-tours.fr",
  "objectives": "Former les enseignants...",
  "avatar": "👤",
  "lastUpdated": "2025-11-11T10:30:00.000Z"
}
```

**Note** : Le champ `notes` n'est PAS présent dans le profil public.

---

## 🚀 Utilisation

### Premier lancement

1. **Ouvrez `index.html`** dans un navigateur

2. **Lors de la première connexion/inscription**, l'app demandera :
   - Nom d'utilisateur administrateur CouchDB
   - Mot de passe administrateur

3. **Créez votre compte utilisateur** :
   - Email : `votre.email@exemple.fr`
   - Mot de passe : minimum 6 caractères
   - Nom : Votre nom d'affichage

4. **L'application créera automatiquement** :
   - Un utilisateur dans `_users`
   - Une base de données personnelle `ian_user_{votre_username}`
   - Un profil public dans `ian_public`

5. **Travaillez normalement** : La synchronisation est automatique !

### Fonctionnalités offline

- ✅ **Lecture offline** : Toutes vos données sont disponibles localement
- ✅ **Écriture offline** : Les modifications sont sauvegardées localement
- ✅ **Sync automatique** : Dès que vous êtes en ligne, tout se synchronise
- ✅ **Gestion des conflits** : PouchDB gère automatiquement les conflits

---

## 🔍 Vérification et débogage

### Vérifier que les bases sont créées

```bash
# Lister toutes les bases
curl http://admin:password@51.195.90.16:5984/_all_dbs

# Vérifier une base utilisateur
curl http://admin:password@51.195.90.16:5984/ian_user_jean_dupont_ac_orleans_tours_fr/_all_docs

# Vérifier l'annuaire public
curl http://admin:password@51.195.90.16:5984/ian_public/_all_docs
```

### Console navigateur (F12)

Ouvrez la console et vérifiez :
- `[CouchDB] Connexion réussie` → Connexion OK
- `[CouchDB] Databases setup complete` → Bases créées
- `[CouchDB] Data saved successfully` → Données sauvegardées
- `[CouchDB] Sync change` → Synchronisation active

### Voir les données locales

Dans Chrome/Edge :
1. F12 → Application → IndexedDB
2. Vous verrez `_pouch_ian_user_{username}` et `_pouch_ian_public`

---

## ⚠️ Problèmes courants

### Erreur CORS

**Symptôme** : `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution** : Configurez CORS (voir section 1)

### Erreur d'authentification

**Symptôme** : `unauthorized` ou `Name or password is incorrect`

**Solution** :
1. Vérifiez que l'utilisateur admin existe dans CouchDB
2. Vérifiez les credentials dans `localStorage` (F12 → Application → Local Storage)
3. Si besoin, supprimez `couchdb_admin_credentials` et reconnectez-vous

### Bases non créées

**Symptôme** : Erreur `Database does not exist`

**Solution** :
1. Vérifiez que l'utilisateur admin a les droits de créer des bases
2. Créez manuellement les bases via Fauxton :
   - `http://51.195.90.16:5984/_utils`
   - Create Database → `ian_public`

### Pas de synchronisation

**Symptôme** : Les données ne se synchronisent pas entre appareils

**Solution** :
1. Vérifiez la connexion réseau
2. Vérifiez les logs dans la console (F12)
3. Vérifiez que CouchDB est accessible : `curl http://51.195.90.16:5984`

---

## 📈 Avantages de CouchDB + PouchDB

✅ **Offline-first** : L'app fonctionne sans connexion Internet
✅ **Sync bidirectionnelle** : Modifications synchronisées automatiquement
✅ **Auto-hébergé** : Vous contrôlez vos données sur votre VPS
✅ **Pas de limite de quota** : Contrairement à Firebase gratuit
✅ **Multi-appareils** : Synchronisation entre tous vos appareils
✅ **Conflits gérés** : PouchDB résout automatiquement les conflits

---

## 🔒 Sécurité recommandée

### 1. Utilisez HTTPS

Configurez un reverse proxy NGINX avec Let's Encrypt :

```nginx
server {
    listen 443 ssl;
    server_name ian.votre-domaine.fr;

    ssl_certificate /etc/letsencrypt/live/ian.votre-domaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ian.votre-domaine.fr/privkey.pem;

    location / {
        proxy_pass http://localhost:5984;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. Désactivez l'accès direct à CouchDB

Dans `/opt/couchdb/etc/local.ini` :

```ini
[httpd]
bind_address = 127.0.0.1
```

Puis utilisez NGINX comme proxy.

### 3. Utilisez un pare-feu

```bash
# Autoriser seulement HTTPS
sudo ufw allow 443/tcp
sudo ufw deny 5984/tcp
sudo ufw enable
```

---

## 📚 Ressources

- [Documentation PouchDB](https://pouchdb.com/guides/)
- [Documentation CouchDB](https://docs.couchdb.org/)
- [Guide CORS CouchDB](https://docs.couchdb.org/en/stable/config/http.html#cors)
- [Sécurité CouchDB](https://docs.couchdb.org/en/stable/intro/security.html)

---

## 🎉 C'est terminé !

Votre application IAN utilise maintenant CouchDB au lieu de Firebase. Vous êtes libre et indépendant ! 🚀
