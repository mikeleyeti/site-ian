# Guide de Migration Firebase → Supabase

## ✅ Migration Complète

La migration de Firebase vers Supabase a été effectuée avec succès ! Voici ce qui a été fait et les prochaines étapes.

---

## 🎯 Ce qui a été fait

### 1. ✅ Création du schéma de base de données PostgreSQL

**Fichier créé** : `supabase-schema.sql`

Ce script SQL contient :
- Création des tables `users` et `public_directory`
- Configuration de Row Level Security (RLS)
- Triggers pour auto-update des timestamps
- Fonction de création automatique de profil lors de l'inscription

### 2. ✅ Création du service Supabase

**Fichier créé** : `supabase-service.js`

Remplace complètement `firebase-service.js` avec les mêmes méthodes :
- Authentification (signUp, signIn, signOut)
- Gestion des données (saveUserData, getUserData, getSharedProfiles)
- Mise à jour de profils (updateProfileField, updatePublicProfile)

### 3. ✅ Mise à jour de l'application

**Fichiers modifiés** :
- `index.html` : Configuration Supabase (URL + clé publique)
- `app.js` : Remplacement de `firestoreService` par `supabaseService`

**Fichiers supprimés** :
- `firebase-service.js` (remplacé par supabase-service.js)
- `firestore.rules` (remplacé par RLS PostgreSQL)
- `FIREBASE_SETUP.md` (remplacé par SUPABASE_SETUP.md)

### 4. ✅ Documentation complète

**Fichier créé** : `SUPABASE_SETUP.md`

Documentation détaillée incluant :
- Configuration initiale
- Structure de la base de données
- Sécurité et authentification
- Guide de migration

---

## 🚀 Prochaines étapes (IMPORTANT)

### Étape 1 : Créer le schéma dans Supabase

**⚠️ Cette étape est OBLIGATOIRE avant de tester l'application**

1. Connectez-vous à votre dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Ouvrez le fichier `supabase-schema.sql` dans un éditeur de texte
6. Copiez tout le contenu du fichier
7. Collez-le dans l'éditeur SQL de Supabase
8. Cliquez sur **Run** (ou appuyez sur Ctrl/Cmd + Enter)
9. Vérifiez qu'il n'y a pas d'erreurs (vous devriez voir "Success. No rows returned")

### Étape 2 : Vérifier la création des tables

1. Dans le dashboard Supabase, allez dans **Table Editor**
2. Vous devriez voir deux tables :
   - `users`
   - `public_directory`
3. Cliquez sur chaque table pour vérifier les colonnes

### Étape 3 : Tester l'authentification

1. Ouvrez l'application dans votre navigateur
2. Testez l'inscription d'un nouvel utilisateur
3. Vérifiez que :
   - L'inscription fonctionne sans erreur
   - L'utilisateur est créé dans Supabase Auth
   - Les tables `users` et `public_directory` sont automatiquement remplies

### Étape 4 : Tester les fonctionnalités

**Test d'inscription :**
- Créer un compte avec email et mot de passe (minimum 6 caractères)
- Vérifier la connexion automatique après inscription

**Test de connexion :**
- Se déconnecter
- Se reconnecter avec les mêmes identifiants

**Test de sauvegarde de profil :**
- Remplir les informations du profil IAN (prénom, nom, discipline, etc.)
- Vérifier que les données sont sauvegardées dans Supabase (Table Editor)

**Test d'annuaire :**
- Créer plusieurs comptes
- Vérifier que tous les profils apparaissent dans l'annuaire
- Vérifier que les notes privées ne sont PAS visibles dans l'annuaire

---

## 🔍 Vérification de la migration

### Vérifier que Firebase est complètement supprimé

```bash
# Ces fichiers ne devraient plus exister
ls firebase-service.js       # Devrait retourner "No such file"
ls firestore.rules          # Devrait retourner "No such file"
ls FIREBASE_SETUP.md        # Devrait retourner "No such file"
```

### Vérifier que Supabase est configuré

```bash
# Ces fichiers devraient exister
ls supabase-service.js      # ✓ Existe
ls supabase-schema.sql      # ✓ Existe
ls SUPABASE_SETUP.md        # ✓ Existe
```

### Vérifier index.html

Ouvrir `index.html` et vérifier :
- ✅ Import de Supabase : `import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'`
- ✅ Configuration Supabase avec votre URL et clé
- ✅ Chargement de `supabase-service.js` (pas firebase-service.js)
- ❌ Aucune mention de Firebase

