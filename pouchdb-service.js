// PouchDB Service - Communication directe avec CouchDB
// Pas besoin de backend Node.js !
// CouchDB installé sur votre serveur communique directement avec le navigateur

class PouchDBService {
    constructor() {
        // Configuration - À adapter avec votre serveur CouchDB
        this.config = {
            // URL de votre serveur CouchDB
            // Exemples :
            // - Local : 'http://localhost:5984'
            // - Serveur : 'http://votre-serveur.com:5984'
            // - HTTPS : 'https://votre-serveur.com' (recommandé en production)
            couchdbUrl: 'http://localhost:5984',

            // Noms des bases de données
            usersDbName: 'ian_users',
            publicProfilesDbName: 'ian_public_profiles'
        };

        this.db = null;
        this.publicDb = null;
        this.remoteDb = null;
        this.remotePublicDb = null;
        this.currentUser = null;
        this.initialized = false;
        this.syncHandler = null;
        this.syncPublicHandler = null;
    }

    // Initialisation du service
    async initialize() {
        console.log('[PouchDB] Initializing...');

        try {
            // Créer les bases de données locales (dans le navigateur)
            this.db = new PouchDB('ian_local_users');
            this.publicDb = new PouchDB('ian_local_public');

            // Charger l'utilisateur depuis le localStorage
            const userData = localStorage.getItem('pouchdb_user');
            if (userData) {
                try {
                    this.currentUser = JSON.parse(userData);
                    console.log('[PouchDB] User restored:', this.currentUser.email);

                    // Se connecter aux bases distantes avec les credentials
                    await this.setupRemoteSync();
                } catch (error) {
                    console.error('[PouchDB] Invalid user data:', error);
                    localStorage.removeItem('pouchdb_user');
                }
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('[PouchDB] Initialization error:', error);
            throw error;
        }
    }

    // Configurer la synchronisation avec CouchDB distant
    async setupRemoteSync() {
        if (!this.currentUser) return;

        const auth = btoa(`${this.currentUser.email}:${this.currentUser.password}`);
        const authHeaders = {
            fetch: (url, opts) => {
                opts.headers.set('Authorization', 'Basic ' + auth);
                return PouchDB.fetch(url, opts);
            }
        };

        // Connexion aux bases distantes
        this.remoteDb = new PouchDB(
            `${this.config.couchdbUrl}/${this.config.usersDbName}`,
            authHeaders
        );

        this.remotePublicDb = new PouchDB(
            `${this.config.couchdbUrl}/${this.config.publicProfilesDbName}`,
            authHeaders
        );

        // Synchronisation bidirectionnelle continue
        this.syncHandler = this.db.sync(this.remoteDb, {
            live: true,
            retry: true
        }).on('change', (info) => {
            console.log('[PouchDB] Sync change:', info);
        }).on('error', (err) => {
            console.error('[PouchDB] Sync error:', err);
        });

        this.syncPublicHandler = this.publicDb.sync(this.remotePublicDb, {
            live: true,
            retry: true
        }).on('change', (info) => {
            console.log('[PouchDB] Public sync change:', info);
        }).on('error', (err) => {
            console.error('[PouchDB] Public sync error:', err);
        });

        console.log('[PouchDB] Synchronization started');
    }

    // Arrêter la synchronisation
    stopSync() {
        if (this.syncHandler) {
            this.syncHandler.cancel();
            this.syncHandler = null;
        }
        if (this.syncPublicHandler) {
            this.syncPublicHandler.cancel();
            this.syncPublicHandler = null;
        }
    }

    // Générer un hash simple pour le mot de passe
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
            const existingUsers = await this.db.allDocs({
                include_docs: true,
                startkey: 'user_',
                endkey: 'user_\ufff0'
            });

            const userExists = existingUsers.rows.some(row =>
                row.doc && row.doc.email === email.toLowerCase()
            );

            if (userExists) {
                return {
                    success: false,
                    error: 'Cette adresse email est déjà utilisée'
                };
            }

            // Hasher le mot de passe
            const hashedPassword = await this.hashPassword(password);

            // Créer l'utilisateur
            const userId = 'user_' + Date.now();
            const newUser = {
                _id: userId,
                type: 'user',
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

            // Sauvegarder localement
            await this.db.put(newUser);

            // Stocker l'utilisateur connecté
            this.currentUser = {
                uid: userId,
                email: email.toLowerCase(),
                displayName: displayName,
                password: password // Nécessaire pour la synchro CouchDB
            };

            localStorage.setItem('pouchdb_user', JSON.stringify(this.currentUser));

            // Démarrer la synchronisation
            await this.setupRemoteSync();

            return {
                success: true,
                user: {
                    uid: userId,
                    email: email.toLowerCase(),
                    displayName: displayName
                }
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
            // Hasher le mot de passe
            const hashedPassword = await this.hashPassword(password);

            // Chercher l'utilisateur localement d'abord
            const users = await this.db.allDocs({
                include_docs: true,
                startkey: 'user_',
                endkey: 'user_\ufff0'
            });

            let user = users.rows.find(row =>
                row.doc &&
                row.doc.email === email.toLowerCase() &&
                row.doc.password === hashedPassword
            );

            // Si pas trouvé localement, essayer depuis le serveur
            if (!user) {
                // Tenter de se connecter au serveur CouchDB
                const auth = btoa(`${email.toLowerCase()}:${password}`);
                const remoteDb = new PouchDB(
                    `${this.config.couchdbUrl}/${this.config.usersDbName}`,
                    {
                        fetch: (url, opts) => {
                            opts.headers.set('Authorization', 'Basic ' + auth);
                            return PouchDB.fetch(url, opts);
                        }
                    }
                );

                try {
                    // Télécharger les données de l'utilisateur
                    const remoteUsers = await remoteDb.allDocs({
                        include_docs: true,
                        startkey: 'user_',
                        endkey: 'user_\ufff0'
                    });

                    user = remoteUsers.rows.find(row =>
                        row.doc &&
                        row.doc.email === email.toLowerCase() &&
                        row.doc.password === hashedPassword
                    );

                    if (user) {
                        // Synchroniser localement
                        await this.db.put(user.doc);
                    }
                } catch (remoteError) {
                    console.error('[PouchDB] Remote connection error:', remoteError);
                }
            }

            if (!user || !user.doc) {
                return {
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                };
            }

            // Stocker l'utilisateur connecté
            this.currentUser = {
                uid: user.doc._id,
                email: user.doc.email,
                displayName: user.doc.displayName,
                password: password // Nécessaire pour la synchro CouchDB
            };

            localStorage.setItem('pouchdb_user', JSON.stringify(this.currentUser));

            // Démarrer la synchronisation
            await this.setupRemoteSync();

            return {
                success: true,
                user: {
                    uid: user.doc._id,
                    email: user.doc.email,
                    displayName: user.doc.displayName
                }
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
        this.stopSync();
        this.currentUser = null;
        localStorage.removeItem('pouchdb_user');
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
            // Récupérer le document utilisateur
            const userDoc = await this.db.get(this.currentUser.uid);

            // Mettre à jour les données
            userDoc.ianProfile = data.ianProfile;
            userDoc.contacts = data.contacts;
            userDoc.newsletters = data.newsletters;
            userDoc.actualites = data.actualites;
            userDoc.usages = data.usages;
            userDoc.lastUpdated = new Date().toISOString();

            // Sauvegarder
            await this.db.put(userDoc);

            // Mettre à jour le profil public
            if (data.ianProfile) {
                const { notes, ...publicProfile } = data.ianProfile;

                const profileId = 'profile_' + this.currentUser.uid;

                try {
                    const existingProfile = await this.publicDb.get(profileId);
                    await this.publicDb.put({
                        ...existingProfile,
                        userId: this.currentUser.uid,
                        displayName: this.currentUser.displayName,
                        email: this.currentUser.email,
                        ...publicProfile,
                        lastUpdated: userDoc.lastUpdated
                    });
                } catch (err) {
                    // Le profil n'existe pas, le créer
                    await this.publicDb.put({
                        _id: profileId,
                        type: 'profile',
                        userId: this.currentUser.uid,
                        displayName: this.currentUser.displayName,
                        email: this.currentUser.email,
                        ...publicProfile,
                        lastUpdated: userDoc.lastUpdated
                    });
                }
            }

            // La synchronisation est automatique !
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
            const userDoc = await this.db.get(this.currentUser.uid);

            return {
                ianProfile: userDoc.ianProfile || {},
                contacts: userDoc.contacts || [],
                newsletters: userDoc.newsletters || [],
                actualites: userDoc.actualites || [],
                usages: userDoc.usages || [],
                lastUpdated: userDoc.lastUpdated || null
            };
        } catch (error) {
            if (error.name === 'not_found') {
                return null;
            }
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
            const profiles = await this.publicDb.allDocs({
                include_docs: true,
                startkey: 'profile_',
                endkey: 'profile_\ufff0'
            });

            return profiles.rows
                .filter(row => row.doc && row.doc.type === 'profile')
                .map(row => row.doc);
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
            const userDoc = await this.db.get(this.currentUser.uid);

            // Mettre à jour le champ
            if (!userDoc.ianProfile) {
                userDoc.ianProfile = {};
            }
            userDoc.ianProfile[field] = value;
            userDoc.lastUpdated = new Date().toISOString();

            await this.db.put(userDoc);

            // Mettre à jour le profil public si ce n'est pas le champ "notes"
            if (field !== 'notes') {
                const profileId = 'profile_' + this.currentUser.uid;
                try {
                    const profileDoc = await this.publicDb.get(profileId);
                    profileDoc[field] = value;
                    profileDoc.lastUpdated = userDoc.lastUpdated;
                    await this.publicDb.put(profileDoc);
                } catch (err) {
                    console.warn('[PouchDB] Profile not found, will be created on next save');
                }
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du champ:', error);
            throw error;
        }
    }
}

// Instance globale
const pouchDBService = new PouchDBService();

// Alias pour compatibilité avec le code existant
const firestoreService = pouchDBService;
