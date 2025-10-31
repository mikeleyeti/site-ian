# IAN - Écosystème Interactif

Application web pour les Interlocuteurs Académiques pour le Numérique de l'académie Orléans-Tours.  
Développé par la DRANE d'Orléans-Tours

## Structure du Projet

```
site-ian/
├── index.html              # Point d'entrée principal (32 lignes)
├── styles.css              # Tous les styles CSS (178 lignes)
├── app.js                  # Logique applicative principale (541 lignes)
├── components.js           # Chargeur de composants HTML (74 lignes)
├── components/             # Composants HTML modulaires
│   ├── login.html          # Écran de connexion GitHub
│   ├── sync-bar.html       # Barre de synchronisation
│   ├── home.html           # Page d'accueil
│   ├── ecosystem.html      # Page arborescence écosystème
│   ├── directory.html      # Page annuaire des IAN
│   ├── newsletter.html     # Page newsletters
│   └── usages.html         # Page usages du numérique
└── README.md               # Ce fichier

```

## Fonctionnalités

- **Authentification GitHub** : Connexion sécurisée avec Personal Access Token
- **Synchronisation des données** : Stockage dans GitHub Gists privés
- **Gestion de profil** : Profil IAN personnalisable et public
- **Annuaire public collaboratif** : Tous les profils IAN visibles par tous les utilisateurs
- **Newsletters** : Création et gestion de newsletters trimestrielles
- **Usages pédagogiques** : Pratiques numériques par discipline

### Système de profils partagés

L'application utilise deux types de Gists par utilisateur :
1. **Gist privé** : Contient les données personnelles de chaque utilisateur (notes, etc.)
2. **Gist public individuel** : Contient le profil public de l'utilisateur

Chaque utilisateur :
- Gère son propre profil dans la page "Arborescence de l'écosystème"
- Voit tous les profils des autres IAN dans la page "Annuaire des IAN"
- Son profil public est automatiquement créé et synchronisé dans son propre Gist public
- L'annuaire recherche tous les Gists publics marqués "[IAN Profile]" pour afficher les profils

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

- **Service GitHub** : Classe `GitHubService` pour interagir avec l'API GitHub
- **Stockage local** : Utilisation de `localStorage` pour les credentials
- **Synchronisation** : Sauvegarde automatique dans GitHub Gists

## Installation et Utilisation

### Configuration simple - Aucune configuration préalable requise !

1. **Créer un compte GitHub** (si vous n'en avez pas) : [github.com/signup](https://github.com/signup)
2. **Générer un Personal Access Token** avec le scope `gist` : [GitHub Settings](https://github.com/settings/tokens)
3. **Ouvrir `index.html`** dans un navigateur web
4. **Se connecter** avec votre Personal Access Token GitHub
5. **Compléter votre profil** dans la page "Arborescence de l'écosystème"

### Synchronisation automatique

Les données sont automatiquement synchronisées :
- **Données personnelles** (incluant notes privées) → Gist privé personnel
- **Profil public** (nom, prénom, discipline, département, etc.) → Gist public personnel
- **Annuaire** → Agrège automatiquement tous les Gists publics "[IAN Profile]"

Aucune configuration manuelle n'est nécessaire, tout se fait automatiquement au premier login !

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
- **GitHub API** : Stockage et synchronisation des données
- **Fetch API** : Chargement dynamique des composants

## Sécurité et Confidentialité

- ⚠️ **Ne jamais partager votre Personal Access Token**
- Les tokens sont stockés localement dans le navigateur
- **Données privées** : Notes et réflexions restent dans votre Gist privé (non partagées)
- **Données publiques** : Votre profil IAN (nom, prénom, discipline, département, mail académique, objectifs) est visible par tous dans l'annuaire
- ⚠️ **Votre profil est public** : Ne saisissez que des informations professionnelles que vous acceptez de partager
- Chaque utilisateur possède et contrôle ses propres Gists (privé et public)
- Aucune donnée n'est envoyée à des serveurs tiers (uniquement GitHub)
- Architecture décentralisée : pas de base de données centrale, chacun héberge ses données

## Licence

Projet éducatif - Académie Orléans-Tours
