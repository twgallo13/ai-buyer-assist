export type Theme = 'light' | 'dark' | 'system';

export function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'system') {
        const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.setAttribute('data-theme', prefers);
    } else {
        root.setAttribute('data-theme', theme);
    }
}

export function initTheme(theme: Theme) {
    applyTheme(theme);
    // keep system in sync
    if (theme === 'system') {
        const mm = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('system');
        mm.addEventListener('change', handler);
    }
}