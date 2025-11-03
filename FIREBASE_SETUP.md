# Configuration Firebase pour IAN

## ✅ Étapes déjà réalisées

1. ✅ Projet Firebase créé (`siteian`)
2. ✅ SDK Firebase + Firebase Auth intégrés dans `index.html`
3. ✅ Service Firestore + Authentication créé (`firebase-service.js`)
4. ✅ Migration complète vers Firebase Authentication (Email/Password)
5. ✅ Composant login avec Connexion + Inscription
6. ✅ Règles de sécurité Firestore basées sur `request.auth.uid`

---

## 🔑 Étape 1 : Activer l'authentification Email/Password

**IMPORTANT : Vous devez activer l'authentification Email/Password dans Firebase !**

1. **Allez sur la [Console Firebase](https://console.firebase.google.com/)**
2. **Sélectionnez votre projet** `siteian`
3. **Dans le menu de gauche** → `Authentication`
4. **Cliquez sur "Get started"** (si c'est la première fois)
5. **Onglet "Sign-in method"**
6. **Cliquez sur "Email/Password"**
7. **Activez "Email/Password"** (premier toggle)
8. **Cliquez sur "Save"**

✅ L'authentification Email/Password est maintenant activée !

---

## 🔧 Étape 2 : Configuration des règles de sécurité Firestore (SÉCURISÉES)

**Les règles suivantes sécurisent vos données avec Firebase Authentication** :

1. **Allez dans la [Console Firebase](https://console.firebase.google.com/)**
2. **Sélectionnez votre projet** `siteian`
3. **Dans le menu de gauche** → `Firestore Database`
4. **Onglet "Règles"** (Rules)
5. **Copiez-collez les règles suivantes** :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Données privées des utilisateurs
    // Chaque utilisateur peut uniquement lire/écrire ses propres données
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Annuaire public
    // Lecture : tous les utilisateurs authentifiés
    // Écriture : seulement l'utilisateur pour son propre profil
    match /public_directory/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Bloquer tout le reste
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. **Cliquez sur "Publier"**

✅ **Sécurité** : Avec ces règles, seuls les utilisateurs authentifiés peuvent accéder aux données, et chaque utilisateur ne peut modifier que ses propres données !

---

## 📊 Structure de la base de données Firestore

Votre base de données aura cette structure :

```
firestore/
├── users/                           # Collection des données privées
│   └── {firebase_uid}/              # Document par utilisateur (ID Firebase Auth)
│       ├── ianProfile: {            # Profil complet (avec notes privées)
│       │   firstName, lastName,
│       │   discipline, department,
│       │   academicEmail, objectives,
│       │   notes, avatar
│       │   }
│       ├── directoryProfiles: []    # Contacts
│       ├── newsletters: []          # Newsletters
│       ├── usages: []               # Usages pédagogiques
│       └── lastUpdated: timestamp
│
└── public_directory/                # Collection publique (annuaire)
    └── {firebase_uid}/              # Profil public par utilisateur (ID Firebase Auth)
        ├── userId (Firebase UID)
        ├── displayName
        ├── email
        ├── firstName, lastName
        ├── discipline, department
        ├── academicEmail, objectives
        ├── avatar
        └── lastUpdated
        (⚠️ PAS de champ "notes" ici)
```

---

## 🔐 Sécurité

### ✅ Authentification et Autorisation

- **Authentification** : Firebase Authentication (Email/Password)
- **Autorisation Firestore** : Règles basées sur `request.auth.uid`
- **Persistance** : L'authentification est automatiquement persistée par Firebase
- **Sécurité** : Les données privées sont protégées par utilisateur
- **Annuaire** : Accessible uniquement aux utilisateurs authentifiés

Votre application est maintenant **entièrement sécurisée** ! 🔒

---

## 🚀 Test de l'intégration

1. **Ouvrez `index.html`** dans un navigateur
2. **Créez un compte** (onglet "Inscription") avec :
   - Votre nom d'affichage
   - Votre email
   - Un mot de passe (minimum 6 caractères)
3. **Ou connectez-vous** si vous avez déjà un compte (onglet "Connexion")
4. **Remplissez votre profil** dans "Arborescence de l'écosystème"
5. **Vérifiez dans Firebase Console** :
   - **Authentication** → Vous devriez voir votre compte
   - **Firestore Database** → Données :
     - Collection `users` → votre UID
     - Collection `public_directory` → votre profil public

---

## 📝 Limitations et quotas (gratuit)

- **Lectures** : 50 000 / jour ✅
- **Écritures** : 20 000 / jour ✅
- **Suppressions** : 20 000 / jour ✅
- **Stockage** : 1 GB ✅

Pour 50-100 utilisateurs IAN → **Largement suffisant** ! 🎉

---

## ❓ Dépannage

### Erreur : "Missing or insufficient permissions"

→ Vérifiez que les règles Firestore sont bien configurées (voir Option 2 ci-dessus)

### Erreur : "Firebase is not initialized"

→ Vérifiez que `index.html` charge bien le SDK Firebase avant `app.js`

### Les données ne se synchronisent pas

→ Ouvrez la console du navigateur (F12) et vérifiez les erreurs

---

## 📚 Ressources

- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Console Firebase](https://console.firebase.google.com/)
- [Règles de sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)
