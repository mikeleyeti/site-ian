import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import database from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import directoryRoutes from './routes/directory.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger des requêtes (pour le développement)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/directory', directoryRoutes);

// Route de santé
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API IAN fonctionne correctement',
        timestamp: new Date().toISOString()
    });
});

// Route par défaut
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API IAN - Backend MongoDB',
        version: '1.0.0',
        endpoints: {
            auth: {
                signup: 'POST /api/auth/signup',
                signin: 'POST /api/auth/signin'
            },
            user: {
                getData: 'GET /api/user/data',
                saveData: 'PUT /api/user/data',
                updateField: 'PATCH /api/user/profile/:field'
            },
            directory: {
                getProfiles: 'GET /api/directory/profiles'
            }
        }
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route non trouvée'
    });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
    console.error('[Server] Erreur:', err);
    res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
    });
});

// Démarrage du serveur
const startServer = async () => {
    try {
        // Connexion à MongoDB
        await database.connect();

        // Créer les index pour optimiser les performances
        await database.users.createIndex({ email: 1 }, { unique: true });
        await database.publicProfiles.createIndex({ userId: 1 }, { unique: true });
        console.log('[MongoDB] Index créés avec succès');

        // Démarrer le serveur Express
        app.listen(PORT, () => {
            console.log(`[Server] Serveur démarré sur le port ${PORT}`);
            console.log(`[Server] API disponible sur http://localhost:${PORT}`);
            console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
        });

    } catch (error) {
        console.error('[Server] Erreur lors du démarrage:', error);
        process.exit(1);
    }
};

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
    console.log('\n[Server] Arrêt du serveur...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n[Server] Arrêt du serveur...');
    await database.close();
    process.exit(0);
});

// Démarrer le serveur
startServer();
