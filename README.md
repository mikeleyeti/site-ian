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
- **Gestion de profil** : Profil IAN personnalisable et public
- **Annuaire public collaboratif** : Tous les profils IAN visibles par tous les utilisateurs
- **Newsletters** : Création et gestion de newsletters trimestrielles
- **Usages pédagogiques** : Pratiques numériques par discipline

### Système de profils partagés

L'application utilise deux types de Gists :
1. **Gist privé** : Contient les données personnelles de chaque utilisateur
2. **Gist public partagé** : Contient l'annuaire de tous les profils IAN

Chaque utilisateur :
- Gère son propre profil dans la page "Arborescence de l'écosystème"
- Voit tous les profils des autres IAN dans la page "Annuaire des IAN"
- Son profil est automatiquement synchronisé vers l'annuaire public

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

## Installation et Configuration

### 1. Configuration du Gist Public Partagé

**Important** : Avant la première utilisation, vous devez créer le Gist public partagé :

1. Ouvrir `setup-shared-gist.html` dans un navigateur
2. Générer un Personal Access Token GitHub avec le scope `gist` sur [GitHub Settings](https://github.com/settings/tokens)
3. Entrer le token dans le formulaire
4. Cliquer sur "Créer le Gist Public Partagé"
5. Copier l'ID du Gist généré
6. Dans `app.js` (ligne ~11), remplacer la valeur de `sharedGistId` par l'ID copié :
   ```javascript
   this.sharedGistId = 'VOTRE_ID_DE_GIST_ICI';
   ```

### 2. Utilisation de l'application

1. Ouvrir `index.html` dans un navigateur web
2. Se connecter avec un Personal Access Token GitHub (scope `gist` requis)
3. Compléter son profil dans la page "Arborescence de l'écosystème"
4. Les données sont automatiquement synchronisées :
   - Données personnelles → Gist privé
   - Profil public → Gist partagé

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
- Les données personnelles sont sauvegardées dans des Gists GitHub privés
- ⚠️ **Votre profil IAN est public** : Les informations de profil (nom, académie, discipline, email, objectifs) sont visibles par tous dans l'annuaire
- Ne saisissez que des informations professionnelles que vous acceptez de partager
- Aucune donnée n'est envoyée à des serveurs tiers (uniquement GitHub)

## Licence

Projet éducatif - Académie Orléans-Tours
