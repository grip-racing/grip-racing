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
    };
    
    // Toggle theme
    function toggleTheme() {
        const currentTheme = getSavedTheme();
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
    }
    
    // Initialize theme on page load
    function initTheme() {
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);
        
        // Add event listener to theme toggle button with delay to ensure DOM is loaded
        setTimeout(() => {
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', toggleTheme);
                console.log('Theme toggle initialized');
            } else {
                console.warn('Theme toggle button not found');
            }
        }, 100);
    }
    
    // Apply theme immediately to prevent flash
    applyTheme(getSavedTheme());
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
    
    // Also try to initialize after components are loaded
    window.addEventListener('load', initTheme);
})();
