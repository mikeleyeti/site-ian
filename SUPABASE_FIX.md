# Guide de Configuration Supabase - Correction Inscription

## Problème rencontré

Lors de l'inscription, deux erreurs apparaissaient :
1. **"Email address is invalid"** - Supabase rejette certains emails
2. **"Row-level security policy violation"** - Les politiques RLS bloquaient la création des profils

## Solution appliquée

### 1. Correction du problème RLS

Création d'un trigger PostgreSQL avec **SECURITY DEFINER** qui contourne les politiques RLS lors de la création automatique des profils.

### 2. Configuration de l'authentification Supabase

Pour résoudre le problème d'email invalide, suivez ces étapes :

## 🔧 Configuration à faire dans Supabase Dashboard

### Étape 1 : Exécuter le script de correction

1. Ouvrez votre **dashboard Supabase** : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez tout le contenu du fichier **`supabase-cleanup.sql`**
6. Collez et exécutez le script
7. Vérifiez qu'il n'y a pas d'erreur

Ce script va :
- ✅ Supprimer l'ancien trigger (s'il existe)
- ✅ Créer la nouvelle fonction avec SECURITY DEFINER
- ✅ Créer le trigger automatique

### Étape 2 : Configurer l'authentification

#### Option A : Désactiver la confirmation d'email (Pour les tests)

1. Allez dans **Authentication** > **Settings**
2. Trouvez la section **"Email Auth"**
3. **Décochez** "Enable email confirmations"
4. Cliquez sur **Save**

⚠️ **Attention** : Cette option permet de tester rapidement, mais en production il est recommandé d'activer la confirmation d'email.

#### Option B : Configurer le provider d'email (Pour la production)

1. Allez dans **Authentication** > **Settings**
2. Trouvez la section **"SMTP Settings"**
3. Configurez votre serveur SMTP (Gmail, SendGrid, etc.)
4. Testez l'envoi d'email

### Étape 3 : Vérifier la configuration

Dans **SQL Editor**, exécutez ces requêtes de vérification :

```sql
-- Vérifier que le trigger existe et est activé
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- Devrait retourner 1 ligne avec tgenabled = 'O'

-- Vérifier que la fonction existe avec SECURITY DEFINER
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
-- Devrait retourner 1 ligne avec prosecdef = true
```

## 🧪 Test d'inscription

Après avoir effectué ces configurations :

1. **Rechargez votre application** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Testez l'inscription** avec un email simple :
   - Email : test@test.com
   - Mot de passe : test1234
   - Nom : Test User

3. **Vérifiez dans la console** (F12) :
   - Vous devriez voir : `[Supabase] Inscription réussie, profils créés automatiquement`
   - Aucune erreur RLS ne devrait apparaître

4. **Vérifiez dans Supabase Dashboard** :
   - Allez dans **Authentication** > **Users**
   - Votre utilisateur devrait apparaître
   - Allez dans **Table Editor** > **users**
   - Une entrée devrait exister pour votre utilisateur
   - Allez dans **Table Editor** > **public_directory**
   - Une entrée publique devrait exister

## 🐛 Dépannage

### Erreur : "Email address is invalid"

**Cause** : Supabase rejette l'email car la validation est trop stricte

**Solution** :
1. Vérifiez que l'email est bien formaté (pas d'espaces, format correct)
2. Désactivez "Enable email confirmations" dans Authentication > Settings
3. Si vous utilisez un domaine personnalisé, vérifiez la configuration DNS

### Erreur : "Row-level security policy violation"

**Cause** : Le trigger n'a pas été créé ou n'utilise pas SECURITY DEFINER

**Solution** :
1. Exécutez le script `supabase-cleanup.sql`
2. Vérifiez que le trigger existe avec la requête de vérification ci-dessus
3. Si le problème persiste, supprimez manuellement tous les utilisateurs de test dans Authentication > Users

### Erreur : "User already registered"

**Cause** : L'email a déjà été utilisé pour créer un compte

**Solution** :
1. Allez dans **Authentication** > **Users**
2. Trouvez l'utilisateur avec cet email
3. Cliquez sur les 3 points > **Delete user**
4. Réessayez l'inscription

### L'utilisateur est créé mais pas les profils

**Cause** : Le trigger n'a pas été exécuté

**Solution** :
1. Vérifiez dans les logs SQL : **Database** > **Logs**
2. Vérifiez que le trigger existe : voir requête de vérification ci-dessus
3. Réexécutez le script `supabase-cleanup.sql`

## 📋 Checklist de configuration

Avant de tester l'inscription, vérifiez :

- [ ] Les tables `users` et `public_directory` existent
- [ ] Les politiques RLS sont configurées
- [ ] Le trigger `on_auth_user_created` existe et est activé
- [ ] La fonction `handle_new_user` existe avec SECURITY DEFINER
- [ ] L'option "Enable email confirmations" est désactivée (pour les tests)
- [ ] Aucun utilisateur de test n'existe avec l'email que vous voulez utiliser

## 🎯 Architecture de la solution

```
1. Utilisateur remplit le formulaire d'inscription
   ↓
2. JavaScript appelle supabase.auth.signUp()
   ↓
3. Supabase Auth crée l'utilisateur dans auth.users
   ↓
4. ✨ TRIGGER on_auth_user_created se déclenche automatiquement
   ↓
5. La fonction handle_new_user() s'exécute avec SECURITY DEFINER
   ↓
6. Création automatique dans users et public_directory
   ↓
7. L'utilisateur est connecté et peut utiliser l'application
```

**Avantage de SECURITY DEFINER** :
- La fonction s'exécute avec les privilèges du propriétaire de la fonction
- Contourne les politiques RLS qui bloqueraient normalement l'insertion
- Garantit que les profils sont toujours créés correctement

## 📁 Fichiers modifiés

- ✅ `supabase-schema.sql` - Trigger activé avec SECURITY DEFINER
- ✅ `supabase-cleanup.sql` - Script de correction complet
- ✅ `supabase-service.js` - Simplifié, le trigger gère la création
- ✅ `SUPABASE_FIX.md` - Ce guide (nouveau)

## ✅ Test final

Si tout est configuré correctement :

1. L'inscription doit se faire **sans erreur**
2. L'utilisateur doit être **automatiquement connecté**
3. Les profils doivent être **créés automatiquement** dans les deux tables
4. **Aucune erreur RLS** ne doit apparaître dans la console

---

**Date** : 2025-01-12
**Version** : 2.0 (avec trigger SECURITY DEFINER)
