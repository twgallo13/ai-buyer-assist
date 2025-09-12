export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';

/**
 * Get the stored theme from localStorage or default to 'light'
 */
export function getStoredTheme(): ThemeMode {
    try {
        const v = localStorage.getItem(THEME_KEY) as ThemeMode | null;
        return v ?? 'light'; // Default to light theme
    } catch (e) {
        return 'light';
    }
}

/**
 * Store the theme preference in localStorage
 */
export function setStoredTheme(mode: ThemeMode) {
    try {
        localStorage.setItem(THEME_KEY, mode);
    } catch (e) {
        console.warn('Could not store theme preference', e);
    }
}

/**
 * Get system theme preference using media query
 */
export function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply the theme to the document root
 */
export function applyTheme(mode: ThemeMode) {
    const root = document.documentElement;
    const actualTheme = mode === 'system' ? getSystemTheme() : mode;
    root.setAttribute('data-theme', actualTheme);
}

/**
 * Initialize theme on page load
 */
export function initTheme() {
    const mode = getStoredTheme();
    applyTheme(mode);

    // Listen for system theme changes if using system preference
    if (mode === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => applyTheme('system'));
    }
}