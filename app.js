// IAN - Écosystème Interactif - Application JavaScript
// Utilise FirestoreService (défini dans firebase-service.js) pour le stockage des données

// Structure de données globale
let appData = {
    ianProfile: {
        avatar: '👤',
        firstName: '',
        lastName: '',
        discipline: '',
        department: '',
        academicEmail: '',
        objectives: '',
        notes: '' // Notes privées, non partagées dans l'annuaire
    },
    directoryProfiles: [],
    newsletters: [],
    actualites: [],
    usages: [],
    lastUpdated: null
};

// Gestion de l'authentification
function toggleTokenVisibility() {
    const input = document.getElementById('github-token');
    const icon = document.getElementById('toggle-icon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

function toggleInstructions() {
    const instructions = document.getElementById('instructions');
    instructions.classList.toggle('hidden');
}

// Initialisation du formulaire de connexion
function initLoginForm() {
    console.log('[IAN] Initializing login form...');
    const loginForm = document.getElementById('login-form');
    console.log('[IAN] Login form found:', !!loginForm);
    if (loginForm) {
        // Mark as initialized to prevent double initialization
        if (loginForm.hasAttribute('data-initialized')) {
            console.log('[IAN] Form already initialized, skipping');
            return;
        }
        loginForm.setAttribute('data-initialized', 'true');

        console.log('[IAN] Attaching submit event listener');
        loginForm.addEventListener('submit', async (e) => {
            console.log('[IAN] Form submitted');
            e.preventDefault();
            const token = document.getElementById('github-token').value;
            const submitButton = e.target.querySelector('button[type="submit"]');

            // Désactiver le bouton pendant la vérification
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="flex items-center justify-center space-x-2"><span>Vérification...</span></span>';

            // Initialiser Firebase si ce n'est pas déjà fait
            await firestoreService.initialize();

            // Vérifier le token
            const result = await firestoreService.verifyToken(token);

            if (result.valid) {
                firestoreService.setCredentials(token, result.username);

                // Mettre à jour l'interface utilisateur
                document.getElementById('user-name').textContent = result.username;
                if (result.user.avatar_url) {
                    const avatar = document.getElementById('user-avatar');
                    avatar.src = result.user.avatar_url;
                    avatar.style.display = 'block';
                }

                // Charger les données depuis Firestore
                await loadDataFromFirestore();

                // Afficher l'application principale
                document.getElementById('login-screen').classList.remove('active');
                document.getElementById('main-app').style.display = 'block';
            } else {
                // Afficher un message d'erreur détaillé
                let errorMessage = 'Token GitHub invalide. Veuillez vérifier et réessayer.';
                if (result.error) {
                    errorMessage = result.error;
                }

                // Vérifier les erreurs courantes
                if (result.details) {
                    try {
                        const errorData = JSON.parse(result.details);
                        if (errorData.message) {
                            errorMessage += '\n\nDétails: ' + errorData.message;
                        }
                    } catch (e) {
                        // Ignorer si ce n'est pas du JSON
                    }
                }

                alert(errorMessage + '\n\nAssurez-vous que:\n- Le token est valide\n- Le token a le scope "gist"\n- Vous avez copié le token complet');

                // Réactiver le bouton
                submitButton.disabled = false;
                submitButton.innerHTML = '<span class="flex items-center justify-center space-x-2"><span>Se connecter avec GitHub</span><span>→</span></span>';
            }
        });
    }
}

// Listen for login component loaded event
window.addEventListener('loginComponentLoaded', () => {
    console.log('[IAN] Login component loaded event received');
    initLoginForm();
});

// Fallback: check periodically if login form exists and needs initialization
let loginFormInitialized = false;
const checkLoginForm = () => {
    if (loginFormInitialized) return;

    const loginForm = document.getElementById('login-form');
    if (loginForm && !loginForm.hasAttribute('data-initialized')) {
        console.log('[IAN] Login form found via fallback check, initializing...');
        loginForm.setAttribute('data-initialized', 'true');
        loginFormInitialized = true;
        initLoginForm();
        if (checkInterval) {
            clearInterval(checkInterval);
        }
    }
};

// Check immediately and periodically
const checkInterval = setInterval(checkLoginForm, 100);
setTimeout(() => {
    // Stop checking after 5 seconds
    if (checkInterval) {
        clearInterval(checkInterval);
    }
}, 5000);

// Debug: log when this script loads
console.log('[IAN] app.js loaded and ready');

// Chargement des données depuis Firestore
async function loadDataFromFirestore() {
    updateSyncStatus('Chargement...');

    try {
        // Récupérer les données de l'utilisateur depuis Firestore
        const data = await firestoreService.getUserData();

        if (data) {
            // Fusionner avec les données par défaut
            appData = { ...appData, ...data };
        } else {
            // Première connexion : créer les données initiales
            await firestoreService.saveUserData(appData);
        }

        updateSyncStatus('Synchronisé');
    } catch (error) {
        console.error('Error loading data:', error);
        updateSyncStatus('Erreur de synchronisation');
    }
}

// Sauvegarde des données vers Firestore
async function saveDataToFirestore() {
    if (!firestoreService.initialized || !firestoreService.username) return;

    updateSyncStatus('Synchronisation...');

    try {
        appData.lastUpdated = new Date().toISOString();
        await firestoreService.saveUserData(appData);
        updateSyncStatus('Synchronisé');
    } catch (error) {
        console.error('Error saving data:', error);
        updateSyncStatus('Erreur de synchronisation');
    }
}

// Synchronisation manuelle
async function manualSync() {
    await saveDataToFirestore();
}

// Mise à jour du statut de synchronisation
function updateSyncStatus(status) {
    const statusElement = document.getElementById('sync-status');
    statusElement.innerHTML = `<span class="sync-indicator">●</span><span class="ml-1">${status}</span>`;
}

// Déconnexion
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        firestoreService.clearCredentials();
        location.reload();
    }
}

