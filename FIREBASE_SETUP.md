# Configuration Firebase pour IAN

## ✅ Étapes déjà réalisées

1. ✅ Projet Firebase créé (`siteian`)
2. ✅ SDK Firebase intégré dans `index.html`
3. ✅ Service Firestore créé (`firebase-service.js`)
4. ✅ Migration complète de GitHubService vers FirestoreService

---

## 🔧 Configuration des règles de sécurité Firestore

### Option 1 : Mode Test (TEMPORAIRE - 30 jours)

**Pour tester rapidement** (déjà fait si vous avez choisi "Mode test" lors de la création) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 1);
    }
  }
}
```

⚠️ **Attention** : Ce mode expire automatiquement après 30 jours !

---

### Option 2 : Règles de sécurité PERMANENTES (RECOMMANDÉ)

**À configurer dès que possible** pour sécuriser vos données :

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
    // Lecture/écriture ouverte pour test (à sécuriser plus tard)
    match /users/{userId} {
      allow read, write: if true;
    }

    // Annuaire public
    // Lecture : tout le monde
    // Écriture : tout le monde (pour test)
    match /public_directory/{userId} {
      allow read: if true;
      allow write: if true;
    }

    // Bloquer tout le reste
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. **Cliquez sur "Publier"**

---

## 📊 Structure de la base de données Firestore

Votre base de données aura cette structure :

```
firestore/
├── users/                           # Collection des données privées
│   └── {github_username}/           # Document par utilisateur
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
    └── {github_username}/           # Profil public par utilisateur
        ├── username
        ├── firstName, lastName
        ├── discipline, department
        ├── academicEmail, objectives
        ├── avatar
        └── lastUpdated
        (⚠️ PAS de champ "notes" ici)
```

---

## 🔐 Sécurité et Migration future

### Actuellement

- **Authentification** : Token GitHub (vérification côté client)
- **Autorisation Firestore** : Ouverte pour test (`allow read, write: if true`)

### Pour sécuriser davantage (optionnel, plus tard)

Vous pourriez ajouter **Firebase Authentication** avec GitHub :

1. Dans Firebase Console → **Authentication** → **Sign-in method**
2. Activer **GitHub** comme provider
3. Modifier les règles Firestore pour utiliser `request.auth.uid`

Mais **ce n'est pas nécessaire pour l'instant** ! Le système actuel fonctionne.

---

## 🚀 Test de l'intégration

1. **Ouvrez `index.html`** dans un navigateur
2. **Connectez-vous** avec votre token GitHub
3. **Remplissez votre profil** dans "Arborescence de l'écosystème"
4. **Vérifiez dans Firebase Console** :
   - Firestore Database → Données
   - Vous devriez voir :
     - Collection `users` → votre username
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
