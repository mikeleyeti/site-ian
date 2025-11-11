import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class Database {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            if (this.client) {
                return this.db;
            }

            console.log('[MongoDB] Connexion à la base de données...');
            this.client = new MongoClient(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            await this.client.connect();

            // Vérifier la connexion
            await this.client.db('admin').command({ ping: 1 });
            console.log('[MongoDB] Connexion réussie !');

            // Extraire le nom de la base de données de l'URI
            const dbName = new URL(process.env.MONGODB_URI).pathname.slice(1) || 'ian-database';
            this.db = this.client.db(dbName);

            return this.db;
        } catch (error) {
            console.error('[MongoDB] Erreur de connexion:', error);
            throw error;
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('[MongoDB] Connexion fermée');
            this.client = null;
            this.db = null;
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('La base de données n\'est pas connectée');
        }
        return this.db;
    }

    // Collections
    getCollection(name) {
        return this.getDb().collection(name);
    }

    // Raccourcis pour les collections principales
    get users() {
        return this.getCollection('users');
    }

    get publicProfiles() {
        return this.getCollection('public_profiles');
    }
}

// Instance singleton
const database = new Database();

export default database;
