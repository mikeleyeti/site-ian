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
    contacts: [], // Contacts de l'écosystème IAN
    lastUpdated: null
};

// Variables globales pour le filtrage des contacts
let currentUrgenceFilter = 'all';
let editingContact = null;

// Gestion de l'authentification

// Basculer entre les onglets Connexion / Inscription
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('tab-login');
    const signupTab = document.getElementById('tab-signup');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginTab.classList.add('active', 'text-teal-600', 'border-b-2', 'border-teal-600');
        loginTab.classList.remove('text-gray-500');
        signupTab.classList.remove('active', 'text-teal-600', 'border-b-2', 'border-teal-600');
        signupTab.classList.add('text-gray-500');
    } else {
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        signupTab.classList.add('active', 'text-teal-600', 'border-b-2', 'border-teal-600');
        signupTab.classList.remove('text-gray-500');
        loginTab.classList.remove('active', 'text-teal-600', 'border-b-2', 'border-teal-600');
        loginTab.classList.add('text-gray-500');
    }
}

// Afficher/Masquer le mot de passe
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

// Initialisation des formulaires d'authentification
function initLoginForm() {
    console.log('[IAN] Initializing authentication forms...');

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (!loginForm || !signupForm) {
        console.warn('[IAN] Forms not found');
        return;
    }

    // Marquer comme initialisé
    if (loginForm.hasAttribute('data-initialized')) {
        console.log('[IAN] Forms already initialized, skipping');
        return;
    }
    loginForm.setAttribute('data-initialized', 'true');

    // Gestionnaire du formulaire de connexion
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[IAN] Login form submitted');

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitButton = document.getElementById('login-submit-btn');
        const errorDiv = document.getElementById('login-error');

        // Masquer les erreurs précédentes
        errorDiv.classList.add('hidden');

        // Désactiver le bouton
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Connexion en cours...</span>';

        // Initialiser Firebase
        await firestoreService.initialize();

        // Connexion
        const result = await firestoreService.signIn(email, password);

        if (result.success) {
            console.log('[IAN] Login successful');

            // Mettre à jour l'interface
            document.getElementById('user-name').textContent = result.user.displayName;

            // Charger les données depuis Firestore
            await loadDataFromFirestore();

            // Afficher l'application principale
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('main-app').style.display = 'block';
        } else {
            // Afficher l'erreur
            errorDiv.textContent = result.error;
            errorDiv.classList.remove('hidden');

            // Réactiver le bouton
            submitButton.disabled = false;
            submitButton.innerHTML = '<span class="flex items-center justify-center space-x-2"><span>Se connecter</span><span>→</span></span>';
        }
    });

    // Gestionnaire du formulaire d'inscription
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[IAN] Signup form submitted');

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-password-confirm').value;
        const submitButton = document.getElementById('signup-submit-btn');
        const errorDiv = document.getElementById('signup-error');

        // Masquer les erreurs précédentes
        errorDiv.classList.add('hidden');

        // Vérifier que les mots de passe correspondent
        if (password !== passwordConfirm) {
            errorDiv.textContent = 'Les mots de passe ne correspondent pas';
            errorDiv.classList.remove('hidden');
            return;
        }

        // Désactiver le bouton
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Création du compte...</span>';

        // Initialiser Firebase
        await firestoreService.initialize();

        // Inscription
        const result = await firestoreService.signUp(email, password, name);

        if (result.success) {
            console.log('[IAN] Signup successful');

            // Mettre à jour l'interface
            document.getElementById('user-name').textContent = result.user.displayName;

            // Créer les données initiales
            await firestoreService.saveUserData(appData);

            // Afficher l'application principale
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('main-app').style.display = 'block';
        } else {
            // Afficher l'erreur
            errorDiv.textContent = result.error;
            errorDiv.classList.remove('hidden');

            // Réactiver le bouton
            submitButton.disabled = false;
            submitButton.innerHTML = '<span class="flex items-center justify-center space-x-2"><span>Créer un compte</span><span>→</span></span>';
        }
    });
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
async function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        await firestoreService.signOutUser();
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

    // Initialiser les contacts par défaut si vide
    if (!appData.contacts || appData.contacts.length === 0) {
        appData.contacts = [
            {
                id: 1,
                name: 'DNE',
                emoji: '🏛️',
                color: 'bg-teal-400',
                importance: 3,
                urgence: 'none',
                open: false,
                role: 'Direction du Numérique pour l\'Éducation - Pilotage national des projets numériques éducatifs',
                lienIAN: 'L\'IAN reçoit les directives nationales et remonte les besoins du terrain',
                coordonnees: 'dne@education.gouv.fr',
                notesPerso: '',
                niveau: 1
            },
            {
                id: 2,
                name: 'DRANE Orléans-Tours',
                emoji: '🌐',
                color: 'bg-sky-400',
                importance: 2,
                urgence: 'none',
                open: false,
                role: 'Délégué Régional Académique au Numérique pour l\'Éducation',
                lienIAN: 'L\'IAN travaille sous la coordination du DRANE',
                coordonnees: 'À compléter',
                notesPerso: '',
                niveau: 1
            },
            {
                id: 3,
                name: 'IAN académique',
                emoji: '🎓',
                color: 'bg-cyan-400',
                importance: 3,
                urgence: 'none',
                open: false,
                role: 'Interlocuteur Académique pour le Numérique',
                lienIAN: 'Collègue IAN, échange de pratiques',
                coordonnees: 'À compléter',
                notesPerso: '',
                niveau: 2
            }
        ];
    }

    content.innerHTML = `
        <style>
            .urgence-filter-btn {
                padding: 8px 16px;
                border-radius: 20px;
                border: 2px solid transparent;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            .urgence-filter-btn.compact {
                padding: 6px 8px;
                border-radius: 12px;
                font-size: 16px;
                min-width: 32px;
                height: 32px;
                justify-content: center;
            }
            .urgence-filter-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .urgence-filter-btn.active {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            .urgence-filter-btn.filter-all { background-color: #f8fafc; color: #475569; }
            .urgence-filter-btn.filter-all.active { background-color: #3b82f6; color: white; }
            .urgence-filter-btn.filter-high { background-color: #fee2e2; color: #dc2626; }
            .urgence-filter-btn.filter-high.active { background-color: #dc2626; color: white; }
            .urgence-filter-btn.filter-medium { background-color: #fed7aa; color: #ea580c; }
            .urgence-filter-btn.filter-medium.active { background-color: #ea580c; color: white; }
            .urgence-filter-btn.filter-low { background-color: #fef3c7; color: #d97706; }
            .urgence-filter-btn.filter-low.active { background-color: #d97706; color: white; }
            .urgence-filter-btn.filter-none { background-color: #f3f4f6; color: #6b7280; }
            .urgence-filter-btn.filter-none.active { background-color: #6b7280; color: white; }

            .contact-card {
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }
            .contact-card:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                border-color: #6b7280;
                z-index: 10;
            }

            .star-rating {
                display: inline-flex;
                gap: 2px;
            }
            .star {
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 18px;
                filter: grayscale(100%);
                transform: scale(1);
            }
            .star:hover {
                color: #fbbf24;
                filter: grayscale(0%);
                transform: scale(1.2);
            }
            .star.active {
                color: #f59e0b;
                filter: grayscale(0%);
                transform: scale(1.1);
            }
        </style>

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
                            <strong>Cartographie de vos contacts professionnels :</strong> Gérez vos contacts IAN et leur niveau d'urgence.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Filtres et recherche -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="space-y-6">
                    <div>
                        <label for="contact-search" class="block text-sm font-medium text-gray-700 mb-2">
                            🔍 Rechercher un contact
                        </label>
                        <input
                            type="text"
                            id="contact-search"
                            placeholder="Nom, rôle, notes..."
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            oninput="filterContacts()"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            🎯 Filtrer par urgence
                        </label>
                        <div class="flex flex-wrap gap-3">
                            <button
                                class="urgence-filter-btn filter-all active"
                                onclick="setUrgenceFilter('all')"
                                data-filter="all"
                            >
                                <span>📋</span>
                                <span>Toutes</span>
                            </button>
                            <button
                                class="urgence-filter-btn filter-high"
                                onclick="setUrgenceFilter('high')"
                                data-filter="high"
                            >
                                <span>🔴</span>
                                <span>Très urgent</span>
                            </button>
                            <button
                                class="urgence-filter-btn filter-medium"
                                onclick="setUrgenceFilter('medium')"
                                data-filter="medium"
                            >
                                <span>🟠</span>
                                <span>Moyennement urgent</span>
                            </button>
                            <button
                                class="urgence-filter-btn filter-low"
                                onclick="setUrgenceFilter('low')"
                                data-filter="low"
                            >
                                <span>🟡</span>
                                <span>Peu urgent</span>
                            </button>
                            <button
                                class="urgence-filter-btn filter-none"
                                onclick="setUrgenceFilter('none')"
                                data-filter="none"
                            >
                                <span>⚪</span>
                                <span>Aucune action</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <button
                            onclick="addNewContact()"
                            class="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                        >
                            <span>➕</span>
                            <span>Ajouter un contact</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Liste des contacts -->
            <div id="contacts-container" class="space-y-8">
                <!-- Les contacts seront rendus ici -->
            </div>
        </div>
    `;

    // Rendre les contacts
    renderContacts();
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
            const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.displayName || 'Sans nom';
            return `
            <div class="bg-white rounded-lg shadow-lg p-6 border-2 border-teal-200 hover:border-teal-400 transition-all">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl">
                        ${profile.avatar || '👤'}
                    </div>
                    <div class="ml-3">
                        <h3 class="font-bold text-lg text-gray-800">${fullName}</h3>
                        <p class="text-sm text-gray-500">${profile.email || ''}</p>
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

// ==================== FONCTIONS DE GESTION DES CONTACTS ====================

// Filtrer les contacts par recherche et urgence
function filterContacts() {
    const searchInput = document.getElementById('contact-search');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase();

    const filteredContacts = appData.contacts.filter(contact => {
        const matchesSearch = !searchTerm ||
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.role.toLowerCase().includes(searchTerm) ||
            (contact.notesPerso && contact.notesPerso.toLowerCase().includes(searchTerm));

        const matchesUrgence = currentUrgenceFilter === 'all' || contact.urgence === currentUrgenceFilter;

        return matchesSearch && matchesUrgence;
    });

    renderFilteredContacts(filteredContacts);
}

// Définir le filtre d'urgence
function setUrgenceFilter(filter) {
    currentUrgenceFilter = filter;

    // Mettre à jour l'apparence des boutons
    document.querySelectorAll('.urgence-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

    // Filtrer les contacts
    filterContacts();
}

// Rendre les contacts filtrés
function renderFilteredContacts(filteredContacts) {
    const container = document.getElementById('contacts-container');
    if (!container) return;

    // Organiser les contacts par niveau
    const niveau1 = filteredContacts.filter(c => c.niveau === 1);
    const niveau2 = filteredContacts.filter(c => c.niveau === 2);
    const niveau3 = filteredContacts.filter(c => c.niveau === 3);

    let html = '';

    // Niveau 1 : Direction nationale/régionale
    if (niveau1.length > 0) {
        html += `
            <div class="col-span-full mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">🏛️ Niveau National / Régional</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${niveau1.map(contact => createContactCard(contact)).join('')}
                </div>
            </div>
        `;
    }

    // Niveau 2 : IAN
    if (niveau2.length > 0) {
        html += `
            <div class="col-span-full mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">🎓 Niveau IAN</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    ${niveau2.map(contact => createContactCard(contact)).join('')}
                </div>
            </div>
        `;
    }

    // Niveau 3 : Terrain
    if (niveau3.length > 0) {
        html += `
            <div class="col-span-full mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">📚 Niveau Terrain</h3>
                <div class="grid grid-cols-1 gap-6 max-w-md mx-auto">
                    ${niveau3.map(contact => createContactCard(contact)).join('')}
                </div>
            </div>
        `;
    }

    if (html === '') {
        html = '<p class="text-center text-gray-500 py-8">Aucun contact trouvé avec ces critères</p>';
    }

    container.innerHTML = html;
}

// Créer une carte de contact
function createContactCard(contact) {
    const isEditing = editingContact === contact.id;

    return `
        <div class="contact-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div class="p-4">
                <!-- En-tête compact -->
                <div class="text-center mb-4">
                    <div class="w-16 h-16 ${contact.color} rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3">
                        ${contact.emoji}
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${contact.name}</h3>
                    <div class="flex items-center justify-center space-x-2 mb-3">
                        <div class="star-rating">
                            ${renderStars(contact.id, contact.importance)}
                        </div>
                    </div>
                    <span class="text-xs text-gray-500 block mb-3">${getImportanceLabel(contact.importance)}</span>
                </div>

                <!-- Boutons d'urgence compacts -->
                <div class="flex justify-center gap-1 mb-4">
                    <button
                        class="urgence-filter-btn compact filter-high ${contact.urgence === 'high' ? 'active' : ''}"
                        onclick="updateContactUrgence(${contact.id}, 'high')"
                        title="Très urgent"
                    >
                        🔴
                    </button>
                    <button
                        class="urgence-filter-btn compact filter-medium ${contact.urgence === 'medium' ? 'active' : ''}"
                        onclick="updateContactUrgence(${contact.id}, 'medium')"
                        title="Moyennement urgent"
                    >
                        🟠
                    </button>
                    <button
                        class="urgence-filter-btn compact filter-low ${contact.urgence === 'low' ? 'active' : ''}"
                        onclick="updateContactUrgence(${contact.id}, 'low')"
                        title="Peu urgent"
                    >
                        🟡
                    </button>
                    <button
                        class="urgence-filter-btn compact filter-none ${contact.urgence === 'none' ? 'active' : ''}"
                        onclick="updateContactUrgence(${contact.id}, 'none')"
                        title="Aucune action"
                    >
                        ⚪
                    </button>
                </div>

                <!-- Bouton d'expansion -->
                <div class="text-center">
                    <button
                        onclick="toggleContact(${contact.id})"
                        class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm flex items-center space-x-2 mx-auto"
                    >
                        <span>${contact.open ? 'Réduire' : 'Détails'}</span>
                        <span>${contact.open ? '▲' : '▼'}</span>
                    </button>
                </div>

                ${contact.open ? `
                    <div class="border-t pt-4 mt-4 space-y-4">
                        <!-- Rôle -->
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Rôle et responsabilités</label>
                            ${isEditing ? `
                                <textarea
                                    class="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    rows="2"
                                    onchange="updateContactField(${contact.id}, 'role', this.value)"
                                >${contact.role}</textarea>
                            ` : `
                                <p class="text-gray-600 bg-gray-50 p-2 rounded-md text-xs leading-relaxed">${contact.role}</p>
                            `}
                        </div>

                        <!-- Lien avec IAN -->
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Lien avec l'IAN</label>
                            ${isEditing ? `
                                <textarea
                                    class="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    rows="2"
                                    onchange="updateContactField(${contact.id}, 'lienIAN', this.value)"
                                >${contact.lienIAN}</textarea>
                            ` : `
                                <p class="text-gray-600 bg-blue-50 p-2 rounded-md text-xs leading-relaxed">${contact.lienIAN}</p>
                            `}
                        </div>

                        <!-- Coordonnées -->
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Coordonnées</label>
                            ${isEditing ? `
                                <input
                                    type="text"
                                    class="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    value="${contact.coordonnees}"
                                    onchange="updateContactField(${contact.id}, 'coordonnees', this.value)"
                                >
                            ` : `
                                <p class="text-gray-600 bg-gray-50 p-2 rounded-md font-mono text-xs break-all">${contact.coordonnees}</p>
                            `}
                        </div>

                        <!-- Plan de communication -->
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Plan de communication</label>
                            <textarea
                                class="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                rows="3"
                                placeholder="Définissez votre stratégie de communication..."
                                onchange="updateContactField(${contact.id}, 'notesPerso', this.value)"
                            >${contact.notesPerso}</textarea>
                        </div>

                        <!-- Boutons d'action -->
                        <div class="flex justify-between pt-3 border-t">
                            ${isEditing ? `
                                <button
                                    onclick="stopEditingContact()"
                                    class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
                                >
                                    <span>💾</span>
                                    <span>Sauvegarder</span>
                                </button>
                            ` : `
                                <button
                                    onclick="startEditingContact(${contact.id})"
                                    class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                                >
                                    <span>✏️</span>
                                    <span>Modifier</span>
                                </button>
                            `}
                            <button
                                onclick="deleteEcosystemContact(${contact.id})"
                                class="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2 text-sm"
                            >
                                <span>🗑️</span>
                                <span>Supprimer</span>
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Rendre les contacts (fonction principale)
function renderContacts() {
    renderFilteredContacts(appData.contacts || []);
}

// Rendre les étoiles d'importance
function renderStars(contactId, importance) {
    let starsHtml = '';
    for (let i = 1; i <= 3; i++) {
        const active = i <= importance ? 'active' : '';
        starsHtml += `<span class="star ${active}"
            onclick="updateContactImportance(${contactId}, ${i})"
        >⭐</span>`;
    }
    return starsHtml;
}

// Obtenir le label d'importance
function getImportanceLabel(stars) {
    switch(stars) {
        case 1: return 'Peu important';
        case 2: return 'Assez important';
        case 3: return 'Très important';
        default: return '';
    }
}

// Basculer l'expansion d'un contact
function toggleContact(id) {
    const contact = appData.contacts.find(c => c.id === id);
    if (contact) {
        contact.open = !contact.open;
        renderContacts();
    }
}

// Mettre à jour l'importance d'un contact
async function updateContactImportance(id, stars) {
    const contact = appData.contacts.find(c => c.id === id);
    if (contact) {
        contact.importance = stars;
        renderContacts();
        await saveDataToFirestore();
    }
}

// Mettre à jour l'urgence d'un contact
async function updateContactUrgence(id, urgence) {
    const contact = appData.contacts.find(c => c.id === id);
    if (contact) {
        contact.urgence = urgence;
        renderContacts();
        await saveDataToFirestore();
    }
}

// Mettre à jour un champ d'un contact
async function updateContactField(id, field, value) {
    const contact = appData.contacts.find(c => c.id === id);
    if (contact) {
        contact[field] = value;
        await saveDataToFirestore();
    }
}

// Commencer l'édition d'un contact
function startEditingContact(id) {
    editingContact = id;
    renderContacts();
}

// Arrêter l'édition d'un contact
async function stopEditingContact() {
    editingContact = null;
    await saveDataToFirestore();
    renderContacts();
}

// Ajouter un nouveau contact
function addNewContact() {
    const name = prompt('Nom du contact:');
    if (!name) return;

    const newContact = {
        id: Date.now(),
        name: name,
        emoji: '👤',
        color: 'bg-gray-400',
        importance: 1,
        urgence: 'none',
        open: true,
        role: 'À définir',
        lienIAN: 'À définir',
        coordonnees: 'À compléter',
        notesPerso: '',
        niveau: 2 // Par défaut niveau IAN
    };

    appData.contacts.push(newContact);
    saveDataToFirestore();
    renderContacts();
}

// Supprimer un contact de l'écosystème
async function deleteEcosystemContact(id) {
    if (confirm('Supprimer ce contact ?')) {
        appData.contacts = appData.contacts.filter(c => c.id !== id);
        await saveDataToFirestore();
        renderContacts();
    }
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
    console.log('[IAN] DOM loaded, checking authentication...');

    // Initialiser Firebase
    await firestoreService.initialize();

    // Firebase Auth persiste automatiquement l'authentification
    // L'utilisateur sera automatiquement reconnecté s'il était connecté
    // On attend un peu pour laisser le temps à onAuthStateChanged de se déclencher
    setTimeout(async () => {
        const currentUser = firestoreService.getCurrentUser();

        if (currentUser) {
            console.log('[IAN] User already authenticated:', currentUser.email);

            // Mettre à jour l'interface utilisateur
            const displayName = firestoreService.getDisplayName();
            document.getElementById('user-name').textContent = displayName;

            // Charger les données depuis Firestore
            await loadDataFromFirestore();

            // Afficher l'application
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('main-app').style.display = 'block';
        } else {
            console.log('[IAN] No user authenticated');
        }
    }, 500); // Attendre 500ms pour que Firebase Auth se synchronise
});
