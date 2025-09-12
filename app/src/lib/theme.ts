export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'aba_theme_mode';

export function getStoredTheme(): ThemeMode {
    const v = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    return v ?? 'system';
}

export function setStoredTheme(mode: ThemeMode) {
    localStorage.setItem(THEME_KEY, mode);
}

export function applyTheme(mode: ThemeMode) {
    const root = document.documentElement;
    root.removeAttribute('data-theme'); // reset
    root.setAttribute('data-theme', mode);
}

export function initTheme() {
    const m = getStoredTheme();
    applyTheme(m);
}