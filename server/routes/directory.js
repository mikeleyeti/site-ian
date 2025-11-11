import express from 'express';
import database from '../config/database.js';

const router = express.Router();

/**
 * GET /api/directory/profiles
 * Récupérer tous les profils publics pour l'annuaire
 * Route publique (pas besoin d'authentification)
 */
router.get('/profiles', async (req, res) => {
    try {
        const profiles = await database.publicProfiles.find({}).toArray();

        res.json({
            success: true,
            profiles: profiles
        });

    } catch (error) {
        console.error('[Directory] Erreur lors de la récupération des profils:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des profils',
            profiles: []
        });
    }
});

export default router;
