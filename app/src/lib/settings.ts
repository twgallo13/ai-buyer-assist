export type Theme = 'light' | 'dark' | 'system';
export type ModelKey = 'gemini-1.5-flash' | 'gemini-1.5-pro';
export type RegionPreset = 'global' | 'us' | 'eu' | 'apac';

export type Weights = {
    demand: number;
    momentum: number;
    saturation: number;
    freshness: number;
    styleFit: number;
};

export type Thresholds = {
    demandGo: number;
    momentumGo: number;
    freshnessGo: number;
    demandHold: number;
    momentumHold: number;
    freshnessHold: number;
}; export type Scenario = {
    marketingPush: number;     // -1..+1
    collabFrequency: number;   // 0..1
    priceSensitivity: number;  // 0..1
    macroSentiment: number;    // -1..+1
};

export type Settings = {
    theme: Theme;
    model: ModelKey;
    temperature: number;       // 0..1
    reasoningLevel: 'basic' | 'detailed' | 'comprehensive';
    regionPreset: RegionPreset;
    weights: Weights;
    thresholds: Thresholds;
    scenario: Scenario;
};

const DEFAULT: Settings = {
    theme: 'light',
    model: 'gemini-1.5-flash',
    temperature: 0.2,
    reasoningLevel: 'basic',
    regionPreset: 'us',
    weights: {
        demand: 0.8,
        momentum: 0.7,
        saturation: 0.6,
        freshness: 0.8,
        styleFit: 0.6,
    },
    thresholds: {
        demandGo: 70,
        momentumGo: 60,
        freshnessGo: 50,
        demandHold: 40,
        momentumHold: 35,
        freshnessHold: 30
    },
    scenario: { marketingPush: 0, collabFrequency: 0.3, priceSensitivity: 0.5, macroSentiment: 0 },
};

const KEY = 'ai.settings.v2';
let current: Settings = load();
const subs = new Set<(s: Settings) => void>();

function load(): Settings {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return DEFAULT;
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT,
            ...parsed,
            weights: { ...DEFAULT.weights, ...parsed.weights },
            thresholds: { ...DEFAULT.thresholds, ...parsed.thresholds },
            scenario: { ...DEFAULT.scenario, ...parsed.scenario }
        };
    } catch {
        return DEFAULT;
    }
}

function persist() {
    try {
        localStorage.setItem(KEY, JSON.stringify(current));
    } catch { }
}

function notify() {
    subs.forEach(fn => fn(current));
}

export function getSettings(): Settings {
    return current;
}

export function setSettings(next: Settings) {
    current = next;
    persist();
    notify();
}

export function updateSettings(patch: Partial<Settings>) {
    current = {
        ...current,
        ...patch,
        weights: { ...current.weights, ...(patch as any).weights },
        thresholds: { ...current.thresholds, ...(patch as any).thresholds },
        scenario: { ...current.scenario, ...(patch as any).scenario },
    };
    persist();
    notify();
}

export function subscribeSettings(cb: (s: Settings) => void) {
    subs.add(cb);
    cb(current);
    return () => {
        subs.delete(cb);
    };
}

// optional helper: theme application
export function applyTheme(theme: Theme) {
    const root = document.documentElement;
    const effective = theme === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    root.setAttribute('data-theme', effective);
}