// Component Loader for IAN Application
// This file handles dynamic loading of HTML components

class ComponentLoader {
    constructor() {
        this.cache = {};
        this.componentsPath = 'components/';
    }

    /**
     * Load an HTML component from a file
     * @param {string} componentName - Name of the component file (without .html)
     * @param {string} targetId - ID of the element where to inject the component
     * @param {boolean} append - If true, append to target; if false, replace content
     * @returns {Promise<void>}
     */
    async loadComponent(componentName, targetId, append = false) {
        try {
            // Check cache first
            if (!this.cache[componentName]) {
                const response = await fetch(`${this.componentsPath}${componentName}.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load component: ${componentName}`);
                }
                this.cache[componentName] = await response.text();
            }

            const target = document.getElementById(targetId);
            if (target) {
                if (append) {
                    target.insertAdjacentHTML('beforeend', this.cache[componentName]);
                } else {
                    target.innerHTML = this.cache[componentName];
                }
            } else {
                console.error(`Target element #${targetId} not found`);
            }
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
        }
    }

    /**
     * Load multiple components sequentially
     * @param {Array<{name: string, target: string, append?: boolean}>} components - Array of component configs
     * @returns {Promise<void>}
     */
    async loadComponents(components) {
        for (const comp of components) {
            await this.loadComponent(comp.name, comp.target, comp.append);
        }
    }
}

// Initialize component loader
const componentLoader = new ComponentLoader();

// Debug log
console.log('[IAN] components.js loaded');

// Load all main components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[IAN] DOM ready, loading components...');
    // Load login screen
    await componentLoader.loadComponent('login', 'login-container');
    console.log('[IAN] Login component loaded, dispatching event');

    // Dispatch custom event to signal login component is loaded
    window.dispatchEvent(new CustomEvent('loginComponentLoaded'));

    // Load sync bar
    await componentLoader.loadComponent('sync-bar', 'sync-bar-container');

    // Load all pages into pages container
    await componentLoader.loadComponents([
        { name: 'home', target: 'pages-container', append: true },
        { name: 'ecosystem', target: 'pages-container', append: true },
        { name: 'directory', target: 'pages-container', append: true },
        { name: 'newsletter', target: 'pages-container', append: true },
        { name: 'usages', target: 'pages-container', append: true }
    ]);
});
