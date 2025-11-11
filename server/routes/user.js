import express from 'express';
import { ObjectId } from 'mongodb';
import database from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * GET /api/user/data
 * Récupérer les données de l'utilisateur connecté
 */
router.get('/data', async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await database.users.findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } } // Ne pas renvoyer le mot de passe
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Retourner les données au format attendu par le frontend
        res.json({
            success: true,
            data: {
                ianProfile: user.ianProfile || {},
                contacts: user.contacts || [],
                newsletters: user.newsletters || [],
                actualites: user.actualites || [],
                usages: user.usages || [],
                lastUpdated: user.lastUpdated || null
            }
        });

    } catch (error) {
        console.error('[User] Erreur lors de la récupération des données:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des données'
        });
    }
});

/**
 * PUT /api/user/data
 * Sauvegarder toutes les données de l'utilisateur
 */
router.put('/data', async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = req.body;

        // Ajouter la date de mise à jour
        data.lastUpdated = new Date().toISOString();

        // Mettre à jour les données utilisateur
        await database.users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    ianProfile: data.ianProfile,
                    contacts: data.contacts,
                    newsletters: data.newsletters,
                    actualites: data.actualites,
                    usages: data.usages,
                    lastUpdated: data.lastUpdated
                }
            }
        );

        // Mettre à jour le profil public (sans les notes privées)
        if (data.ianProfile) {
            const { notes, ...publicProfile } = data.ianProfile;

            await database.publicProfiles.updateOne(
                { userId: userId },
                {
                    $set: {
                        userId: userId,
                        displayName: req.user.displayName,
                        email: req.user.email,
                        ...publicProfile,
                        lastUpdated: data.lastUpdated
                    }
                },
                { upsert: true }
            );
        }

        res.json({
            success: true,
            message: 'Données sauvegardées avec succès'
        });

    } catch (error) {
        console.error('[User] Erreur lors de la sauvegarde des données:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la sauvegarde des données'
        });
    }
});

/**
 * PATCH /api/user/profile/:field
 * Mettre à jour un champ spécifique du profil
 */
router.patch('/profile/:field', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { field } = req.params;
        const { value } = req.body;

        const updateData = {
            [`ianProfile.${field}`]: value,
            lastUpdated: new Date().toISOString()
        };

        // Mettre à jour dans les données utilisateur
        await database.users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        // Si ce n'est pas le champ "notes", mettre à jour le profil public
        if (field !== 'notes') {
            await database.publicProfiles.updateOne(
                { userId: userId },
                {
                    $set: {
                        [field]: value,
                        lastUpdated: updateData.lastUpdated
                    }
                },
                { upsert: true }
            );
        }

        res.json({
            success: true,
            message: 'Champ mis à jour avec succès'
        });

    } catch (error) {
        console.error('[User] Erreur lors de la mise à jour du champ:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour'
        });
    }
});

export default router;
