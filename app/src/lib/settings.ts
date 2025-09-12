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

export type BuyerPresetKey = 'footwear'|'apparel'|'regional_us'|'regional_eu';

export const BUYER_PRESETS: Record<BuyerPresetKey, {
  label: string;
  weights: Weights;
  thresholds: Thresholds;
}> = {
  footwear: {
    label: 'Footwear (Default)',
    weights: { demand:3, momentum:3, saturation:2, freshness:2, styleFit:1 },
    thresholds: { demandGo: 65, momentumGo: 60, freshnessGo: 55, demandHold: 45, momentumHold: 40, freshnessHold: 35 },
  },
  apparel: {
    label: 'Apparel',
    weights: { demand:2, momentum:2, saturation:2, freshness:3, styleFit:2 },
    thresholds: { demandGo: 62, momentumGo: 58, freshnessGo: 60, demandHold: 42, momentumHold: 38, freshnessHold: 40 },
  },
  regional_us: {
    label: 'Regional — US',
    weights: { demand:3, momentum:2, saturation:2, freshness:2, styleFit:1 },
    thresholds: { demandGo: 64, momentumGo: 59, freshnessGo: 54, demandHold: 44, momentumHold: 39, freshnessHold: 34 },
  },
  regional_eu: {
    label: 'Regional — EU',
    weights: { demand:2, momentum:3, saturation:2, freshness:2, styleFit:1 },
    thresholds: { demandGo: 63, momentumGo: 61, freshnessGo: 56, demandHold: 43, momentumHold: 41, freshnessHold: 36 },
  },
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

export function applyPreset(key: BuyerPresetKey){
  const p = BUYER_PRESETS[key];
  if (!p) return;
  _settings.weights = { ...p.weights };
  _settings.thresholds = { ...p.thresholds };
  _version++; 
  // Persist to localStorage
  try { 
    localStorage.setItem('aba_settings', JSON.stringify(_settings)); 
  } catch {}
  subs.forEach(fn => fn(_settings));
}