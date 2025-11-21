# Migration : Ajout de la visibilité publique/privée pour les événements

## 📋 Description

Cette migration ajoute la fonctionnalité de visibilité publique/privée pour les événements de la timeline Newsletter. Les utilisateurs peuvent maintenant :
- Créer des événements **privés** (visibles uniquement par eux-mêmes)
- Créer des événements **publics** (visibles par tous les IAN de l'application)

## 🗄️ Migration de la base de données

### Étapes à suivre

1. **Ouvrir l'éditeur SQL de Supabase**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet
   - Cliquer sur "SQL Editor" dans le menu de gauche

2. **Exécuter le script de migration**
   - Ouvrir le fichier `supabase-public-events-migration.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL
   - Cliquer sur "Run" pour exécuter

### Ce que fait la migration

- ✅ Crée la table `public_events` pour stocker les événements publics
- ✅ Configure les index pour améliorer les performances
- ✅ Active Row Level Security (RLS) avec les bonnes politiques
- ✅ Configure les triggers pour les timestamps automatiques

### Structure de la table `public_events`

```sql
CREATE TABLE public_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    author_name TEXT,
    author_email TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    objective TEXT NOT NULL,
    description TEXT,
    link TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

## 🔐 Politiques de sécurité (RLS)

- **Lecture** : Tous les utilisateurs authentifiés peuvent lire les événements publics
- **Création** : Les utilisateurs peuvent créer leurs propres événements
- **Modification** : Les utilisateurs peuvent uniquement modifier leurs propres événements
- **Suppression** : Les utilisateurs peuvent uniquement supprimer leurs propres événements

## 📦 Stockage des données

### Événements privés
- Stockés dans la table `users`, colonne `newsletters` (JSONB)
- Visibles uniquement par l'utilisateur propriétaire
- Icône : 🔒

### Événements publics
- Stockés dans la table `public_events`
- Visibles par tous les utilisateurs authentifiés
- Affichent le nom de l'auteur
- Icône : 🌐

## 🎨 Interface utilisateur

### Formulaire d'ajout
- Nouveau champ "Visibilité" avec deux options :
  - 🔒 **Privé** (par défaut) : visible uniquement par moi
  - 🌐 **Public** : visible par tous les IAN

### Affichage des événements
- Badge de visibilité sur chaque événement
- Nom de l'auteur pour les événements publics
- Bouton de suppression uniquement pour ses propres événements

## 🚀 Comment tester

1. **Appliquer la migration SQL dans Supabase**
2. **Créer un événement privé**
   - Sélectionner "Privé" dans le champ visibilité
   - L'événement apparaît avec le badge 🔒
   - Seul vous pouvez le voir
3. **Créer un événement public**
   - Sélectionner "Public" dans le champ visibilité
   - L'événement apparaît avec le badge 🌐
   - Tous les utilisateurs peuvent le voir avec votre nom
4. **Tester avec un autre compte**
   - Se connecter avec un autre utilisateur
   - Vérifier que les événements publics sont visibles
   - Vérifier que vous ne pouvez pas supprimer les événements des autres

## ⚠️ Important

- **La migration SQL est obligatoire** pour que la fonctionnalité fonctionne
- Sans cette migration, seuls les événements privés fonctionneront
- Les événements existants restent privés par défaut

## 🔧 Rollback (retour arrière)

Si vous souhaitez annuler cette migration :

```sql
DROP TABLE IF EXISTS public_events CASCADE;
```

**⚠️ Attention** : Cela supprimera définitivement tous les événements publics créés !
