export type Theme = 'light' | 'dark' | 'system';
export type ReasoningLevel = 'basic' | 'standard' | 'detailed' | 'comprehensive';
export type RegionPreset = 'global' | 'central-ca' | 'las-vegas' | 'tx-wa';

export type Settings = {
    theme: Theme;
    model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
    temperature: number; // 0..1
    reasoning: ReasoningLevel;
    region: RegionPreset;
    budgetCap: number;
};

const KEY = 'ai-buyer-settings-v2';

const defaults: Settings = {
    theme: 'light',
    model: 'gemini-1.5-flash',
    temperature: 0.4,
    reasoning: 'standard',
    region: 'global',
    budgetCap: 500,
};

export function getSettings(): Settings {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return { ...defaults };
        const parsed = JSON.parse(raw);
        return { ...defaults, ...parsed };
    } catch {
        return { ...defaults };
    }
}

export function setSettings(next: Partial<Settings>) {
    const merged = { ...getSettings(), ...next };
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
}