# Configuration Supabase pour IAN - Écosystème Interactif

Ce document explique comment configurer et utiliser Supabase avec l'application IAN.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration initiale](#configuration-initiale)
3. [Structure de la base de données](#structure-de-la-base-de-données)
4. [Sécurité - Row Level Security (RLS)](#sécurité---row-level-security-rls)
5. [Authentification](#authentification)
6. [API et opérations CRUD](#api-et-opérations-crud)
7. [Migration depuis Firebase](#migration-depuis-firebase)

---

## Vue d'ensemble

L'application IAN utilise **Supabase** comme backend pour :
- **Authentification** : Inscription, connexion, gestion des sessions utilisateurs
- **Base de données PostgreSQL** : Stockage des profils IAN, contacts, newsletters, etc.
- **Row Level Security** : Sécurité des données au niveau des lignes

### Avantages de Supabase

- Base de données PostgreSQL (plus puissante que NoSQL)
- API REST et Realtime automatiques
- Authentification intégrée avec JWT
- Politique de sécurité granulaire (RLS)
- Open source et auto-hébergeable

---

## Configuration initiale

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet
4. Notez les informations suivantes :
   - **URL du projet** : `https://[votre-projet].supabase.co`
   - **Clé publique (anon key)** : Visible dans Settings > API

### 2. Configurer l'application

Dans `index.html`, mettez à jour les informations de connexion :

```javascript
const supabaseUrl = 'https://[votre-projet].supabase.co';
const supabaseAnonKey = 'votre-cle-publique-anon';
```

### 3. Créer le schéma de base de données

Exécutez le script SQL suivant dans **SQL Editor** de Supabase :

**Fichier : `supabase-schema.sql`**

Copiez le contenu complet du fichier `supabase-schema.sql` et exécutez-le dans :
- Dashboard Supabase > SQL Editor > New Query > Coller et exécuter

Ce script crée :
- Les tables `users` et `public_directory`
- Les politiques Row Level Security (RLS)
- Les triggers pour auto-update des timestamps
- La fonction pour créer automatiquement les profils lors de l'inscription

---

## Structure de la base de données

### Table : `users` (Données privées)

Stocke toutes les données privées de l'utilisateur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Primary key, référence à `auth.users(id)` |
| `ian_profile` | JSONB | Profil IAN (firstName, lastName, discipline, etc.) |
| `directory_profiles` | JSONB | Liste des contacts de l'annuaire |
| `newsletters` | JSONB | Abonnements aux newsletters |
| `actualites` | JSONB | Actualités sauvegardées |
| `usages` | JSONB | Usages pédagogiques |
| `contacts` | JSONB | Contacts de l'écosystème IAN |
| `last_updated` | TIMESTAMPTZ | Date de dernière mise à jour |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Auto-mis à jour par trigger |

**Accès** : Seul le propriétaire peut lire/écrire ses données

### Table : `public_directory` (Profils publics)

Stocke les profils publics visibles dans l'annuaire.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Primary key, référence à `auth.users(id)` |
| `user_id` | UUID | Référence à `auth.users(id)` |
| `display_name` | TEXT | Nom d'affichage |
| `email` | TEXT | Email de l'utilisateur |
| `first_name` | TEXT | Prénom |
| `last_name` | TEXT | Nom de famille |
| `discipline` | TEXT | Discipline enseignée |
| `department` | TEXT | Département |
| `academic_email` | TEXT | Email académique |
| `objectives` | TEXT | Objectifs pédagogiques |
| `avatar` | TEXT | Avatar (emoji) |
| `last_updated` | TIMESTAMPTZ | Date de dernière mise à jour |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Auto-mis à jour par trigger |

**Accès** : Tous les utilisateurs authentifiés peuvent lire, seul le propriétaire peut modifier

**⚠️ Important** : Le champ `notes` du profil IAN n'est **jamais** copié dans `public_directory` pour préserver la confidentialité.

---

## Sécurité - Row Level Security (RLS)

Supabase utilise PostgreSQL Row Level Security pour sécuriser les données.

### Politiques pour `users`

```sql
-- Lecture : uniquement ses propres données
CREATE POLICY "Users can read own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Écriture : uniquement ses propres données
CREATE POLICY "Users can update own data"
    ON users FOR UPDATE
    USING (auth.uid() = id);
```

### Politiques pour `public_directory`

```sql
-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read public directory"
    ON public_directory FOR SELECT
    USING (auth.role() = 'authenticated');

-- Écriture : uniquement son propre profil
CREATE POLICY "Users can update own public profile"
    ON public_directory FOR UPDATE
    USING (auth.uid() = id);
```

---

## Authentification

### Inscription (Sign Up)

```javascript
const result = await supabaseService.signUp(email, password, displayName);

if (result.success) {
    console.log('Utilisateur créé:', result.user);
} else {
    console.error('Erreur:', result.error);
}
```

**Processus automatique :**
1. Supabase Auth crée l'utilisateur dans `auth.users`
2. Le trigger `on_auth_user_created` crée automatiquement :
   - Une entrée dans `users` avec des données vides
   - Une entrée dans `public_directory` avec email et display_name

### Connexion (Sign In)

```javascript
const result = await supabaseService.signIn(email, password);

if (result.success) {
    console.log('Connecté:', result.user);
}
```

### Déconnexion (Sign Out)

```javascript
await supabaseService.signOutUser();
```

### Vérifier l'authentification

```javascript
if (supabaseService.isAuthenticated()) {
    const userId = supabaseService.getUserId();
    const displayName = supabaseService.getDisplayName();
}
```

---

## API et opérations CRUD

### Sauvegarder les données de l'utilisateur

```javascript
await supabaseService.saveUserData(appData);
```

Cette fonction :
1. Sauvegarde toutes les données dans `users`
2. Met à jour le profil public dans `public_directory` (sans les notes)

### Récupérer les données de l'utilisateur

```javascript
const data = await supabaseService.getUserData();

// Retourne :
// {
//     ianProfile: { firstName, lastName, ... },
//     directoryProfiles: [...],
//     newsletters: [...],
//     actualites: [...],
//     usages: [...],
//     contacts: [...],
//     lastUpdated: "2024-01-15T10:30:00Z"
// }
```

### Mettre à jour un champ spécifique

```javascript
await supabaseService.updateProfileField('firstName', 'Jean');
await supabaseService.updateProfileField('discipline', 'Mathématiques');
await supabaseService.updateProfileField('notes', 'Notes privées');
```

**Note** : Les champs autres que `notes` sont automatiquement synchronisés dans `public_directory`.

### Récupérer tous les profils publics (annuaire)

```javascript
const profiles = await supabaseService.getSharedProfiles();

// Retourne un tableau :
// [
//     {
//         userId: "uuid",
//         displayName: "Jean Dupont",
//         email: "jean@example.com",
//         firstName: "Jean",
//         lastName: "Dupont",
//         discipline: "Mathématiques",
//         ...
//     },
//     ...
// ]
```

---

## Migration depuis Firebase

### Différences principales

| Aspect | Firebase | Supabase |
|--------|----------|----------|
| Base de données | NoSQL (Firestore) | PostgreSQL (SQL) |
| Structure | Collections/Documents | Tables/Lignes |
| Données | Flexibles (schemaless) | Typées (schema) |
| Requêtes | Limitées | SQL complet |
| Sécurité | Firestore Rules | Row Level Security |
| Authentification | Firebase Auth | Supabase Auth (GoTrue) |

### Équivalences de code

#### Initialisation

```javascript
// Firebase
await firestoreService.initialize();

// Supabase
await supabaseService.initialize();
```

#### Authentification

```javascript
// Firebase
await firestoreService.signUp(email, password, name);
await firestoreService.signIn(email, password);

// Supabase (identique)
await supabaseService.signUp(email, password, name);
await supabaseService.signIn(email, password);
```

#### Opérations de données

```javascript
// Firebase
await firestoreService.saveUserData(appData);
const data = await firestoreService.getUserData();

// Supabase (identique)
await supabaseService.saveUserData(appData);
const data = await supabaseService.getUserData();
```

**✅ Aucun changement nécessaire dans `app.js`** : L'interface de `SupabaseService` est identique à `FirestoreService`.

### Migration des données existantes

Si vous avez des données dans Firebase et souhaitez les migrer vers Supabase :

1. **Exporter les données depuis Firebase**
   - Utilisez la console Firebase : Firestore Database > Export
   - Ou utilisez l'Admin SDK pour exporter par script

2. **Transformer les données**
   - Convertir les collections `users` et `public_directory` en format JSON
   - Adapter les noms de champs (camelCase → snake_case si nécessaire)

3. **Importer dans Supabase**
   - Utilisez l'API Supabase pour insérer les données
   - Ou utilisez un script SQL avec `INSERT INTO`

**Note** : Ce projet a été configuré pour une migration "clean" sans transfert de données.

---

## Développement et débogage

### Console Supabase

Accédez à votre dashboard Supabase pour :
- **Table Editor** : Visualiser et éditer les données
- **SQL Editor** : Exécuter des requêtes SQL
- **Authentication** : Gérer les utilisateurs
- **Logs** : Voir les logs d'API et d'authentification

### Logs dans la console du navigateur

```javascript
console.log('[Supabase] Client initialisé');
console.log('[Supabase Auth] Utilisateur connecté:', user.email);
```

### Tester les politiques RLS

Dans SQL Editor :

```sql
-- Se connecter en tant qu'utilisateur (JWT)
SET request.jwt.claim.sub = 'user-uuid-here';

-- Tester une requête
SELECT * FROM users WHERE id = 'user-uuid-here';
```

---

## Support et ressources

- **Documentation Supabase** : [supabase.com/docs](https://supabase.com/docs)
- **API Reference** : [supabase.com/docs/reference/javascript](https://supabase.com/docs/reference/javascript)
- **Communauté** : [Discord Supabase](https://discord.supabase.com)
- **GitHub** : [github.com/supabase/supabase](https://github.com/supabase/supabase)

---

## Résumé de l'architecture

```
┌─────────────────────────────────────────┐
│          Application Web (IAN)          │
│   index.html + app.js + components.js   │
└──────────────┬──────────────────────────┘
               │
               │ supabase-service.js
               │
┌──────────────▼──────────────────────────┐
│         Supabase Client SDK             │
│  (@supabase/supabase-js via CDN)        │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS/REST API
               │
┌──────────────▼──────────────────────────┐
│           Supabase Backend              │
├─────────────────────────────────────────┤
│  • PostgreSQL Database                  │
│    - users table                        │
│    - public_directory table             │
│  • Row Level Security (RLS)             │
│  • Supabase Auth (GoTrue)               │
│  • Auto-generated API                   │
└─────────────────────────────────────────┘
```

---

**Version** : 1.0.0
**Date** : 2025-01-12
**Projet** : IAN - Écosystème Interactif
**Backend** : Supabase PostgreSQL