### Vérifier app.js

Ouvrir `app.js` et vérifier :
- ✅ Utilisation de `supabaseService` partout
- ❌ Aucune mention de `firestoreService`

---

## 🐛 Dépannage

### Erreur : "relation 'users' does not exist"

**Cause** : Le schéma SQL n'a pas été exécuté dans Supabase

**Solution** : Exécutez le fichier `supabase-schema.sql` dans SQL Editor (voir Étape 1)

### Erreur : "Invalid API key"

**Cause** : Clé publique incorrecte ou expirée

**Solution** :
1. Allez dans Settings > API de votre dashboard Supabase
2. Copiez la clé `anon` `public`
3. Mettez à jour dans `index.html` ligne 35

### Erreur d'authentification : "Email already registered"

**Cause** : L'utilisateur existe déjà (peut-être d'un test précédent)

**Solution** :
1. Allez dans Authentication > Users dans Supabase
2. Supprimez l'utilisateur
3. Réessayez l'inscription

### Les données ne se sauvegardent pas

**Cause** : Politiques RLS non configurées ou utilisateur non authentifié

**Solution** :
1. Vérifiez que le schéma SQL a été exécuté (notamment les politiques RLS)
2. Vérifiez dans la console du navigateur (F12) qu'il n'y a pas d'erreur
3. Vérifiez que l'utilisateur est bien connecté (check console : "[Supabase Auth] Utilisateur connecté")

---

## 📊 Comparaison Firebase vs Supabase

| Fonctionnalité | Firebase (avant) | Supabase (maintenant) |
|----------------|------------------|----------------------|
| Base de données | Firestore (NoSQL) | PostgreSQL (SQL) |
| Authentification | Firebase Auth | Supabase Auth |
| Sécurité | Firestore Rules | Row Level Security |
| Coût gratuit | 1 Go, 50k reads/day | 500 Mo, Unlimited API calls |
| SQL | ❌ Non | ✅ Oui (complet) |
| Open source | ❌ Non | ✅ Oui |
| Auto-hébergement | ❌ Non | ✅ Oui |

---

## 🎉 Avantages de la migration

✅ **Base de données SQL complète** : Requêtes complexes, jointures, transactions
✅ **Meilleure sécurité** : Row Level Security au niveau de la base de données
✅ **Open source** : Possibilité d'auto-hébergement
✅ **API REST automatique** : Génération automatique d'API pour toutes les tables
✅ **Realtime subscriptions** : Écoute des changements en temps réel (non utilisé pour l'instant)
✅ **Meilleure scalabilité** : PostgreSQL peut gérer des millions d'enregistrements

---

## 📝 Fichiers importants

| Fichier | Description |
|---------|-------------|
| `supabase-schema.sql` | Script SQL à exécuter dans Supabase (OBLIGATOIRE) |
| `supabase-service.js` | Service de connexion à Supabase |
| `SUPABASE_SETUP.md` | Documentation complète de Supabase |
| `MIGRATION_GUIDE.md` | Ce fichier (guide de migration) |
| `index.html` | Configuration de l'application (Supabase URL + key) |
| `app.js` | Logique de l'application (utilise supabaseService) |

---

## 📞 Support

En cas de problème :

1. **Vérifiez la console du navigateur (F12)** pour les messages d'erreur
2. **Vérifiez le dashboard Supabase** :
   - Logs > Edge Functions pour les erreurs d'API
   - Authentication > Logs pour les erreurs d'authentification
3. **Consultez la documentation** : `SUPABASE_SETUP.md`
4. **Documentation Supabase officielle** : https://supabase.com/docs

---

## ✅ Checklist finale

Avant de considérer la migration comme complète, vérifiez :

- [ ] Le fichier `supabase-schema.sql` a été exécuté dans Supabase SQL Editor
- [ ] Les tables `users` et `public_directory` existent dans Supabase
- [ ] L'inscription d'un nouvel utilisateur fonctionne
- [ ] La connexion fonctionne
- [ ] Les données du profil se sauvegardent correctement
- [ ] L'annuaire affiche les profils publics
- [ ] Les notes privées ne sont pas visibles dans l'annuaire
- [ ] Aucune erreur dans la console du navigateur

Une fois toutes ces étapes validées, la migration est terminée ! 🎉

---

**Date de migration** : 2025-01-12
**Version** : 1.0.0
