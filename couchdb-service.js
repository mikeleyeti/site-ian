// PouchDB & CouchDB Service
// Gère l'authentification CouchDB et la synchronisation des données avec PouchDB

class CouchDBService {
    constructor() {
        this.localDB = null;
        this.remoteDB = null;
        this.publicDB = null;
        this.remotePublicDB = null;
        this.syncHandler = null;
        this.publicSyncHandler = null;
        this.currentUser = null;
        this.initialized = false;
        this.couchDBUrl = null;
    }

    // Initialisation du service avec PouchDB et CouchDB
    async initialize(couchDBUrl) {
        try {
            console.log('[CouchDB] Initializing service...');
            this.couchDBUrl = couchDBUrl;
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('[CouchDB] Erreur d\'initialisation:', error);
            throw error;
        }
    }

    // Créer les bases de données locales et distantes pour l'utilisateur
    async setupUserDatabases(userId, userPassword) {
        try {
            console.log('[CouchDB] Setting up databases for user:', userId);

            // Créer la base de données locale (IndexedDB)
            this.localDB = new PouchDB(`ian_user_${userId}`);
            console.log('[CouchDB] Local DB created:', `ian_user_${userId}`);

            // Créer la base de données publique locale
            this.publicDB = new PouchDB('ian_public');
            console.log('[CouchDB] Public local DB created');

            // Auth utilisateur pour la synchronisation et création de bases
            const userAuth = `${userId}:${userPassword}`;
            console.log('[CouchDB] Using user credentials:', userId);

            // La base distante sera créée automatiquement par PouchDB
            // grâce à la config CouchDB qui permet aux users de créer des bases
            const remoteDbName = `ian_user_${userId}`;
            console.log('[CouchDB] User database will be auto-created:', remoteDbName);

            // Connecter aux bases distantes avec les credentials UTILISATEUR
            this.remoteDB = new PouchDB(`${this.couchDBUrl}/${remoteDbName}`, {
                auth: userAuth,
                skip_setup: true
            });
            console.log('[CouchDB] Connected to remote DB with user credentials');

            this.remotePublicDB = new PouchDB(`${this.couchDBUrl}/ian_public`, {
                auth: userAuth,
                skip_setup: true
            });
            console.log('[CouchDB] Connected to remote public DB with user credentials');

            // Configurer la synchronisation bidirectionnelle continue
            this.syncHandler = this.localDB.sync(this.remoteDB, {
                live: true,
                retry: true
            }).on('change', (info) => {
                console.log('[CouchDB] Sync change:', info.direction, info.change.docs.length, 'docs');
            }).on('paused', () => {
                console.log('[CouchDB] Sync paused (up to date)');
            }).on('active', () => {
                console.log('[CouchDB] Sync resumed');
            }).on('error', (err) => {
                console.error('[CouchDB] Sync error:', err);
            });

            // Synchroniser la base publique
            this.publicSyncHandler = this.publicDB.sync(this.remotePublicDB, {
                live: true,
                retry: true
            }).on('change', (info) => {
                console.log('[CouchDB] Public sync change:', info.direction, info.change.docs.length, 'docs');
            }).on('paused', () => {
                console.log('[CouchDB] Public sync paused (up to date)');
            }).on('active', () => {
                console.log('[CouchDB] Public sync resumed');
            }).on('error', (err) => {
                console.error('[CouchDB] Public sync error:', err);
            });

            console.log('[CouchDB] ✅ Databases setup complete');
            return true;
        } catch (error) {
            console.error('[CouchDB] ❌ Error setting up databases:', error);
            throw error;
        }
    }

    // ========== MÉTHODES D'AUTHENTIFICATION ==========

    // Inscription d'un nouvel utilisateur
    async signUp(email, password, displayName) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            console.log('[CouchDB] Creating user:', email);

            const username = email.replace(/[@.]/g, '_');

            // Créer l'utilisateur dans CouchDB (auto-inscription)
            const userDoc = {
                _id: `org.couchdb.user:${username}`,
                name: username,
                password: password,
                roles: [],
                type: 'user'
            };

