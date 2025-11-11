// API Service - Remplace Firebase Service
// Gère l'authentification et le stockage des données via l'API MongoDB

class ApiService {
    constructor() {
        // URL de l'API backend
        this.apiUrl = 'http://localhost:3000/api';
        this.token = null;
        this.currentUser = null;
        this.initialized = false;
    }

    // Initialisation du service
    async initialize() {
        return new Promise((resolve) => {
            console.log('[API Service] Initializing...');

            // Charger le token depuis le localStorage
            this.token = localStorage.getItem('auth_token');

            if (this.token) {
                // Décoder le token JWT pour récupérer les infos utilisateur
                try {
                    const payload = this.decodeJWT(this.token);
                    this.currentUser = {
                        uid: payload.userId,
                        email: payload.email,
                        displayName: payload.displayName
                    };
                    console.log('[API Service] User restored from token:', this.currentUser.email);
                } catch (error) {
                    console.error('[API Service] Invalid token, clearing:', error);
                    this.token = null;
                    localStorage.removeItem('auth_token');
                }
            }

            this.initialized = true;
            resolve(true);
        });
    }

    // Décoder un token JWT (simple, sans validation de signature)
    decodeJWT(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT');
        }

        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    }

    // Helper pour faire des requêtes HTTP
    async request(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Ajouter le token d'authentification si disponible
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur de requête');
            }

            return data;
        } catch (error) {
            console.error(`[API Service] Request failed for ${endpoint}:`, error);
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
            const response = await this.request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ email, password, displayName })
            });

            if (response.success) {
                // Stocker le token
                this.token = response.token;
                localStorage.setItem('auth_token', this.token);

                // Mettre à jour l'utilisateur actuel
                this.currentUser = {
                    uid: response.user.userId,
                    email: response.user.email,
                    displayName: response.user.displayName
                };

                return {
                    success: true,
                    user: this.currentUser
                };
            }

            return response;
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
            const response = await this.request('/auth/signin', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response.success) {
                // Stocker le token
                this.token = response.token;
                localStorage.setItem('auth_token', this.token);

                // Mettre à jour l'utilisateur actuel
                this.currentUser = {
                    uid: response.user.userId,
                    email: response.user.email,
                    displayName: response.user.displayName
                };

                return {
                    success: true,
                    user: this.currentUser
                };
            }

            return response;
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
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            // Supprimer le token
            this.token = null;
            this.currentUser = null;
            localStorage.removeItem('auth_token');

            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
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
        return this.currentUser !== null && this.token !== null;
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
            await this.request('/user/data', {
                method: 'PUT',
                body: JSON.stringify(data)
            });

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
            const response = await this.request('/user/data', {
                method: 'GET'
            });

            if (response.success) {
                return response.data;
            }

            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            throw error;
        }
    }

    // Mettre à jour le profil public (non utilisé directement, géré par saveUserData)
    async updatePublicProfile(profile) {
        // Cette méthode est automatiquement gérée par le backend lors de saveUserData
        return true;
    }

    // Récupérer tous les profils publics pour l'annuaire
    async getSharedProfiles() {
        if (!this.initialized) {
            console.error('Service non initialisé');
            return [];
        }

        try {
            const response = await this.request('/directory/profiles', {
                method: 'GET'
            });

            if (response.success) {
                return response.profiles;
            }

            return [];
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
            await this.request(`/user/profile/${field}`, {
                method: 'PATCH',
                body: JSON.stringify({ value })
            });

            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du champ:', error);
            throw error;
        }
    }
}

// Instance globale
const apiService = new ApiService();

// Pour la compatibilité avec le code existant
const firestoreService = apiService;
