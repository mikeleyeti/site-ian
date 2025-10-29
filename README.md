# IAN - Écosystème Interactif

Application web pour les Interlocuteurs Académiques pour le Numérique de l'académie Orléans-Tours.

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
- **Gestion de profil** : Profil IAN personnalisable
- **Annuaire collaboratif** : Liste des IAN de l'académie
- **Newsletters** : Création et gestion de newsletters trimestrielles
- **Usages pédagogiques** : Pratiques numériques par discipline

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

## Utilisation

1. Ouvrir `index.html` dans un navigateur web
2. Se connecter avec un Personal Access Token GitHub (scope `gist` requis)
3. Les données sont automatiquement synchronisées avec GitHub

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

## Sécurité

- ⚠️ **Ne jamais partager votre Personal Access Token**
- Les tokens sont stockés localement dans le navigateur
- Les données sont sauvegardées dans des Gists GitHub privés
- Aucune donnée n'est envoyée à des serveurs tiers

## Licence

Projet éducatif - Académie Orléans-Tours
