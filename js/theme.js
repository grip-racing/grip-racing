// Theme Management
(function() {
    'use strict';
    
    const THEME_KEY = 'grip-racing-theme';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';
    
    // Get saved theme or default to light
    function getSavedTheme() {
        return localStorage.getItem(THEME_KEY) || LIGHT_THEME;
    }
    
    // Apply theme to document
    function applyTheme(theme) {
        if (theme === DARK_THEME) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        // Update theme toggle icon
        updateThemeIcon(theme);
        
        // Update logos
        updateLogos(theme);
    }
    
    // Update theme toggle button icon
    function updateThemeIcon(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === DARK_THEME ? '☀️' : '🌙';
        }
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.setAttribute('aria-pressed', String(theme === DARK_THEME));
        }
    }
    
    // Update logos based on theme
    function updateLogos(theme) {
        const logos = document.querySelectorAll('.logo-theme');
        logos.forEach(logo => {
            const lightLogo = logo.getAttribute('data-logo-light');
            const darkLogo = logo.getAttribute('data-logo-dark');
            
            if (lightLogo && darkLogo) {
                logo.src = theme === DARK_THEME ? darkLogo : lightLogo;
            }
        });
    }
    
    // Expose function globally for components loader
    window.updateThemeLogos = function() {
        updateLogos(getSavedTheme());
        updateThemeIcon(getSavedTheme());
    };
    
    // Toggle theme
    function toggleTheme() {
        const currentTheme = getSavedTheme();
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
        
        // Dispatch custom event for theme change
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
    }
    
    // Initialize theme on page load
    // Um único listener delegado: o botão chega depois (components-loader)
    // e listeners duplicados anulariam o clique (alternaria duas vezes).
    let toggleBound = false;
    function initTheme() {
        applyTheme(getSavedTheme());
        if (toggleBound) return;
        toggleBound = true;
        document.addEventListener('click', (e) => {
            if (e.target.closest && e.target.closest('#themeToggle')) {
                toggleTheme();
            }
        });
    }

    // Apply theme immediately to prevent flash
    applyTheme(getSavedTheme());

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    // Reaplica ícone/logos depois que header/footer forem carregados
    window.addEventListener('load', () => applyTheme(getSavedTheme()));
})();
