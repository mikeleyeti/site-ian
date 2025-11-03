// Firebase Firestore & Authentication Service
// Gère l'authentification Firebase et le stockage des données dans Firestore

class FirestoreService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.initialized = false;
    }

    // Initialisation du service avec Firestore et Auth
    async initialize() {
        return new Promise((resolve) => {
            if (window.firebaseReady && window.firestoreDb && window.firebaseAuth) {
                this.db = window.firestoreDb;
                this.auth = window.firebaseAuth;
                this.initialized = true;

                // Écouter les changements d'état d'authentification
                this.setupAuthListener();

                resolve(true);
            } else {
                // Attendre que Firebase soit initialisé
                window.addEventListener('firebaseInitialized', () => {
                    this.db = window.firestoreDb;
                    this.auth = window.firebaseAuth;
                    this.initialized = true;

                    // Écouter les changements d'état d'authentification
                    this.setupAuthListener();

                    resolve(true);
                });
            }
        });
    }

    // Écouter les changements d'authentification
    async setupAuthListener() {
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            if (user) {
                console.log('[Firebase Auth] Utilisateur connecté:', user.email);
            } else {
                console.log('[Firebase Auth] Utilisateur déconnecté');
            }
        });
    }

    // Import dynamique des fonctions Firestore
    async getFirestoreFunctions() {
        const {
            doc,
            getDoc,
            setDoc,
            updateDoc,
            collection,
            query,
            getDocs,
            deleteDoc
        } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        return { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, deleteDoc };
    }

    // Import dynamique des fonctions Firebase Auth
    async getAuthFunctions() {
        const {
            createUserWithEmailAndPassword,
            signInWithEmailAndPassword,
            signOut,
            updateProfile
        } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

        return { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile };
    }

    // ========== MÉTHODES D'AUTHENTIFICATION ==========

    // Inscription d'un nouvel utilisateur
    async signUp(email, password, displayName) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }

        try {
            const { createUserWithEmailAndPassword, updateProfile } = await this.getAuthFunctions();

            // Créer le compte
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Mettre à jour le profil avec le nom d'affichage
            if (displayName) {
                await updateProfile(user, { displayName });
            }

            this.currentUser = user;

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || email.split('@')[0]
                }
            };
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);

            // Messages d'erreur en français
            let errorMessage = 'Erreur lors de l\'inscription';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Cette adresse email est déjà utilisée';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Adresse email invalide';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
                    break;
                default:
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
            const { signInWithEmailAndPassword } = await this.getAuthFunctions();

            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            this.currentUser = user;

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || email.split('@')[0]
                }
            };
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);

            // Messages d'erreur en français
            let errorMessage = 'Erreur lors de la connexion';
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Email ou mot de passe incorrect';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Adresse email invalide';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
                    break;
                default:
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
            const { signOut } = await this.getAuthFunctions();
            await signOut(this.auth);
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
        return this.currentUser ? this.currentUser.uid : null;
    }

    // Obtenir le nom d'affichage de l'utilisateur
    getDisplayName() {
        if (!this.currentUser) return null;
        return this.currentUser.displayName || this.currentUser.email.split('@')[0];
    }

    // ========== MÉTHODES FIRESTORE ==========

    // Sauvegarder toutes les données de l'utilisateur
    async saveUserData(data) {
        if (!this.initialized || !this.currentUser) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        const { doc, setDoc } = await this.getFirestoreFunctions();

        try {
            const userId = this.currentUser.uid;
            const userDocRef = doc(this.db, 'users', userId);

            await setDoc(userDocRef, {
                ...data,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

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

        const { doc, getDoc } = await this.getFirestoreFunctions();

        try {
            const userId = this.currentUser.uid;
            const userDocRef = doc(this.db, 'users', userId);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                // Retourner null si l'utilisateur n'existe pas encore
                return null;
            }
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

        const { doc, setDoc } = await this.getFirestoreFunctions();

        try {
            // Créer une copie du profil sans les notes privées
            const { notes, ...publicProfile } = profile;

            const userId = this.currentUser.uid;
            const displayName = this.getDisplayName();

            const publicData = {
                userId: userId,
                displayName: displayName,
                email: this.currentUser.email,
                ...publicProfile,
                lastUpdated: new Date().toISOString()
            };

            const publicDocRef = doc(this.db, 'public_directory', userId);
            await setDoc(publicDocRef, publicData);

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

        const { collection, getDocs } = await this.getFirestoreFunctions();

        try {
            const publicDirRef = collection(this.db, 'public_directory');
            const querySnapshot = await getDocs(publicDirRef);

            const profiles = [];
            querySnapshot.forEach((doc) => {
                profiles.push(doc.data());
            });

            return profiles;
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

        const { doc, updateDoc, getDoc } = await this.getFirestoreFunctions();

        try {
            const userId = this.currentUser.uid;

            // Mettre à jour dans les données utilisateur
            const userDocRef = doc(this.db, 'users', userId);
            await updateDoc(userDocRef, {
                [`ianProfile.${field}`]: value,
                lastUpdated: new Date().toISOString()
            });

            // Si ce n'est pas le champ "notes", mettre à jour le profil public
            if (field !== 'notes') {
                const publicDocRef = doc(this.db, 'public_directory', userId);

                // Vérifier si le document existe
                const publicDoc = await getDoc(publicDocRef);
                if (publicDoc.exists()) {
                    await updateDoc(publicDocRef, {
                        [field]: value,
                        lastUpdated: new Date().toISOString()
                    });
                } else {
                    // Si le document n'existe pas, récupérer tout le profil et le créer
                    const userData = await this.getUserData();
                    if (userData && userData.ianProfile) {
                        await this.updatePublicProfile(userData.ianProfile);
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
const firestoreService = new FirestoreService();
