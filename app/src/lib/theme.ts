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
export function applyTheme(t: Theme): void {
    const root = document.documentElement;
    // base palette
    if (t === 'dark') {
        root.style.setProperty('--bg', '#0b0b0f');
        root.style.setProperty('--card', '#14151a');
        root.style.setProperty('--text', '#e8e8ea');
        root.style.setProperty('--muted', '#a3a3ab');
        root.style.setProperty('--accent', '#6366f1');
    } else {
        // light / eggshell
        root.style.setProperty('--bg',   '#F7F5EE');  /* eggshell */
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--text', '#1a1b1f');
        root.style.setProperty('--muted','#666a73');
        root.style.setProperty('--accent','#5b5ee6');
    }
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