// Navigation entre les pages
function navigateTo(page) {
    // Masquer toutes les pages
    document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));

    // Afficher la page demandée
    document.getElementById(`${page}-page`).classList.add('active');

    // Charger le contenu spécifique à la page
    loadPageContent(page);
}

// Chargement du contenu des pages
function loadPageContent(page) {
    switch (page) {
        case 'ecosystem':
            loadEcosystemContent();
            break;
        case 'directory':
            loadDirectoryContent();
            break;
        case 'newsletter':
            loadNewsletterContent();
            break;
        case 'usages':
            loadUsagesContent();
            break;
    }
}

function loadEcosystemContent() {
    const content = document.getElementById('ecosystem-content');
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Message d'information -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-blue-700">
                            <strong>Votre profil est public :</strong> Les informations personnelles (sauf "Notes et réflexions") seront visibles par tous les IAN dans l'annuaire.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Formulaire de profil avec expander -->
            <div class="bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg overflow-hidden">
                <!-- En-tête cliquable pour expand/collapse -->
                <div class="flex justify-between items-center p-6 cursor-pointer hover:bg-teal-100 transition-colors"
                     onclick="toggleProfileExpander()">
                    <h2 class="text-2xl font-bold text-teal-800">Informations personnelles</h2>
                    <span id="expander-icon" class="text-2xl text-teal-700 transform transition-transform duration-300">▼</span>
                </div>

                <!-- Contenu expandable -->
                <div id="profile-form-content" class="px-6 pb-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                            <input type="text" id="profile-lastName" value="${appData.ianProfile.lastName || ''}"
                                onchange="updateProfile('lastName', this.value)"
                                placeholder="Ex: Dupont"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                            <input type="text" id="profile-firstName" value="${appData.ianProfile.firstName || ''}"
                                onchange="updateProfile('firstName', this.value)"
                                placeholder="Ex: Jean"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Discipline *</label>
                            <input type="text" id="profile-discipline" value="${appData.ianProfile.discipline || ''}"
                                onchange="updateProfile('discipline', this.value)"
                                placeholder="Ex: Mathématiques, Sciences, etc."
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                            <input type="text" id="profile-department" value="${appData.ianProfile.department || ''}"
                                onchange="updateProfile('department', this.value)"
                                placeholder="Ex: 45 (Loiret)"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mail académique</label>
                            <input type="email" id="profile-academicEmail" value="${appData.ianProfile.academicEmail || ''}"
                                onchange="updateProfile('academicEmail', this.value)"
                                placeholder="prenom.nom@ac-academie.fr"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        </div>
                    </div>
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mes objectifs</label>
                        <textarea id="profile-objectives"
                            onchange="updateProfile('objectives', this.value)"
                            placeholder="Décrivez vos objectifs, vos domaines d'expertise ou vos projets en cours..."
                            rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">${appData.ianProfile.objectives || ''}</textarea>
                    </div>
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Notes et réflexions
                            <span class="text-xs text-gray-500">(Privé - Non visible dans l'annuaire)</span>
                        </label>
                        <textarea id="profile-notes"
                            onchange="updateProfile('notes', this.value)"
                            placeholder="Vos notes personnelles, réflexions, idées... Ces informations restent privées."
                            rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-yellow-50">${appData.ianProfile.notes || ''}</textarea>
                    </div>
                    <div class="mt-4 text-sm text-gray-500">
                        * Champs recommandés pour une meilleure visibilité dans l'annuaire
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour expand/collapse le formulaire de profil
function toggleProfileExpander() {
    const content = document.getElementById('profile-form-content');
    const icon = document.getElementById('expander-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
        icon.textContent = '▶';
    }
}

async function loadDirectoryContent() {
    const content = document.getElementById('directory-content');
    content.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-800">Annuaire des IAN</h2>
                <p class="text-gray-600">Tous les profils des Interlocuteurs Académiques au Numérique</p>
            </div>
            <div id="profiles-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <p class="col-span-full text-center text-gray-500">Chargement des profils...</p>
            </div>
        </div>
    `;

    // Charger les profils depuis le Gist public partagé
    await loadAllProfiles();
}

async function loadAllProfiles() {
    const profilesList = document.getElementById('profiles-list');

    try {
        const profiles = await firestoreService.getSharedProfiles();

        if (profiles.length === 0) {
            profilesList.innerHTML = '<p class="col-span-full text-center text-gray-500">Aucun profil dans l\'annuaire. Soyez le premier à créer votre profil!</p>';
            return;
        }

        // Afficher tous les profils
        profilesList.innerHTML = profiles.map(profile => {
            const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Sans nom';
            return `
            <div class="bg-white rounded-lg shadow-lg p-6 border-2 border-teal-200 hover:border-teal-400 transition-all">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl">
                        ${profile.avatar || '👤'}
                    </div>
                    <div class="ml-3">
                        <h3 class="font-bold text-lg text-gray-800">${fullName}</h3>
                        <p class="text-sm text-gray-500">@${profile.username}</p>
                    </div>
                </div>
                <div class="space-y-2 text-sm">
                    <p class="text-gray-700"><strong>Discipline:</strong> ${profile.discipline || 'Non renseigné'}</p>
                    <p class="text-gray-700"><strong>Département:</strong> ${profile.department || 'Non renseigné'}</p>
                    ${profile.academicEmail ? `<p class="text-blue-600"><strong>Mail académique:</strong> ${profile.academicEmail}</p>` : ''}
                    ${profile.objectives ? `<p class="text-gray-600 mt-3 pt-3 border-t border-gray-200"><strong>Objectifs:</strong><br><em class="text-xs">${profile.objectives}</em></p>` : ''}
                </div>
                <div class="mt-4 text-xs text-gray-400">
                    Mis à jour: ${profile.lastUpdated ? new Date(profile.lastUpdated).toLocaleDateString('fr-FR') : 'N/A'}
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Erreur lors du chargement des profils:', error);
        profilesList.innerHTML = '<p class="col-span-full text-center text-red-500">Erreur lors du chargement des profils</p>';
    }
}

function renderContacts() {
    if (appData.directoryProfiles.length === 0) {
        return '<p class="col-span-full text-center text-gray-500">Aucun contact dans l\'annuaire</p>';
    }

    return appData.directoryProfiles.map((contact, index) => `
        <div class="contact-card bg-white rounded-lg shadow p-4 border-2">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-lg">${contact.name}</h3>
                <button onclick="deleteContact(${index})" class="text-red-500 hover:text-red-700">✕</button>
            </div>
            <p class="text-sm text-gray-600">${contact.discipline || 'Non renseigné'}</p>
            <p class="text-sm text-gray-600">${contact.etablissement || 'Non renseigné'}</p>
            <p class="text-sm text-blue-600">${contact.email || 'Non renseigné'}</p>
        </div>
    `).join('');
}

function loadNewsletterContent() {
    const content = document.getElementById('newsletter-content');
    content.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-800">Newsletters</h2>
            <p class="text-gray-600">Gérez vos newsletters trimestrielles ici.</p>
        </div>
    `;
}

function loadUsagesContent() {
    const content = document.getElementById('usages-content');
    content.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-800">Usages du numérique</h2>
            <p class="text-gray-600">Explorez les pratiques pédagogiques numériques.</p>
        </div>
    `;
}

// Fonctions de mise à jour
async function updateProfile(field, value) {
    appData.ianProfile[field] = value;

    // Sauvegarder dans Firestore (données privées + profil public)
    await firestoreService.updateProfileField(field, value);
}

function addContact() {
    const name = prompt('Nom du contact:');
    if (name) {
        const contact = {
            name,
            discipline: prompt('Discipline:') || '',
            etablissement: prompt('Établissement:') || '',
            email: prompt('Email:') || '',
            dateCreation: new Date().toISOString()
        };
        appData.directoryProfiles.push(contact);
        saveDataToFirestore();
        loadDirectoryContent();
    }
}

function deleteContact(index) {
    if (confirm('Supprimer ce contact ?')) {
        appData.directoryProfiles.splice(index, 1);
        saveDataToFirestore();
        loadDirectoryContent();
    }
}

// Vérification de l'authentification au chargement
window.addEventListener('DOMContentLoaded', async () => {
    // Initialiser Firebase
    await firestoreService.initialize();

    const { token, username } = firestoreService.getStoredCredentials();
    if (token && username) {
        const result = await firestoreService.verifyToken(token);
        if (result.valid) {
            firestoreService.setCredentials(token, username);

            // Mettre à jour l'interface utilisateur
            document.getElementById('user-name').textContent = username;
            if (result.user.avatar_url) {
                const avatar = document.getElementById('user-avatar');
                avatar.src = result.user.avatar_url;
                avatar.style.display = 'block';
            }

            // Charger les données depuis Firestore
            await loadDataFromFirestore();

            // Afficher l'application
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('main-app').style.display = 'block';
        } else {
            firestoreService.clearCredentials();
        }
    }
});
