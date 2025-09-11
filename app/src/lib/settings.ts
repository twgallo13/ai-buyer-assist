export type Thresholds = {
    demandGo: number; momentumGo: number; freshnessGo: number;
    demandHold: number; momentumHold: number; freshnessHold: number;
};

export type Weights = {
    demand: number; momentum: number; saturation: number; freshness: number; styleFit: number;
};

export type Scenario = {
    marketingPush: number; collabFrequency: number; priceSensitivity: number; macroSentiment: number;
};

export type Settings = {
    model: string;          // e.g., "gemini-1.5-flash"
    temperature: number;    // 0..1
    budgetCap: number;      // max deep calls per day (dev: in-memory)
    thresholds: Thresholds;
    weights: Weights;
    scenario: Scenario;
    defaultMode: 'quick' | 'deep';
};

const DEFAULTS: Settings = {
    model: 'gemini-1.5-flash',
    temperature: 0.4,
    budgetCap: 500,
    thresholds: { demandGo: 70, momentumGo: 65, freshnessGo: 60, demandHold: 55, momentumHold: 50, freshnessHold: 50 },
    weights: { demand: 0.35, momentum: 0.25, saturation: 0.15, freshness: 0.15, styleFit: 0.10 },
    scenario: { marketingPush: 0.5, collabFrequency: 0.5, priceSensitivity: 0.5, macroSentiment: 0.5 },
    defaultMode: 'deep',
};

// Load persisted settings or use defaults
function loadPersistedSettings(): Settings {
    try {
        const stored = localStorage.getItem('aba_settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULTS, ...parsed };
        }
    } catch {
        // Ignore parsing errors, use defaults
    }
    return { ...DEFAULTS };
}

let _settings: Settings = loadPersistedSettings();
let _version = 0;

type Sub = (s: Settings) => void;
const subs = new Set<Sub>();

export function getSettings(): Settings { return _settings; }
export function updateSettings(patch: Partial<Settings>) {
    _settings = { ..._settings, ...patch };
    _version++;
    // Persist to localStorage
    try {
        localStorage.setItem('aba_settings', JSON.stringify(_settings));
    } catch {
        // Ignore storage errors
    }
    subs.forEach(fn => fn(_settings));
}
export function subscribeSettings(fn: Sub) { subs.add(fn); return () => { subs.delete(fn); }; }
export function getSettingsVersion() { return _version; }