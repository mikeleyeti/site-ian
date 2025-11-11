// MongoDB Atlas Data API Service
// Accès direct à MongoDB depuis le navigateur (comme Firebase)
// Pas besoin de backend Node.js !

class MongoDBAtlasService {
    constructor() {
        // Configuration MongoDB Atlas Data API
        // À configurer après avoir créé votre cluster Atlas
        this.config = {
            // URL de votre Data API (voir README-MONGODB-ATLAS.md pour l'obtenir)
            dataApiUrl: 'https://data.mongodb-api.com/app/YOUR-APP-ID/endpoint/data/v1',
            // Clé API publique (créée dans Atlas, sécurisée par les règles)
            apiKey: 'YOUR-API-KEY',
            // Nom de votre cluster
            dataSource: 'Cluster0',
            // Nom de votre base de données
            database: 'ian-database'
        };

        this.currentUser = null;
        this.initialized = false;
    }

    // Initialisation du service
    async initialize() {
        console.log('[MongoDB Atlas] Initializing...');

        // Charger l'utilisateur depuis le localStorage
        const userData = localStorage.getItem('atlas_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('[MongoDB Atlas] User restored:', this.currentUser.email);
            } catch (error) {
                console.error('[MongoDB Atlas] Invalid user data:', error);
                localStorage.removeItem('atlas_user');
            }
        }

