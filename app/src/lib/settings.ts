import type { Preset, RegionWeights, BuyerExpectations, PersonaId, IndicesWeights, DecisionThresholds } from './types';
import { DEFAULT_PRESETS, DEFAULT_REGION_WEIGHTS, AOV_USD } from './presets';

export type Scenario = {
    marketingPush: number;
    collabFrequency: number;
    priceSensitivity: number;
    macroSentiment: number;
};

export type Settings = {
    model: string;          // e.g., "gemini-1.5-flash"
    temperature: number;    // 0..1
    budgetCap: number;      // max deep calls per day (dev: in-memory)
    scenario: Scenario;
    defaultMode: 'quick' | 'deep';
    selectedPersonaId: PersonaId | null;
    presets: Preset[];
    regionWeights: RegionWeights;
    buyerExpectations: BuyerExpectations;
    trainingContext: {
        brandGuidelines: string;
        buyerNotes: string;
        regionNotes: string;
    };
};

const STORAGE_KEY = 'ai.settings.v2';

const DEFAULTS: Settings = {
    model: 'gemini-1.5-flash',
    temperature: 0.4,
    budgetCap: 500,
    scenario: { marketingPush: 0.5, collabFrequency: 0.5, priceSensitivity: 0.5, macroSentiment: 0.5 },
    defaultMode: 'deep',
    selectedPersonaId: 'lifestyle',
    presets: [...DEFAULT_PRESETS],
    regionWeights: { ...DEFAULT_REGION_WEIGHTS },
    buyerExpectations: {
        targetPriceMax: AOV_USD,
        focusGender: ['men', 'women'],
        sizeNotes: '',
        riskTolerance: 'medium'
    },
    trainingContext: {
        brandGuidelines: '',
        buyerNotes: '',
        regionNotes: ''
    },
};

// Storage functions
function save(settings: Settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore storage errors
    }
}

function load(): Settings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to handle new fields
            return {
                ...DEFAULTS,
                ...parsed,
                presets: parsed.presets || [...DEFAULT_PRESETS],
                regionWeights: parsed.regionWeights || { ...DEFAULT_REGION_WEIGHTS },
                buyerExpectations: parsed.buyerExpectations || DEFAULTS.buyerExpectations
            };
        }
    } catch {
        // Ignore parsing errors, use defaults
    }
    return { ...DEFAULTS };
}

// Reactive store
let _settings: Settings = load();
let _version = 0;

type Sub = (s: Settings) => void;
const subs = new Set<Sub>();

export function getSettings(): Settings { return _settings; }

export function updateSettings(patch: Partial<Settings>) {
    _settings = { ..._settings, ...patch };
    _version++;
    save(_settings);
    subs.forEach(fn => fn(_settings));
}

export function subscribeSettings(fn: Sub) {
    subs.add(fn);
    return () => { subs.delete(fn); };
}

export function getSettingsVersion() { return _version; }

// Preset CRUD functions
export function createPreset(preset: Omit<Preset, 'id'> & { id?: string }): string {
    const id = preset.id || `custom_${Date.now()}`;
    const newPreset: Preset = { ...preset, id };

    _settings = {
        ..._settings,
        presets: [..._settings.presets, newPreset]
    };
    _version++;
    save(_settings);
    subs.forEach(fn => fn(_settings));
    return id;
}

export function updatePreset(id: PersonaId, updates: Partial<Preset>) {
    const presetIndex = _settings.presets.findIndex(p => p.id === id);
    if (presetIndex === -1) return false;

    _settings = {
        ..._settings,
        presets: _settings.presets.map((p, i) =>
            i === presetIndex ? { ...p, ...updates } : p
        )
    };
    _version++;
    save(_settings);
    subs.forEach(fn => fn(_settings));
    return true;
}

export function deletePreset(id: PersonaId) {
    _settings = {
        ..._settings,
        presets: _settings.presets.filter(p => p.id !== id),
        selectedPersonaId: _settings.selectedPersonaId === id ? null : _settings.selectedPersonaId
    };
    _version++;
    save(_settings);
    subs.forEach(fn => fn(_settings));
}

export function applyPreset(id: PersonaId) {
    const preset = _settings.presets.find(p => p.id === id);
    if (!preset) return false;

    _settings = {
        ..._settings,
        selectedPersonaId: id,
        buyerExpectations: { ...preset.expectations }
    };
    _version++;
    save(_settings);
    subs.forEach(fn => fn(_settings));
    return true;
}

export function resetToDefaults() {
    _settings = { ...DEFAULTS };
    _version++;
    save(_settings);
    subs.forEach(fn => fn(_settings));
}

// Region weights helpers
export function normalizeRegionWeights(weights: RegionWeights): RegionWeights {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (total === 0) return weights;

    const normalized: RegionWeights = {};
    for (const [region, weight] of Object.entries(weights)) {
        normalized[region] = weight / total;
    }
    return normalized;
}

export function resetRegionWeights() {
    updateSettings({ regionWeights: { ...DEFAULT_REGION_WEIGHTS } });
}

// Import/Export functions
export function exportSettings(): string {
    return JSON.stringify(_settings, null, 2);
}

export function importSettings(jsonString: string): { success: boolean; error?: string } {
    try {
        const parsed = JSON.parse(jsonString);

        // Basic validation
        if (typeof parsed !== 'object' || !parsed) {
            return { success: false, error: 'Invalid JSON format' };
        }

        // Validate required fields exist
        const required = ['model', 'temperature', 'presets', 'regionWeights', 'buyerExpectations'];
        for (const field of required) {
            if (!(field in parsed)) {
                return { success: false, error: `Missing required field: ${field}` };
            }
        }

        // Merge with defaults to ensure all fields exist
        const importedSettings: Settings = {
            ...DEFAULTS,
            ...parsed,
            presets: Array.isArray(parsed.presets) ? parsed.presets : [...DEFAULT_PRESETS],
            regionWeights: parsed.regionWeights || { ...DEFAULT_REGION_WEIGHTS },
            buyerExpectations: parsed.buyerExpectations || DEFAULTS.buyerExpectations
        };

        _settings = importedSettings;
        _version++;
        save(_settings);
        subs.forEach(fn => fn(_settings));

        return { success: true };
    } catch (error) {
        return { success: false, error: `Parse error: ${error}` };
    }
}

// Helper functions for backward compatibility
export function getCurrentWeights(): IndicesWeights {
    const preset = _settings.presets.find(p => p.id === _settings.selectedPersonaId);
    return preset?.weights || {
        demand: 0.25,
        momentum: 0.25,
        saturation: 0.2,
        freshness: 0.15,
        styleFit: 0.15
    };
}

export function getCurrentThresholds(): DecisionThresholds {
    const preset = _settings.presets.find(p => p.id === _settings.selectedPersonaId);
    return preset?.thresholds || {
        demandGo: 70,
        momentumGo: 60,
        freshnessGo: 50,
        demandHold: 50,
        momentumHold: 40,
        freshnessHold: 30
    };
}