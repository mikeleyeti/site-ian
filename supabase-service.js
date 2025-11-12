// Supabase Authentication & Database Service
// Gère l'authentification Supabase et le stockage des données dans PostgreSQL

class SupabaseService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.initialized = false;
        this.authListener = null;
    }

    // Initialisation du service avec Supabase
    async initialize() {
        return new Promise((resolve) => {
            if (window.supabaseReady && window.supabaseClient) {
                this.supabase = window.supabaseClient;
                this.initialized = true;

                // Écouter les changements d'état d'authentification
                this.setupAuthListener();

                // Récupérer l'utilisateur actuel s'il existe
                this.getCurrentSession().then(() => {
                    resolve(true);
                });
            } else {
                // Attendre que Supabase soit initialisé
                window.addEventListener('supabaseInitialized', async () => {
                    this.supabase = window.supabaseClient;
                    this.initialized = true;

                    // Écouter les changements d'état d'authentification
                    this.setupAuthListener();

                    // Récupérer l'utilisateur actuel s'il existe
                    await this.getCurrentSession();
                    resolve(true);
                });
            }
        });
    }

    // Récupérer la session actuelle
    async getCurrentSession() {
        if (!this.supabase) return;

        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            console.log('[Supabase Auth] Utilisateur connecté:', this.currentUser.email);
        }
    }

    // Écouter les changements d'authentification
    setupAuthListener() {
        if (!this.supabase) return;

        // Supprimer l'ancien listener s'il existe
        if (this.authListener) {
            this.authListener.subscription.unsubscribe();
        }

        // Créer un nouveau listener
        this.authListener = this.supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.currentUser = session.user;
                console.log('[Supabase Auth] État:', event, '- Utilisateur:', this.currentUser.email);
            } else {
                this.currentUser = null;
                console.log('[Supabase Auth] Utilisateur déconnecté');
            }
        });
    }

    // ========== MÉTHODES D'AUTHENTIFICATION ==========

    // Inscription d'un nouvel utilisateur
    async signUp(email, password, displayName) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            // Créer le compte avec métadonnées
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName || email.split('@')[0]
                    }
                }
            });

            if (error) throw error;

            this.currentUser = data.user;

            return {
                success: true,
                user: {
                    uid: data.user.id,
                    email: data.user.email,
                    displayName: displayName || email.split('@')[0]
                }
            };
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);

            // Messages d'erreur en français
            let errorMessage = 'Erreur lors de l\'inscription';

            if (error.message.includes('already registered')) {
                errorMessage = 'Cette adresse email est déjà utilisée';
            } else if (error.message.includes('invalid email')) {
                errorMessage = 'Adresse email invalide';
            } else if (error.message.includes('password')) {
                errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
            } else {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    // Connexion d'un utilisateur
    async signIn(email, password) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.currentUser = data.user;

            return {
                success: true,
                user: {
                    uid: data.user.id,
                    email: data.user.email,
                    displayName: data.user.user_metadata?.display_name || email.split('@')[0]
                }
            };
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);

            // Messages d'erreur en français
            let errorMessage = 'Erreur lors de la connexion';

            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou mot de passe incorrect';
            } else if (error.message.includes('invalid email')) {
                errorMessage = 'Adresse email invalide';
            } else if (error.message.includes('too many requests')) {
                errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
            } else {
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
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
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
        return this.currentUser !== null;
    }

    // Obtenir l'UID de l'utilisateur actuel
    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    // Obtenir le nom d'affichage de l'utilisateur
    getDisplayName() {
        if (!this.currentUser) return null;
        return this.currentUser.user_metadata?.display_name || this.currentUser.email.split('@')[0];
    }

    // ========== MÉTHODES BASE DE DONNÉES ==========

    // Sauvegarder toutes les données de l'utilisateur
    async saveUserData(data) {
        if (!this.initialized || !this.currentUser) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        try {
            const userId = this.currentUser.id;

            // Préparer les données pour la table users
            const userData = {
                id: userId,
                ian_profile: data.ianProfile || {},
                directory_profiles: data.directoryProfiles || [],
                newsletters: data.newsletters || [],
                actualites: data.actualites || [],
                usages: data.usages || [],
                contacts: data.contacts || [],
                last_updated: new Date().toISOString()
            };

            // Upsert dans la table users (insert ou update)
            const { error: userError } = await this.supabase
                .from('users')
                .upsert(userData, { onConflict: 'id' });

            if (userError) throw userError;

            // Mettre à jour le profil public (sans les notes privées)
            await this.updatePublicProfile(data.ianProfile);

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
            const userId = this.currentUser.id;

            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Si l'utilisateur n'existe pas encore (404), retourner null
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            // Transformer les données PostgreSQL en format application
            return {
                ianProfile: data.ian_profile || {},
                directoryProfiles: data.directory_profiles || [],
                newsletters: data.newsletters || [],
                actualites: data.actualites || [],
                usages: data.usages || [],
                contacts: data.contacts || [],
                lastUpdated: data.last_updated
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            throw error;
        }
    }

    // Mettre à jour le profil public (sans notes privées)
    async updatePublicProfile(profile) {
        if (!this.initialized || !this.currentUser) {
            return false;
        }

        try {
            // Créer une copie du profil sans les notes privées
            const { notes, ...publicProfile } = profile || {};

            const userId = this.currentUser.id;
            const displayName = this.getDisplayName();

            const publicData = {
                id: userId,
                user_id: userId,
                display_name: displayName,
                email: this.currentUser.email,
                first_name: publicProfile.firstName || null,
                last_name: publicProfile.lastName || null,
                discipline: publicProfile.discipline || null,
                department: publicProfile.department || null,
                academic_email: publicProfile.academicEmail || null,
                objectives: publicProfile.objectives || null,
                avatar: publicProfile.avatar || null,
                last_updated: new Date().toISOString()
            };

            // Upsert dans la table public_directory
            const { error } = await this.supabase
                .from('public_directory')
                .upsert(publicData, { onConflict: 'id' });

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil public:', error);
            return false;
        }
    }

    // Récupérer tous les profils publics pour l'annuaire
    async getSharedProfiles() {
        if (!this.initialized) {
            console.error('Service non initialisé');
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('public_directory')
                .select('*');

            if (error) throw error;

            // Transformer les données PostgreSQL en format Firebase
            return data.map(profile => ({
                userId: profile.user_id,
                displayName: profile.display_name,
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                discipline: profile.discipline,
                department: profile.department,
                academicEmail: profile.academic_email,
                objectives: profile.objectives,
                avatar: profile.avatar,
                lastUpdated: profile.last_updated
            }));
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
            const userId = this.currentUser.id;

            // Récupérer les données actuelles
            const { data: currentData, error: fetchError } = await this.supabase
                .from('users')
                .select('ian_profile')
                .eq('id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            // Mettre à jour le champ dans ian_profile
            const updatedProfile = {
                ...(currentData?.ian_profile || {}),
                [field]: value
            };

            // Mettre à jour dans la table users
            const { error: updateError } = await this.supabase
                .from('users')
                .update({
                    ian_profile: updatedProfile,
                    last_updated: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Si ce n'est pas le champ "notes", mettre à jour le profil public
            if (field !== 'notes') {
                // Mapper les noms de champs (camelCase -> snake_case)
                const fieldMap = {
                    'firstName': 'first_name',
                    'lastName': 'last_name',
                    'discipline': 'discipline',
                    'department': 'department',
                    'academicEmail': 'academic_email',
                    'objectives': 'objectives',
                    'avatar': 'avatar'
                };

                const publicField = fieldMap[field];
                if (publicField) {
                    const { error: publicError } = await this.supabase
                        .from('public_directory')
                        .update({
                            [publicField]: value,
                            last_updated: new Date().toISOString()
                        })
                        .eq('id', userId);

                    // Si le profil public n'existe pas encore, le créer
                    if (publicError && publicError.code === 'PGRST116') {
                        const userData = await this.getUserData();
                        if (userData && userData.ianProfile) {
                            await this.updatePublicProfile(userData.ianProfile);
                        }
                    } else if (publicError) {
                        throw publicError;
                    }
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
const supabaseService = new SupabaseService();
