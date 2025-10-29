// IAN - Écosystème Interactif - Application JavaScript

// Service GitHub
class GitHubService {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.token = null;
        this.username = null;
        this.mainGistId = null;
    }

    setCredentials(token, username) {
        this.token = token;
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
        this.token = null;
        this.username = null;
        this.mainGistId = null;
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_username');
        localStorage.removeItem('ian_main_gist_id');
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.baseURL}/user`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const user = await response.json();
                return { valid: true, username: user.login, user };
            }

            // Log detailed error information
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

    async createGist(data, description = 'IAN Ecosystem Data', isPublic = false) {
        if (!this.token) throw new Error('No token configured');

        const response = await fetch(`${this.baseURL}/gists`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description,
                public: isPublic,
                files: {
                    'ian-ecosystem.json': {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create gist');
        }

        return await response.json();
    }

    async updateGist(gistId, data, description) {
        if (!this.token) throw new Error('No token configured');

        const response = await fetch(`${this.baseURL}/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: description || 'IAN Ecosystem Data - Updated',
                files: {
                    'ian-ecosystem.json': {
                        content: JSON.stringify(data, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update gist');
        }

        return await response.json();
    }

    async getGist(gistId) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        const response = await fetch(`${this.baseURL}/gists/${gistId}`, {
            headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch gist');
        }

        const gist = await response.json();
        const content = gist.files['ian-ecosystem.json']?.content;

        if (content) {
            return JSON.parse(content);
        }

        return null;
    }

    async listGists() {
        if (!this.token || !this.username) return [];

        const response = await fetch(`${this.baseURL}/users/${this.username}/gists`, {
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) return [];

        const gists = await response.json();
        return gists.filter(g =>
            g.files['ian-ecosystem.json'] &&
            g.description?.includes('IAN Ecosystem')
        );
    }
}

const githubService = new GitHubService();

// Structure de données globale
let appData = {
    ianProfile: {
        avatar: '👤',
        name: '',
        academy: 'Orléans-Tours',
        discipline: '',
        email: '',
        objectives: '',
        notes: ''
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
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('github-token').value;
            const submitButton = e.target.querySelector('button[type="submit"]');

            // Désactiver le bouton pendant la vérification
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="flex items-center justify-center space-x-2"><span>Vérification...</span></span>';

            // Vérifier le token
            const result = await githubService.verifyToken(token);

            if (result.valid) {
                githubService.setCredentials(token, result.username);

                // Mettre à jour l'interface utilisateur
                document.getElementById('user-name').textContent = result.username;
                if (result.user.avatar_url) {
                    const avatar = document.getElementById('user-avatar');
                    avatar.src = result.user.avatar_url;
                    avatar.style.display = 'block';
                }

                // Charger les données depuis GitHub
                await loadDataFromGitHub();

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
});

// Chargement des données depuis GitHub
async function loadDataFromGitHub() {
    updateSyncStatus('Chargement...');

    try {
        // Vérifier s'il y a un Gist principal stocké
        const storedGistId = localStorage.getItem('ian_main_gist_id');
        if (storedGistId) {
            const data = await githubService.getGist(storedGistId);
            if (data) {
                appData = { ...appData, ...data };
                githubService.mainGistId = storedGistId;
                updateSyncStatus('Synchronisé');
                return;
            }
        }

        // Sinon, chercher un Gist existant
        const gists = await githubService.listGists();
        const mainGist = gists.find(g => g.description?.includes('[MAIN]'));

        if (mainGist) {
            const data = await githubService.getGist(mainGist.id);
            appData = { ...appData, ...data };
            githubService.mainGistId = mainGist.id;
            localStorage.setItem('ian_main_gist_id', mainGist.id);
        } else {
            // Créer un nouveau Gist
            const gist = await githubService.createGist(
                appData,
                `[MAIN] IAN Ecosystem Data - ${githubService.username}`,
                false
            );
            githubService.mainGistId = gist.id;
            localStorage.setItem('ian_main_gist_id', gist.id);
        }

        updateSyncStatus('Synchronisé');
    } catch (error) {
        console.error('Error loading data:', error);
        updateSyncStatus('Erreur de synchronisation');
    }
}

// Sauvegarde des données vers GitHub
async function saveDataToGitHub() {
    if (!githubService.token || !githubService.mainGistId) return;

    updateSyncStatus('Synchronisation...');

    try {
        appData.lastUpdated = new Date().toISOString();

        await githubService.updateGist(
            githubService.mainGistId,
            appData,
            `[MAIN] IAN Ecosystem Data - ${githubService.username}`
        );

        updateSyncStatus('Synchronisé');
    } catch (error) {
        console.error('Error saving data:', error);
        updateSyncStatus('Erreur de synchronisation');
    }
}

// Synchronisation manuelle
async function manualSync() {
    await saveDataToGitHub();
}

// Mise à jour du statut de synchronisation
function updateSyncStatus(status) {
    const statusElement = document.getElementById('sync-status');
    statusElement.innerHTML = `<span class="sync-indicator">●</span><span class="ml-1">${status}</span>`;
}

// Déconnexion
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        githubService.clearCredentials();
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
    switch(page) {
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
            <div class="bg-gradient-to-r from-[#009099] to-[#007580] rounded-lg shadow-lg p-6 mb-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <div class="relative">
                            <div id="ian-avatar" class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl cursor-pointer hover:bg-opacity-30 transition-colors" onclick="changeAvatar()">
                                ${appData.ianProfile.avatar || '👤'}
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors" onclick="changeAvatar()" title="Changer l&apos;avatar">
                                <span class="text-xs">✏️</span>
                            </div>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold">Mon Profil IAN</h2>
                            <p class="text-teal-100">Interlocuteur Académique pour le Numérique</p>
                        </div>
                    </div>
                    <button
                        onclick="toggleIANProfile()"
                        id="ian-toggle-btn"
                        class="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors flex items-center space-x-2"
                    >
                        <span>Compléter mon profil</span>
                        <span id="ian-toggle-icon">▼</span>
                    </button>
                </div>

                <div id="ian-profile-details" class="hidden space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Informations personnelles -->
                        <div class="bg-white bg-opacity-10 rounded-lg p-4">
                            <h3 class="font-semibold mb-3 flex items-center space-x-2">
                                <span>📋</span>
                                <span>Mes informations</span>
                            </h3>
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-teal-100 mb-1">Nom complet</label>
                                    <input
                                        type="text"
                                        id="ian-name"
                                        value="${appData.ianProfile.name || ''}"
                                        placeholder="Votre nom et prénom"
                                        class="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-white placeholder-teal-200 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                        onchange="updateIANField('name', this.value)"
                                    >
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-teal-100 mb-1">Académie</label>
                                    <input
                                        type="text"
                                        id="ian-academy"
                                        value="${appData.ianProfile.academy || ''}"
                                        placeholder="Ex: Orléans-Tours"
                                        class="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-white placeholder-teal-200 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                        onchange="updateIANField('academy', this.value)"
                                    >
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-teal-100 mb-1">Discipline</label>
                                    <input
                                        type="text"
                                        id="ian-discipline"
                                        value="${appData.ianProfile.discipline || ''}"
                                        placeholder="Ex: Mathématiques, Histoire-Géo..."
                                        class="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-white placeholder-teal-200 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                        onchange="updateIANField('discipline', this.value)"
                                    >
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-teal-100 mb-1">Contact</label>
                                    <input
                                        type="email"
                                        id="ian-email"
                                        value="${appData.ianProfile.email || ''}"
                                        placeholder="votre.email@ac-academie.fr"
                                        class="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-white placeholder-teal-200 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                        onchange="updateIANField('email', this.value)"
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- Missions principales -->
                        <div class="bg-white bg-opacity-10 rounded-lg p-4">
                            <h3 class="font-semibold mb-3 flex items-center space-x-2">
                                <span>🎯</span>
                                <span>Mes missions principales</span>
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start space-x-2">
                                    <span class="text-yellow-300 mt-1">•</span>
                                    <span>Accompagner les enseignants dans l&apos;usage du numérique éducatif</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-yellow-300 mt-1">•</span>
                                    <span>Assurer la veille technologique et pédagogique</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-yellow-300 mt-1">•</span>
                                    <span>Organiser des formations et ateliers numériques</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-yellow-300 mt-1">•</span>
                                    <span>Faire le lien entre le terrain et les instances nationales</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-yellow-300 mt-1">•</span>
                                    <span>Expérimenter et évaluer les outils numériques</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Objectifs personnels -->
                    <div class="bg-white bg-opacity-10 rounded-lg p-4">
                        <h3 class="font-semibold mb-3 flex items-center space-x-2">
                            <span>🚀</span>
                            <span>Mes objectifs pour cette année</span>
                        </h3>
                        <textarea
                            id="ian-objectives"
                            placeholder="Définissez vos objectifs prioritaires en tant qu'IAN : formations à organiser, projets à développer, partenariats à créer..."
                            class="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-white placeholder-teal-200 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            rows="4"
                            onchange="updateIANField('objectives', this.value)"
                        >${appData.ianProfile.objectives || ''}</textarea>
                    </div>

                    <!-- Notes personnelles -->
                    <div class="bg-white bg-opacity-10 rounded-lg p-4">
                        <h3 class="font-semibold mb-3 flex items-center space-x-2">
                            <span>📝</span>
                            <span>Notes et réflexions</span>
                        </h3>
                        <textarea
                            id="ian-notes"
                            placeholder="Vos réflexions, idées, retours d'expérience..."
                            class="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-white placeholder-teal-200 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            rows="3"
                            onchange="updateIANField('notes', this.value)"
                        >${appData.ianProfile.notes || ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadDirectoryContent() {
    const content = document.getElementById('directory-content');
    content.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-800">Annuaire des IAN</h2>
                <button onclick="addContact()" class="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                    ➕ Ajouter un contact
                </button>
            </div>
            <div id="contacts-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${renderContacts()}
            </div>
        </div>
    `;
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
function updateProfile(field, value) {
    appData.ianProfile[field] = value;
    saveDataToGitHub();
}

function updateIANField(field, value) {
    appData.ianProfile[field] = value;
    saveDataToGitHub();
}

function toggleIANProfile() {
    const details = document.getElementById('ian-profile-details');
    const icon = document.getElementById('ian-toggle-icon');

    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        icon.textContent = '▲';
    } else {
        details.classList.add('hidden');
        icon.textContent = '▼';
    }
}

function changeAvatar() {
    const avatars = ['👤', '👨‍🏫', '👩‍🏫', '👨‍💻', '👩‍💻', '🧑‍🏫', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🧑‍🎓', '📚', '💻', '🎓', '🌟', '✨', '🚀', '🎯'];

    const currentAvatar = appData.ianProfile.avatar || '👤';
    let currentIndex = avatars.indexOf(currentAvatar);

    // Passer au prochain avatar
    currentIndex = (currentIndex + 1) % avatars.length;
    const newAvatar = avatars[currentIndex];

    appData.ianProfile.avatar = newAvatar;

    // Mettre à jour l'affichage
    const avatarElement = document.getElementById('ian-avatar');
    if (avatarElement) {
        avatarElement.textContent = newAvatar;
    }

    saveDataToGitHub();
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
        saveDataToGitHub();
        loadDirectoryContent();
    }
}

function deleteContact(index) {
    if (confirm('Supprimer ce contact ?')) {
        appData.directoryProfiles.splice(index, 1);
        saveDataToGitHub();
        loadDirectoryContent();
    }
}

// Vérification de l'authentification au chargement
window.addEventListener('DOMContentLoaded', async () => {
    const { token, username } = githubService.getStoredCredentials();
    if (token && username) {
        const result = await githubService.verifyToken(token);
        if (result.valid) {
            githubService.setCredentials(token, username);

            // Mettre à jour l'interface utilisateur
            document.getElementById('user-name').textContent = username;
            if (result.user.avatar_url) {
                const avatar = document.getElementById('user-avatar');
                avatar.src = result.user.avatar_url;
                avatar.style.display = 'block';
            }

            // Charger les données
            await loadDataFromGitHub();

            // Afficher l'application
            document.getElementById('login-screen').classList.remove('active');
            document.getElementById('main-app').style.display = 'block';
        } else {
            githubService.clearCredentials();
        }
    }
});
