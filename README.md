# IAN - Écosystème Interactif

Application web pour les Interlocuteurs Académiques pour le Numérique de l'académie Orléans-Tours.
Développé par la DRANE d'Orléans-Tours

## 🚀 MIGRATION VERS MONGODB

**Cette application a été migrée de Firebase/Firestore vers MongoDB hébergé sur VPS OVH.**

👉 **[Consultez le guide de migration complet](./README-MIGRATION.md)** pour :
- Installer MongoDB sur votre VPS OVH
- Configurer le backend Node.js
- Migrer vos données existantes
- Déployer en production

## Structure du Projet

```
site-ian/
├── index.html                  # Point d'entrée principal
├── styles.css                  # Tous les styles CSS
├── app.js                      # Logique applicative principale
├── api-service.js              # Service API MongoDB (remplace firebase-service.js)
├── components.js               # Chargeur de composants HTML
├── components/                 # Composants HTML modulaires
│   ├── login.html             # Écran de connexion
│   ├── sync-bar.html          # Barre de synchronisation
│   ├── home.html              # Page d'accueil
│   ├── ecosystem.html         # Page arborescence écosystème
│   ├── directory.html         # Page annuaire des IAN
│   ├── newsletter.html        # Page newsletters
│   └── usages.html            # Page usages du numérique
├── server/                     # Backend Node.js + Express
│   ├── server.js              # Point d'entrée du serveur
│   ├── config/                # Configuration (database)
│   ├── routes/                # Routes API (auth, user, directory)
│   ├── middleware/            # Middleware (authentification JWT)
│   ├── .env                   # Variables d'environnement (à configurer)
│   ├── .env.example           # Exemple de configuration
│   ├── package.json           # Dépendances backend
│   └── migrate-firestore-to-mongodb.js  # Script de migration
├── README.md                   # Ce fichier
└── README-MIGRATION.md         # Guide de migration détaillé

```

## Fonctionnalités

- **Authentification JWT** : Connexion/Inscription sécurisée avec Email et Mot de passe
- **Synchronisation des données** : Stockage dans **MongoDB** (VPS OVH)
- **Gestion de profil** : Profil IAN personnalisable et public
- **Annuaire public collaboratif** : Tous les profils IAN visibles par tous les utilisateurs authentifiés
- **Newsletters** : Création et gestion de newsletters trimestrielles
- **Usages pédagogiques** : Pratiques numériques par discipline
- **Gestion des contacts** : Système de priorisation et filtrage des contacts professionnels

### Système de stockage MongoDB

L'application utilise **MongoDB** avec deux collections :
1. **Collection `users`** : Contient les données privées de chaque utilisateur (profil complet avec notes, contacts, etc.)
2. **Collection `public_profiles`** : Contient les profils publics (sans les notes privées)

Chaque utilisateur :
- Gère son propre profil dans la page "Arborescence de l'écosystème"
- Voit tous les profils des autres IAN dans la page "Annuaire des IAN"
- Son profil public est automatiquement synchronisé via l'API backend
- L'annuaire charge tous les profils depuis la collection `public_profiles`

## Architecture

### Séparation des préoccupations

- **HTML** : Structure modulaire avec composants séparés
- **CSS** : Styles centralisés dans `styles.css`
- **JavaScript** : Logique métier dans `app.js`, chargement dans `components.js`

### Composants HTML

Les composants HTML sont chargés dynamiquement au démarrage de l'application via `components.js`. Cela permet :
- Une meilleure organisation du code
- Une maintenance facilitée
- Une réutilisabilité des composants
- Un chargement optimisé avec mise en cache

### Gestion des données

- **Backend API** : Node.js + Express avec MongoDB
- **Service API** : Classe `ApiService` pour communiquer avec le backend
- **Authentification** : Tokens JWT pour identifier l'utilisateur
- **Stockage local** : Utilisation de `localStorage` pour le token JWT
- **Synchronisation** : Sauvegarde automatique via API REST vers MongoDB

## Installation et Utilisation

### Configuration (Backend + MongoDB)

**⚠️ Important** : Consultez le **[Guide de migration complet](./README-MIGRATION.md)** pour :

1. **Installer MongoDB** sur votre VPS OVH
2. **Configurer le backend** Node.js
3. **Migrer vos données** depuis Firestore (optionnel)
4. **Déployer en production** avec Nginx et PM2

### Démarrage rapide (développement)

#### 1. Backend
```bash
cd server
npm install
cp .env.example .env
# Éditez .env avec vos configurations MongoDB
npm run dev
```

#### 2. Frontend
```bash
# Serveur HTTP simple
npx http-server -p 8080
```

#### 3. Utilisation

1. **Ouvrir http://localhost:8080** dans un navigateur web
2. **Créer un compte** (onglet "Inscription") avec votre email et un mot de passe
3. **Ou se connecter** si vous avez déjà un compte (onglet "Connexion")
4. **Compléter votre profil** dans la page "Arborescence de l'écosystème"
5. **Consulter l'annuaire** des autres IAN dans la page "Annuaire des IAN"

### Synchronisation automatique

Les données sont automatiquement synchronisées dans **MongoDB** :
- **Données personnelles** (incluant notes privées) → Collection `users`
- **Profil public** (nom, prénom, discipline, département, etc.) → Collection `public_profiles`
- **Annuaire** → Charge automatiquement tous les profils depuis `public_profiles`

Tout se synchronise automatiquement à chaque modification via l'API REST !

## Développement

### Modification des styles

Éditer `styles.css` pour modifier l'apparence de l'application.

### Modification de la logique

Éditer `app.js` pour modifier le comportement de l'application.

### Ajout/modification de composants

1. Créer ou modifier un fichier HTML dans `components/`
2. Mettre à jour `components.js` si nécessaire pour charger le nouveau composant
3. Tester dans le navigateur

## Technologies utilisées

### Frontend
- **HTML5** : Structure sémantique
- **CSS3** : Styles et animations
- **JavaScript ES6+** : Logique applicative moderne
- **Tailwind CSS** : Framework CSS utility-first
- **Fetch API** : Communication avec l'API backend

### Backend
- **Node.js** : Runtime JavaScript serveur
- **Express** : Framework web minimaliste
- **MongoDB** : Base de données NoSQL
- **JWT** : Authentification par tokens
- **bcryptjs** : Hashage sécurisé des mots de passe

## Sécurité et Confidentialité

- 🔐 **Authentification sécurisée** : JWT avec bcrypt pour le hashage des mots de passe
- 🔒 **Données privées protégées** : Seul vous avez accès à vos données personnelles (notes, etc.)
- 👥 **Annuaire public** : Votre profil IAN (nom, prénom, discipline, département, mail académique, objectifs) est visible par tous les utilisateurs authentifiés
- ⚠️ **Ne saisissez que des informations professionnelles** que vous acceptez de partager dans votre profil public
- 🛡️ **API sécurisée** : Middleware d'authentification JWT pour protéger les routes
- 🏠 **Hébergement autonome** : MongoDB sur votre propre VPS OVH
- 💰 **Coût fixe** : Contrôle total des coûts avec votre VPS
- 🔄 **Persistance automatique** : Vous restez connecté même après fermeture du navigateur
- 🔑 **Contrôle total** : Vous êtes propriétaire de vos données et de votre infrastructure

## Licence

Projet éducatif - Académie Orléans-Tours