        this.initialized = true;
        return true;
    }

    // Méthode générique pour appeler l'API MongoDB Atlas
    async callDataAPI(action, collection, options = {}) {
        try {
            const url = `${this.config.dataApiUrl}/action/${action}`;

            const body = {
                dataSource: this.config.dataSource,
                database: this.config.database,
                collection: collection,
                ...options
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`MongoDB Atlas API Error: ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[MongoDB Atlas] API call failed:', error);
            throw error;
        }
    }

    // Générer un hash simple pour le mot de passe (côté client)
    // Note: En production, utilisez une vraie bibliothèque de hashage comme bcryptjs
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ========== MÉTHODES D'AUTHENTIFICATION ==========

    // Inscription d'un nouvel utilisateur
    async signUp(email, password, displayName) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await this.callDataAPI('findOne', 'users', {
                filter: { email: email.toLowerCase() }
            });

            if (existingUser.document) {
                return {
                    success: false,
                    error: 'Cette adresse email est déjà utilisée'
                };
            }

            // Hasher le mot de passe
            const hashedPassword = await this.hashPassword(password);

            // Créer l'utilisateur
            const newUser = {
                email: email.toLowerCase(),
                password: hashedPassword,
                displayName: displayName,
                createdAt: new Date().toISOString(),
                ianProfile: {
                    avatar: '👤',
                    firstName: '',
                    lastName: '',
                    discipline: '',
                    department: '',
                    academicEmail: '',
                    objectives: '',
                    notes: ''
                },
                contacts: [],
                newsletters: [],
                actualites: [],
                usages: []
            };

            const result = await this.callDataAPI('insertOne', 'users', {
                document: newUser
            });

            // Stocker l'utilisateur connecté
            this.currentUser = {
                uid: result.insertedId,
                email: email.toLowerCase(),
                displayName: displayName
            };

            localStorage.setItem('atlas_user', JSON.stringify(this.currentUser));

            return {
                success: true,
                user: this.currentUser
            };

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            return {
                success: false,
                error: error.message || 'Erreur lors de l\'inscription'
            };
        }
    }

    // Connexion d'un utilisateur
    async signIn(email, password) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            // Hasher le mot de passe pour la comparaison
            const hashedPassword = await this.hashPassword(password);

            // Chercher l'utilisateur
            const result = await this.callDataAPI('findOne', 'users', {
                filter: {
                    email: email.toLowerCase(),
                    password: hashedPassword
                }
            });

            if (!result.document) {
                return {
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                };
            }

            const user = result.document;

            // Stocker l'utilisateur connecté
            this.currentUser = {
                uid: user._id,
                email: user.email,
                displayName: user.displayName
            };

            localStorage.setItem('atlas_user', JSON.stringify(this.currentUser));

            return {
                success: true,
                user: this.currentUser
            };

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return {
                success: false,
                error: error.message || 'Erreur lors de la connexion'
            };
        }
    }

    // Déconnexion
    async signOutUser() {
        this.currentUser = null;
        localStorage.removeItem('atlas_user');
        return { success: true };
    }

    // Récupérer l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Obtenir l'UID de l'utilisateur actuel
    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }

    // Obtenir le nom d'affichage de l'utilisateur
    getDisplayName() {
        if (!this.currentUser) return null;
        return this.currentUser.displayName || this.currentUser.email.split('@')[0];
    }

    // ========== MÉTHODES DE GESTION DES DONNÉES ==========

    // Sauvegarder toutes les données de l'utilisateur
    async saveUserData(data) {
        if (!this.initialized || !this.currentUser) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        try {
            // Ajouter la date de mise à jour
            data.lastUpdated = new Date().toISOString();

            // Mettre à jour les données utilisateur
            await this.callDataAPI('updateOne', 'users', {
                filter: { _id: { $oid: this.currentUser.uid } },
                update: {
                    $set: {
                        ianProfile: data.ianProfile,
                        contacts: data.contacts,
                        newsletters: data.newsletters,
                        actualites: data.actualites,
                        usages: data.usages,
                        lastUpdated: data.lastUpdated
                    }
                }
            });

            // Mettre à jour le profil public (sans les notes privées)
            if (data.ianProfile) {
                const { notes, ...publicProfile } = data.ianProfile;

                await this.callDataAPI('updateOne', 'public_profiles', {
                    filter: { userId: this.currentUser.uid },
                    update: {
                        $set: {
                            userId: this.currentUser.uid,
                            displayName: this.currentUser.displayName,
                            email: this.currentUser.email,
                            ...publicProfile,
                            lastUpdated: data.lastUpdated
                        }
                    },
                    upsert: true
                });
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données:', error);
            throw error;
        }
    }

    // Récupérer les données de l'utilisateur
    async getUserData() {
        if (!this.initialized || !this.currentUser) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        try {
            const result = await this.callDataAPI('findOne', 'users', {
                filter: { _id: { $oid: this.currentUser.uid } },
                projection: { password: 0 } // Ne pas récupérer le mot de passe
            });

            if (result.document) {
                return {
                    ianProfile: result.document.ianProfile || {},
                    contacts: result.document.contacts || [],
                    newsletters: result.document.newsletters || [],
                    actualites: result.document.actualites || [],
                    usages: result.document.usages || [],
                    lastUpdated: result.document.lastUpdated || null
                };
            }

            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            throw error;
        }
    }

    // Mettre à jour le profil public (géré automatiquement par saveUserData)
    async updatePublicProfile(profile) {
        return true;
    }

    // Récupérer tous les profils publics pour l'annuaire
    async getSharedProfiles() {
        if (!this.initialized) {
            console.error('Service non initialisé');
            return [];
        }

        try {
            const result = await this.callDataAPI('find', 'public_profiles', {
                filter: {}
            });

            return result.documents || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des profils partagés:', error);
            return [];
        }
    }

    // Mettre à jour un champ spécifique du profil
    async updateProfileField(field, value) {
        if (!this.initialized || !this.currentUser) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        try {
            const updateData = {
                [`ianProfile.${field}`]: value,
                lastUpdated: new Date().toISOString()
            };

            // Mettre à jour dans les données utilisateur
            await this.callDataAPI('updateOne', 'users', {
                filter: { _id: { $oid: this.currentUser.uid } },
                update: { $set: updateData }
            });

            // Si ce n'est pas le champ "notes", mettre à jour le profil public
            if (field !== 'notes') {
                await this.callDataAPI('updateOne', 'public_profiles', {
                    filter: { userId: this.currentUser.uid },
                    update: {
                        $set: {
                            [field]: value,
                            lastUpdated: updateData.lastUpdated
                        }
                    },
                    upsert: true
                });
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du champ:', error);
            throw error;
        }
    }
}

// Instance globale
const mongoDBAtlasService = new MongoDBAtlasService();

// Alias pour compatibilité avec le code existant
const firestoreService = mongoDBAtlasService;
