export type Theme = 'light' | 'dark' | 'system';
export type ModelKey = 'gemini-1.5-flash' | 'gemini-1.5-pro';
export type RegionPreset = 'global' | 'us' | 'eu' | 'apac';

export type KpiWeights = {
    availability: number;      // 0-100
    markdownRisk: number;     // 0-100
    diversification: number;   // 0-100
    velocity: number;         // 0-100
    resalePremium: number;    // 0-100
    trendAlignment: number;   // 0-100
    competitorPresence: number; // 0-100
};

export type VerdictThresholds = {
    pass: [number, number];    // 1-3 range
    test: [number, number];    // 4-6 range
    buy: [number, number];     // 7-8 range
    aggressive: [number, number]; // 9-10 range
};

export type Settings = {
    theme: Theme;
    model: ModelKey;
    temperature: number;       // 0..1
    reasoningLevel: 'basic' | 'detailed' | 'comprehensive';
    regionPreset: RegionPreset;
    kpiWeights: KpiWeights;
    verdictThresholds: VerdictThresholds;
    presets: string; // currently selected preset name
};

const DEFAULT: Settings = {
    theme: 'light',
    model: 'gemini-1.5-flash',
    temperature: 0.2,
    reasoningLevel: 'basic',
    regionPreset: 'us',
    kpiWeights: {
        availability: 80,
        markdownRisk: 70,
        diversification: 85,
        velocity: 60,
        resalePremium: 50,
        trendAlignment: 75,
        competitorPresence: 65,
    },
    verdictThresholds: {
        pass: [1, 3],
        test: [4, 6],
        buy: [7, 8],
        aggressive: [9, 10],
    },
    presets: 'default',
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
            kpiWeights: { ...DEFAULT.kpiWeights, ...parsed.kpiWeights },
            verdictThresholds: { ...DEFAULT.verdictThresholds, ...parsed.verdictThresholds },
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
        kpiWeights: { ...current.kpiWeights, ...(patch as any).kpiWeights },
        verdictThresholds: { ...current.verdictThresholds, ...(patch as any).verdictThresholds },
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

// Preset configurations
export const PRESETS = {
    'Nike Portal Night Run': {
        kpiWeights: {
            availability: 95,
            markdownRisk: 40,
            diversification: 30,
            velocity: 90,
            resalePremium: 85,
            trendAlignment: 95,
            competitorPresence: 60,
        },
        verdictThresholds: {
            pass: [1, 2] as [number, number],
            test: [3, 5] as [number, number],
            buy: [6, 8] as [number, number],
            aggressive: [9, 10] as [number, number],
        },
    },
    'Apparel Diversification': {
        kpiWeights: {
            availability: 70,
            markdownRisk: 85,
            diversification: 95,
            velocity: 50,
            resalePremium: 60,
            trendAlignment: 70,
            competitorPresence: 80,
        },
        verdictThresholds: {
            pass: [1, 4] as [number, number],
            test: [5, 6] as [number, number],
            buy: [7, 8] as [number, number],
            aggressive: [9, 10] as [number, number],
        },
    },
    'Markdown Audit': {
        kpiWeights: {
            availability: 60,
            markdownRisk: 95,
            diversification: 75,
            velocity: 40,
            resalePremium: 30,
            trendAlignment: 60,
            competitorPresence: 70,
        },
        verdictThresholds: {
            pass: [1, 3] as [number, number],
            test: [4, 7] as [number, number],
            buy: [8, 8] as [number, number],
            aggressive: [9, 10] as [number, number],
        },
    },
};

export function applyPreset(presetName: keyof typeof PRESETS) {
    const preset = PRESETS[presetName];
    if (preset) {
        updateSettings({
            kpiWeights: preset.kpiWeights,
            verdictThresholds: preset.verdictThresholds,
            presets: presetName,
        });
    }
}

// optional helper: theme application
export function applyTheme(theme: Theme) {
    const root = document.documentElement;
    const effective = theme === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    root.setAttribute('data-theme', effective);
}

// Legacy compatibility for verdict.ts and other files
// TODO: Remove these once verdict.ts is refactored to use new Settings structure

export type LegacyWeights = {
    demand: number;
    momentum: number;
    saturation: number;
    freshness: number;
    styleFit: number;
};

export type LegacyScenario = {
    marketingPush: number;
    collabFrequency: number;
    priceSensitivity: number;
    macroSentiment: number;
};

export type LegacyThresholds = {
    demandGo: number;
    momentumGo: number;
    freshnessGo: number;
    demandHold: number;
    momentumHold: number;
    freshnessHold: number;
};

// Legacy compatibility extensions to Settings interface
export interface LegacySettingsCompat {
    weights: LegacyWeights;
    scenario: LegacyScenario;
    thresholds: LegacyThresholds;
}

// Convert new Settings to legacy format for backward compatibility
export function getLegacyWeights(settings: Settings): LegacyWeights {
    return {
        demand: settings.kpiWeights.availability * 0.01,
        momentum: settings.kpiWeights.velocity * 0.01,
        saturation: settings.kpiWeights.competitorPresence * 0.01,
        freshness: settings.kpiWeights.trendAlignment * 0.01,
        styleFit: settings.kpiWeights.diversification * 0.01,
    };
}

export function getLegacyScenario(_settings: Settings): LegacyScenario {
    // Map settings to scenario values - using defaults for now
    return {
        marketingPush: 0.5,
        collabFrequency: 0.5,
        priceSensitivity: 0.5,
        macroSentiment: 0.5,
    };
}

export function getLegacyThresholds(settings: Settings): LegacyThresholds {
    // Convert VerdictThresholds ranges to individual thresholds
    return {
        demandGo: settings.verdictThresholds.buy[0] * 10, // Convert 1-10 scale to 0-100
        momentumGo: settings.verdictThresholds.buy[0] * 10,
        freshnessGo: settings.verdictThresholds.buy[0] * 10,
        demandHold: settings.verdictThresholds.test[0] * 10,
        momentumHold: settings.verdictThresholds.test[0] * 10,
        freshnessHold: settings.verdictThresholds.test[0] * 10,
    };
}