            const response = await fetch(`${this.couchDBUrl}/_users/${userDoc._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userDoc)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.reason || 'Erreur lors de la création du compte');
            }

            console.log('[CouchDB] User created successfully');

            // Connexion automatique après inscription
            const result = await this.signIn(email, password, displayName);
            return result;
        } catch (error) {
            console.error('[CouchDB] Erreur lors de l\'inscription:', error);

            let errorMessage = 'Erreur lors de l\'inscription';
            if (error.message.includes('conflict')) {
                errorMessage = 'Cette adresse email est déjà utilisée';
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    // Connexion d'un utilisateur
    async signIn(email, password, displayName = null) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            console.log('[CouchDB] Signing in user:', email);

            const username = email.replace(/[@.]/g, '_');

            // Vérifier les identifiants
            const response = await fetch(`${this.couchDBUrl}/_session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: username,
                    password: password
                })
            });

            if (!response.ok) {
                throw new Error('Email ou mot de passe incorrect');
            }

            const sessionData = await response.json();
            console.log('[CouchDB] Login successful:', sessionData);

            // Créer l'objet utilisateur
            this.currentUser = {
                uid: username,
                email: email,
                displayName: displayName || email.split('@')[0]
            };

            // Sauvegarder dans localStorage
            localStorage.setItem('couchdb_user', JSON.stringify(this.currentUser));
            localStorage.setItem('couchdb_user_password', password); // Stocker le password pour la sync

            // Configurer les bases de données avec le password utilisateur
            await this.setupUserDatabases(username, password);

            return {
                success: true,
                user: this.currentUser
            };
        } catch (error) {
            console.error('[CouchDB] Erreur lors de la connexion:', error);

            let errorMessage = 'Erreur lors de la connexion';
            if (error.message.includes('unauthorized') || error.message.includes('incorrect')) {
                errorMessage = 'Email ou mot de passe incorrect';
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    // Déconnexion
    async signOutUser() {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            // Arrêter la synchronisation
            if (this.syncHandler) {
                this.syncHandler.cancel();
            }
            if (this.publicSyncHandler) {
                this.publicSyncHandler.cancel();
            }

            // Supprimer les données locales
            localStorage.removeItem('couchdb_user');
            localStorage.removeItem('couchdb_user_password');

            this.currentUser = null;
            this.localDB = null;
            this.remoteDB = null;
            this.publicDB = null;
            this.remotePublicDB = null;

            return { success: true };
        } catch (error) {
            console.error('[CouchDB] Erreur lors de la déconnexion:', error);
            return {
                success: false,
                error: 'Erreur lors de la déconnexion'
            };
        }
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

    // Restaurer la session depuis localStorage
    async restoreSession() {
        try {
            const savedUser = localStorage.getItem('couchdb_user');
            const savedPassword = localStorage.getItem('couchdb_user_password');

            if (savedUser && savedPassword) {
                this.currentUser = JSON.parse(savedUser);

                // Reconfigurer les bases de données avec le password utilisateur
                await this.setupUserDatabases(this.currentUser.uid, savedPassword);

                console.log('[CouchDB] Session restored for:', this.currentUser.email);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[CouchDB] Error restoring session:', error);
            return false;
        }
    }

    // ========== MÉTHODES DE DONNÉES ==========

    // Sauvegarder toutes les données de l'utilisateur
    async saveUserData(data) {
        if (!this.initialized || !this.currentUser || !this.localDB) {
            const errorMsg = `Service non initialisé (initialized: ${this.initialized}, currentUser: ${!!this.currentUser}, localDB: ${!!this.localDB})`;
            console.error('[CouchDB]', errorMsg);
            throw new Error(errorMsg);
        }

        try {
            console.log('[CouchDB] Saving user data...');
            const docId = 'user_data';

            // Essayer de récupérer le document existant pour obtenir le _rev
            let existingDoc = null;
            try {
                existingDoc = await this.localDB.get(docId);
                console.log('[CouchDB] Existing document found, will update');
            } catch (err) {
                console.log('[CouchDB] No existing document, will create new');
            }

            const doc = {
                _id: docId,
                ...data,
                lastUpdated: new Date().toISOString()
            };

            // Si le document existe, ajouter le _rev
            if (existingDoc) {
                doc._rev = existingDoc._rev;
            }

            const result = await this.localDB.put(doc);
            console.log('[CouchDB] ✅ User data saved to local DB:', result);

            // Mettre à jour le profil public (sans les notes privées)
            if (data.ianProfile) {
                await this.updatePublicProfile(data.ianProfile);
            } else {
                console.warn('[CouchDB] No ianProfile in data, skipping public profile update');
            }

            console.log('[CouchDB] ✅ Data saved successfully');
            return true;
        } catch (error) {
            console.error('[CouchDB] ❌ Erreur lors de la sauvegarde des données:', error);
            throw error;
        }
    }

    // Récupérer les données de l'utilisateur
    async getUserData() {
        if (!this.initialized || !this.currentUser || !this.localDB) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        try {
            const docId = 'user_data';
            const doc = await this.localDB.get(docId);

            // Supprimer les métadonnées PouchDB
            const { _id, _rev, ...userData } = doc;
            return userData;
        } catch (error) {
            if (error.status === 404) {
                // Document n'existe pas encore
                return null;
            }
            console.error('[CouchDB] Erreur lors de la récupération des données:', error);
            throw error;
        }
    }

    // Mettre à jour le profil public (sans notes privées)
    async updatePublicProfile(profile) {
        if (!this.initialized || !this.currentUser || !this.publicDB) {
            console.warn('[CouchDB] Cannot update public profile: service not ready');
            return false;
        }

        try {
            console.log('[CouchDB] Updating public profile...');

            // Créer une copie du profil sans les notes privées
            const { notes, ...publicProfile } = profile;

            const userId = this.currentUser.uid;
            const displayName = this.getDisplayName();

            const publicData = {
                _id: `profile_${userId}`,
                userId: userId,
                displayName: displayName,
                email: this.currentUser.email,
                ...publicProfile,
                lastUpdated: new Date().toISOString()
            };

            console.log('[CouchDB] Public profile data:', publicData);

            // Essayer de récupérer le document existant
            let existingDoc = null;
            try {
                existingDoc = await this.publicDB.get(publicData._id);
                console.log('[CouchDB] Existing public profile found, will update');
            } catch (err) {
                console.log('[CouchDB] No existing public profile, will create new');
            }

            // Si le document existe, ajouter le _rev
            if (existingDoc) {
                publicData._rev = existingDoc._rev;
            }

            const result = await this.publicDB.put(publicData);
            console.log('[CouchDB] ✅ Public profile saved:', result);

            return true;
        } catch (error) {
            console.error('[CouchDB] ❌ Erreur lors de la mise à jour du profil public:', error);
            return false;
        }
    }

    // Récupérer tous les profils publics pour l'annuaire
    async getSharedProfiles() {
        if (!this.initialized || !this.publicDB) {
            console.error('[CouchDB] Service non initialisé');
            return [];
        }

        try {
            const result = await this.publicDB.allDocs({
                include_docs: true,
                startkey: 'profile_',
                endkey: 'profile_\ufff0'
            });

            const profiles = result.rows.map(row => {
                const { _id, _rev, ...profileData } = row.doc;
                return profileData;
            });

            return profiles;
        } catch (error) {
            console.error('[CouchDB] Erreur lors de la récupération des profils partagés:', error);
            return [];
        }
    }

    // Mettre à jour un champ spécifique du profil
    async updateProfileField(field, value) {
        if (!this.initialized || !this.currentUser || !this.localDB) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        try {
            const docId = 'user_data';
            const doc = await this.localDB.get(docId);

            // Mettre à jour le champ dans ianProfile
            if (!doc.ianProfile) {
                doc.ianProfile = {};
            }
            doc.ianProfile[field] = value;
            doc.lastUpdated = new Date().toISOString();

            await this.localDB.put(doc);

            // Si ce n'est pas le champ "notes", mettre à jour le profil public
            if (field !== 'notes') {
                await this.updatePublicProfile(doc.ianProfile);
            }

            return true;
        } catch (error) {
            console.error('[CouchDB] Erreur lors de la mise à jour du champ:', error);
            throw error;
        }
    }
}

// Instance globale
const couchDBService = new CouchDBService();
