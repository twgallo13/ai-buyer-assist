export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'aba_theme_mode';

export function getStoredTheme(): ThemeMode {
    const v = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    return v ?? 'light'; // Default to light theme
}

export function setStoredTheme(mode: ThemeMode) {
    localStorage.setItem(THEME_KEY, mode);
}

export function applyTheme(mode: ThemeMode) {
    const body = document.body;
    body.setAttribute('data-theme', mode);
}

export function initTheme() {
    const mode = getStoredTheme();
    applyTheme(mode);
}