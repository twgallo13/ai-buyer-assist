import { useEffect, useState } from 'react';
import { getSettings, updateSettings, subscribeSettings, applyPreset, BUYER_PRESETS, type Settings, type BuyerPresetKey } from '../lib/settings';
import { applyTheme } from '../lib/theme';

export default function SettingsPage() {
    const [s, setS] = useState<Settings>(getSettings());
    useEffect(() => {
        return subscribeSettings(setS);
    }, []);

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        updateSettings({ theme: newTheme });
        applyTheme(newTheme);
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-semibold">Settings</h2>

            {/* Theme Toggle */}
            <section className="space-y-2">
                <h3 className="font-medium">Appearance</h3>
                <label className="block">Theme
                    <select className="mt-1 w-full rounded bg-black/30 p-2" value={s.theme}
                        onChange={e => handleThemeChange(e.target.value as any)}>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                    </select>
                </label>
            </section>

            {/* AI Model Configuration */}
            <section className="space-y-2">
                <h3 className="font-medium">AI Model</h3>
                <label className="block">Model
                    <select className="mt-1 w-full rounded bg-black/30 p-2" value={s.model}
                        onChange={e => updateSettings({ model: e.target.value })}>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                    </select>
                </label>
                <label className="block">Temperature ({s.temperature})
                    <input type="range" min={0} max={1} step={0.05} value={s.temperature}
                        onChange={e => updateSettings({ temperature: Number(e.target.value) })} />
                </label>
                <label className="block">Reasoning Level
                    <select className="mt-1 w-full rounded bg-black/30 p-2" value={s.reasoningLevel}
                        onChange={e => updateSettings({ reasoningLevel: e.target.value as any })}>
                        <option value="basic">Basic</option>
                        <option value="detailed">Detailed</option>
                        <option value="comprehensive">Comprehensive</option>
                    </select>
                </label>
                <label className="block">Region Preset
                    <select className="mt-1 w-full rounded bg-black/30 p-2" value={s.regionPreset}
                        onChange={e => updateSettings({ regionPreset: e.target.value as any })}>
                        <option value="global">Global</option>
                        <option value="us">United States</option>
                        <option value="eu">Europe</option>
                        <option value="asia">Asia Pacific</option>
                    </select>
                </label>
            </section>

            {/* Analysis Settings */}
            <section className="space-y-2">
                <h3 className="font-medium">Analysis</h3>
                <label className="block">Budget cap (calls/day): {s.budgetCap}
                    <input type="range" min={50} max={5000} step={50} value={s.budgetCap}
                        onChange={e => updateSettings({ budgetCap: Number(e.target.value) })} />
                </label>
                <label className="block">Default Mode
                    <select className="mt-1 w-full rounded bg-black/30 p-2" value={s.defaultMode}
                        onChange={e => updateSettings({ defaultMode: e.target.value as any })}>
                        <option value="quick">Quick (CSV only)</option>
                        <option value="deep">Deep (Gemini)</option>
                    </select>
                </label>
            </section>

            <section className="space-y-2">
                <h3 className="font-medium">Buyer Presets</h3>
                <p className="text-sm opacity-70">Presets update weights & thresholds; you can still tweak manually.</p>
                <select
                    className="mt-1 w-full rounded bg-black/30 p-2"
                    onChange={e => {
                        if (e.target.value) {
                            applyPreset(e.target.value as BuyerPresetKey);
                        }
                    }}
                    defaultValue=""
                >
                    <option value="">Apply a preset...</option>
                    {Object.entries(BUYER_PRESETS).map(([key, preset]) => (
                        <option key={key} value={key}>{preset.label}</option>
                    ))}
                </select>
            </section>

            <section className="space-y-2">
                <h3 className="font-medium">Thresholds (Go / Hold)</h3>
                <div className="grid md:grid-cols-3 gap-3">
                    {(['demand', 'momentum', 'freshness'] as const).map(k => (
                        <div key={k} className="rounded border border-white/10 p-3">
                            <div className="text-sm opacity-80">{k.toUpperCase()}</div>
                            <label className="block">Go: {s.thresholds[`${k}Go` as const]}
                                <input type="range" min={40} max={90} step={1}
                                    value={s.thresholds[`${k}Go` as const]}
                                    onChange={e => updateSettings({ thresholds: { ...s.thresholds, [`${k}Go`]: Number(e.target.value) } } as any)} />
                            </label>
                            <label className="block">Hold: {s.thresholds[`${k}Hold` as const]}
                                <input type="range" min={30} max={80} step={1}
                                    value={s.thresholds[`${k}Hold` as const]}
                                    onChange={e => updateSettings({ thresholds: { ...s.thresholds, [`${k}Hold`]: Number(e.target.value) } } as any)} />
                            </label>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-2">
                <h3 className="font-medium">Weights & Scenario</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded border border-white/10 p-3">
                        <div className="opacity-80 text-sm">Weights</div>
                        {(['demand', 'momentum', 'saturation', 'freshness', 'styleFit'] as const).map(k => (
                            <label key={k} className="block capitalize">{k}: {s.weights[k]}
                                <input type="range" min={0} max={1} step={0.05} value={s.weights[k]}
                                    onChange={e => updateSettings({ weights: { ...s.weights, [k]: Number(e.target.value) } })} />
                            </label>
                        ))}
                    </div>
                    <div className="rounded border border-white/10 p-3">
                        <div className="opacity-80 text-sm">Scenario</div>
                        {(['marketingPush', 'collabFrequency', 'priceSensitivity', 'macroSentiment'] as const).map(k => (
                            <label key={k} className="block">{k}: {s.scenario[k]}
                                <input type="range" min={0} max={1} step={0.05} value={s.scenario[k]}
                                    onChange={e => updateSettings({ scenario: { ...s.scenario, [k]: Number(e.target.value) } })} />
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            <section className="space-y-2">
                <h3 className="font-medium">External Signals</h3>
                <p className="text-sm opacity-70">External trend providers for Deep analysis citations.</p>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                        <span>Stub provider (built-in)</span>
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">ON</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded opacity-50">
                        <span>News provider</span>
                        <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">OFF</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded opacity-50">
                        <span>Social provider</span>
                        <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">OFF</span>
                    </div>
                    <div className="text-xs opacity-60 mt-2">
                        Timeout: 4000ms (configured via server environment)
                    </div>
                </div>
            </section>
        </div>
    );
}