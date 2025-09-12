export type Theme = 'light' | 'dark' | 'system';

/**
 * Get system theme preference using media query
 */
export function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply the theme to the document root
 */
export function applyTheme(theme: Theme): void {
    const root = document.documentElement;
    const actualTheme = theme === 'system' ? getSystemTheme() : theme;
    root.dataset.theme = actualTheme;
}

/**
 * Initialize theme on page load and setup system theme listener
 */
export function initTheme(theme: Theme): void {
    applyTheme(theme);

    // Listen for system theme changes if using system preference
    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');
        mediaQuery.addEventListener('change', handleChange);
    }
}