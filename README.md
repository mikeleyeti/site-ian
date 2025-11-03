# IAN - Écosystème Interactif

Application web pour les Interlocuteurs Académiques pour le Numérique de l'académie Orléans-Tours.  
Développé par la DRANE d'Orléans-Tours

## Structure du Projet

```
site-ian/
├── index.html              # Point d'entrée principal avec SDK Firebase
├── styles.css              # Tous les styles CSS
├── app.js                  # Logique applicative principale
├── firebase-service.js     # Service Firestore (remplace GitHubService)
├── components.js           # Chargeur de composants HTML
├── components/             # Composants HTML modulaires
│   ├── login.html          # Écran de connexion GitHub
│   ├── sync-bar.html       # Barre de synchronisation
│   ├── home.html           # Page d'accueil
│   ├── ecosystem.html      # Page arborescence écosystème
│   ├── directory.html      # Page annuaire des IAN
│   ├── newsletter.html     # Page newsletters
│   └── usages.html         # Page usages du numérique
├── firestore.rules         # Règles de sécurité Firestore
├── FIREBASE_SETUP.md       # Instructions de configuration Firebase
└── README.md               # Ce fichier

```

## Fonctionnalités

- **Authentification Firebase** : Connexion/Inscription sécurisée avec Email et Mot de passe
- **Synchronisation des données** : Stockage dans **Cloud Firestore** (Firebase)
- **Gestion de profil** : Profil IAN personnalisable et public
- **Annuaire public collaboratif** : Tous les profils IAN visibles par tous les utilisateurs authentifiés
- **Newsletters** : Création et gestion de newsletters trimestrielles
- **Usages pédagogiques** : Pratiques numériques par discipline

### Système de stockage Firebase

L'application utilise **Cloud Firestore** avec deux collections :
1. **Collection `users`** : Contient les données privées de chaque utilisateur (profil complet avec notes)
2. **Collection `public_directory`** : Contient les profils publics (sans les notes privées)

Chaque utilisateur :
- Gère son propre profil dans la page "Arborescence de l'écosystème"
- Voit tous les profils des autres IAN dans la page "Annuaire des IAN"
- Son profil public est automatiquement synchronisé dans Firestore
- L'annuaire charge tous les profils depuis la collection `public_directory`

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

- **Service Firebase** : Classe `FirestoreService` pour interagir avec Cloud Firestore
- **Authentification** : Token GitHub pour identifier l'utilisateur
- **Stockage local** : Utilisation de `localStorage` pour les credentials
- **Synchronisation** : Sauvegarde automatique dans Cloud Firestore

## Installation et Utilisation

### Configuration Firebase

**⚠️ Important** : Avant d'utiliser l'application, vous devez configurer Firebase :

1. **Voir le fichier [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md)** pour les instructions détaillées
2. **Configurer les règles de sécurité Firestore** dans la console Firebase

### Utilisation

1. **Ouvrir `index.html`** dans un navigateur web
2. **Créer un compte** (onglet "Inscription") avec votre email et un mot de passe
3. **Ou se connecter** si vous avez déjà un compte (onglet "Connexion")
4. **Compléter votre profil** dans la page "Arborescence de l'écosystème"
5. **Consulter l'annuaire** des autres IAN dans la page "Annuaire des IAN"

### Synchronisation automatique

Les données sont automatiquement synchronisées dans **Cloud Firestore** :
- **Données personnelles** (incluant notes privées) → Collection `users`
- **Profil public** (nom, prénom, discipline, département, etc.) → Collection `public_directory`
- **Annuaire** → Charge automatiquement tous les profils depuis `public_directory`

Tout se synchronise automatiquement à chaque modification !

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

- **HTML5** : Structure sémantique
- **CSS3** : Styles et animations
- **JavaScript ES6+** : Logique applicative moderne
- **Tailwind CSS** : Framework CSS utility-first
- **Firebase Authentication** : Authentification Email/Password
- **Cloud Firestore** : Base de données NoSQL temps réel
- **Fetch API** : Chargement dynamique des composants

## Sécurité et Confidentialité

- 🔐 **Authentification sécurisée** : Firebase Authentication avec Email/Password
- 🔒 **Données privées protégées** : Seul vous avez accès à vos données personnelles (notes, etc.)
- 👥 **Annuaire public** : Votre profil IAN (nom, prénom, discipline, département, mail académique, objectifs) est visible par tous les utilisateurs authentifiés
- ⚠️ **Ne saisissez que des informations professionnelles** que vous acceptez de partager dans votre profil public
- 🛡️ **Règles de sécurité Firestore** : Basées sur `request.auth.uid` pour protéger vos données
- ☁️ **Base de données centralisée** : Firebase (Google Cloud) héberge toutes les données
- 💰 **Gratuit** : L'offre Firebase Spark (gratuite) est largement suffisante pour votre usage
- 🔄 **Persistance automatique** : Vous restez connecté même après fermeture du navigateur

## Licence

Projet éducatif - Académie Orléans-Tours
