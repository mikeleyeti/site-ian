/**
 * Script de migration Firestore vers MongoDB
 *
 * Ce script migre toutes les données de Firestore vers MongoDB
 * IMPORTANT: Nécessite les credentials Firebase Admin SDK
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import database from './config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Firebase Admin (vous devez télécharger votre fichier serviceAccountKey.json depuis Firebase Console)
// Allez dans Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = JSON.parse(
    readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestoreDb = admin.firestore();

/**
 * Migrer les utilisateurs et leurs données
 */
async function migrateUsers() {
    console.log('\n[Migration] Début de la migration des utilisateurs...');

    try {
        // Récupérer tous les utilisateurs depuis Firestore
        const usersSnapshot = await firestoreDb.collection('users').get();

        console.log(`[Migration] ${usersSnapshot.size} utilisateurs trouvés dans Firestore`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const doc of usersSnapshot.docs) {
            try {
                const firestoreData = doc.data();
                const firestoreUserId = doc.id;

                console.log(`\n[Migration] Migration de l'utilisateur: ${firestoreUserId}`);

                // Récupérer les informations d'authentification depuis Firebase Auth
                let authUser;
                try {
                    authUser = await admin.auth().getUser(firestoreUserId);
                } catch (authError) {
                    console.warn(`[Migration] Utilisateur Auth non trouvé pour ${firestoreUserId}, création avec données par défaut`);
                    authUser = null;
                }

                // Créer un mot de passe par défaut (l'utilisateur devra le changer)
                // En production, vous devriez envoyer un email de réinitialisation
                const defaultPassword = await bcrypt.hash('ChangeMe123!', 10);

                // Préparer les données pour MongoDB
                const mongoUser = {
                    email: authUser ? authUser.email.toLowerCase() : `user-${firestoreUserId}@migration.local`,
                    password: defaultPassword, // Mot de passe par défaut
                    displayName: authUser ? authUser.displayName : (firestoreData.ianProfile?.firstName || 'Utilisateur'),
                    createdAt: authUser ? new Date(authUser.metadata.creationTime) : new Date(),
                    ianProfile: firestoreData.ianProfile || {
                        avatar: '👤',
                        firstName: '',
                        lastName: '',
                        discipline: '',
                        department: '',
                        academicEmail: '',
                        objectives: '',
                        notes: ''
                    },
                    contacts: firestoreData.contacts || [],
                    newsletters: firestoreData.newsletters || [],
                    actualites: firestoreData.actualites || [],
                    usages: firestoreData.usages || [],
                    lastUpdated: firestoreData.lastUpdated || null,
                    // Metadata de migration
                    _migration: {
                        firestoreId: firestoreUserId,
                        migratedAt: new Date().toISOString(),
                        passwordResetRequired: true
                    }
                };

                // Insérer dans MongoDB (ou mettre à jour si existe déjà)
                const result = await database.users.updateOne(
                    { email: mongoUser.email },
                    { $set: mongoUser },
                    { upsert: true }
                );

                if (result.upsertedCount > 0) {
                    console.log(`[Migration] ✓ Utilisateur créé: ${mongoUser.email}`);
                } else {
                    console.log(`[Migration] ✓ Utilisateur mis à jour: ${mongoUser.email}`);
                }

                migratedCount++;

            } catch (error) {
                console.error(`[Migration] ✗ Erreur pour l'utilisateur ${doc.id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n[Migration] Migration des utilisateurs terminée:`);
        console.log(`  - Réussis: ${migratedCount}`);
        console.log(`  - Erreurs: ${errorCount}`);

        return { migratedCount, errorCount };

    } catch (error) {
        console.error('[Migration] Erreur lors de la migration des utilisateurs:', error);
        throw error;
    }
}

/**
 * Migrer les profils publics
 */
async function migratePublicProfiles() {
    console.log('\n[Migration] Début de la migration des profils publics...');

    try {
        // Récupérer tous les profils publics depuis Firestore
        const profilesSnapshot = await firestoreDb.collection('public_directory').get();

        console.log(`[Migration] ${profilesSnapshot.size} profils publics trouvés dans Firestore`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const doc of profilesSnapshot.docs) {
            try {
                const firestoreProfile = doc.data();
                const firestoreUserId = doc.id;

                // Trouver l'utilisateur correspondant dans MongoDB
                const mongoUser = await database.users.findOne({
                    '_migration.firestoreId': firestoreUserId
                });

                if (!mongoUser) {
                    console.warn(`[Migration] Utilisateur MongoDB non trouvé pour le profil ${firestoreUserId}`);
                    errorCount++;
                    continue;
                }

                const mongoUserId = mongoUser._id.toString();

                // Préparer le profil public pour MongoDB
                const mongoProfile = {
                    userId: mongoUserId,
                    displayName: firestoreProfile.displayName || mongoUser.displayName,
                    email: firestoreProfile.email || mongoUser.email,
                    avatar: firestoreProfile.avatar || '👤',
                    firstName: firestoreProfile.firstName || '',
                    lastName: firestoreProfile.lastName || '',
                    discipline: firestoreProfile.discipline || '',
                    department: firestoreProfile.department || '',
                    academicEmail: firestoreProfile.academicEmail || '',
                    objectives: firestoreProfile.objectives || '',
                    lastUpdated: firestoreProfile.lastUpdated || new Date().toISOString()
                };

                // Insérer dans MongoDB
                await database.publicProfiles.updateOne(
                    { userId: mongoUserId },
                    { $set: mongoProfile },
                    { upsert: true }
                );

                console.log(`[Migration] ✓ Profil public migré: ${mongoProfile.email}`);
                migratedCount++;

            } catch (error) {
                console.error(`[Migration] ✗ Erreur pour le profil ${doc.id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n[Migration] Migration des profils publics terminée:`);
        console.log(`  - Réussis: ${migratedCount}`);
        console.log(`  - Erreurs: ${errorCount}`);

        return { migratedCount, errorCount };

    } catch (error) {
        console.error('[Migration] Erreur lors de la migration des profils publics:', error);
        throw error;
    }
}

/**
 * Fonction principale de migration
 */
async function migrate() {
    console.log('='.repeat(60));
    console.log('MIGRATION FIRESTORE -> MONGODB');
    console.log('='.repeat(60));

    try {
        // Se connecter à MongoDB
        await database.connect();
        console.log('[Migration] Connexion à MongoDB réussie');

        // Migrer les utilisateurs
        const usersResult = await migrateUsers();

        // Migrer les profils publics
        const profilesResult = await migratePublicProfiles();

        console.log('\n' + '='.repeat(60));
        console.log('RÉSUMÉ DE LA MIGRATION');
        console.log('='.repeat(60));
        console.log(`Utilisateurs migrés: ${usersResult.migratedCount}`);
        console.log(`Profils publics migrés: ${profilesResult.migratedCount}`);
        console.log(`Total d'erreurs: ${usersResult.errorCount + profilesResult.errorCount}`);
        console.log('='.repeat(60));

        console.log('\n⚠️  IMPORTANT: Tous les utilisateurs ont un mot de passe par défaut "ChangeMe123!"');
        console.log('   Les utilisateurs devront réinitialiser leur mot de passe.');
        console.log('   Vous pouvez implémenter un système d\'envoi d\'email de réinitialisation.');

    } catch (error) {
        console.error('\n[Migration] Erreur fatale:', error);
        process.exit(1);
    } finally {
        // Fermer les connexions
        await database.close();
        await admin.app().delete();
        console.log('\n[Migration] Connexions fermées');
    }
}

// Lancer la migration
migrate();
