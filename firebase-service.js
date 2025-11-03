// Firebase Firestore Service
// Remplace GitHubService pour le stockage des données dans Firestore

class FirestoreService {
    constructor() {
        this.db = null;
        this.username = null;
        this.initialized = false;
    }

    // Initialisation du service avec Firestore
    async initialize() {
        return new Promise((resolve) => {
            if (window.firebaseReady && window.firestoreDb) {
                this.db = window.firestoreDb;
                this.initialized = true;
                resolve(true);
            } else {
                // Attendre que Firebase soit initialisé
                window.addEventListener('firebaseInitialized', () => {
                    this.db = window.firestoreDb;
                    this.initialized = true;
                    resolve(true);
                });
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

    setCredentials(token, username) {
        this.username = username;
        localStorage.setItem('github_token', token);
        localStorage.setItem('github_username', username);
    }

    getStoredCredentials() {
        return {
            token: localStorage.getItem('github_token'),
            username: localStorage.getItem('github_username')
        };
    }

    clearCredentials() {
        this.username = null;
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_username');
    }

    // Vérification du token GitHub (conservée pour l'authentification)
    async verifyToken(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const user = await response.json();
                return { valid: true, username: user.login, user };
            }

            const errorText = await response.text();
            console.error('GitHub API error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });

            return {
                valid: false,
                error: `Erreur ${response.status}: ${response.statusText}`,
                details: errorText
            };
        } catch (error) {
            console.error('Token verification error:', error);
            return {
                valid: false,
                error: 'Erreur de connexion: ' + error.message
            };
        }
    }

    // Sauvegarder toutes les données de l'utilisateur
    async saveUserData(data) {
        if (!this.initialized || !this.username) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        const { doc, setDoc } = await this.getFirestoreFunctions();

        try {
            const userDocRef = doc(this.db, 'users', this.username);
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
        if (!this.initialized || !this.username) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        const { doc, getDoc } = await this.getFirestoreFunctions();

        try {
            const userDocRef = doc(this.db, 'users', this.username);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                // Retourner une structure vide si l'utilisateur n'existe pas encore
                return null;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            throw error;
        }
    }

    // Mettre à jour le profil public (sans notes privées)
    async updatePublicProfile(profile) {
        if (!this.initialized || !this.username) {
            return false;
        }

        const { doc, setDoc } = await this.getFirestoreFunctions();

        try {
            // Créer une copie du profil sans les notes privées
            const { notes, ...publicProfile } = profile;

            const publicData = {
                username: this.username,
                ...publicProfile,
                lastUpdated: new Date().toISOString()
            };

            const publicDocRef = doc(this.db, 'public_directory', this.username);
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
        if (!this.initialized || !this.username) {
            throw new Error('Service non initialisé ou utilisateur non connecté');
        }

        const { doc, updateDoc, getDoc } = await this.getFirestoreFunctions();

        try {
            // Mettre à jour dans les données utilisateur
            const userDocRef = doc(this.db, 'users', this.username);
            await updateDoc(userDocRef, {
                [`ianProfile.${field}`]: value,
                lastUpdated: new Date().toISOString()
            });

            // Si ce n'est pas le champ "notes", mettre à jour le profil public
            if (field !== 'notes') {
                const publicDocRef = doc(this.db, 'public_directory', this.username);

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
