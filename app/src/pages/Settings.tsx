import { useEffect, useState } from 'react';
import {
    getSettings,
    updateSettings,
    subscribeSettings,
    deletePreset,
    applyPreset,
    resetToDefaults,
    normalizeRegionWeights,
    resetRegionWeights,
    exportSettings,
    importSettings,
    type Settings
} from '../lib/settings';
import type { PersonaId } from '../lib/types';
import HelpTip from '../components/HelpTip';

export default function SettingsPage() {
    const [s, setS] = useState<Settings>(getSettings());
    const [importError, setImportError] = useState<string | null>(null);

    useEffect(() => {
        return subscribeSettings(setS);
    }, []);

    // Region weights helpers
    const regionWeightsSum = Object.values(s.regionWeights).reduce((sum, w) => sum + w, 0);

    const handleRegionWeightChange = (region: string, value: number) => {
        const newWeights = { ...s.regionWeights, [region]: value };
        updateSettings({ regionWeights: newWeights });
    };

    const handleNormalizeRegions = () => {
        updateSettings({ regionWeights: normalizeRegionWeights(s.regionWeights) });
    };

    // Import/Export handlers
    const handleExport = () => {
        const dataStr = exportSettings();
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-buyer-settings-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                const importResult = importSettings(result);
                if (importResult.success) {
                    setImportError(null);
                    alert('Settings imported successfully!');
                } else {
                    setImportError(importResult.error || 'Import failed');
                }
            }
        };
        reader.readAsText(file);

        // Reset input
        event.target.value = '';
    };

    const selectedPreset = s.presets.find(p => p.id === s.selectedPersonaId);

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: 'var(--text)' }}>
                Settings & Buyer Management
            </h2>

            {/* AI Model & Creativity */}
            <div className="section">
                <h3 className="section-title">
                    AI Model & Creativity
                    <HelpTip text="Configure the AI model and its creativity level for analysis" />
                </h3>
                <div className="grid grid-2">
                    <div>
                        <label className="section-title" style={{ fontSize: '14px', marginBottom: '4px' }}>
                            Model
                            <HelpTip text="The AI model used for deep analysis" />
                        </label>
                        <select
                            className="select"
                            value={s.model}
                            onChange={e => updateSettings({ model: e.target.value })}
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        </select>
                    </div>
                    <div>
                        <label className="section-title" style={{ fontSize: '14px', marginBottom: '4px' }}>
                            Temperature: {s.temperature.toFixed(2)}
                            <HelpTip text="Higher values (0.7-1.0) make output more creative and varied. Lower values (0.1-0.3) make it more deterministic and focused." />
                        </label>
                        <input
                            type="range"
                            className="slider"
                            min={0}
                            max={1}
                            step={0.05}
                            value={s.temperature}
                            onChange={e => {
                                const val = Math.max(0, Math.min(1, Number(e.target.value)));
                                updateSettings({ temperature: val });
                            }}
                        />
                        <div className="help">
                            {s.temperature < 0.3 ? 'Conservative & Focused' :
                                s.temperature > 0.7 ? 'Creative & Explorative' :
                                    'Balanced'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Buyer Presets Management */}
            <div className="section">
                <h3 className="section-title">
                    Buyer Presets
                    <HelpTip text="Manage different buyer persona configurations with their own weights, thresholds, and expectations" />
                </h3>
                <div className="help" style={{ marginBottom: '16px' }}>
                    Configure buyer personas for different market segments. Each preset includes weight preferences, decision thresholds, and target expectations.
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label className="section-title" style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Active Preset
                        <HelpTip text="Currently selected buyer persona that influences analysis" />
                    </label>
                    <select
                        className="select"
                        value={s.selectedPersonaId || ''}
                        onChange={e => {
                            if (e.target.value) {
                                applyPreset(e.target.value as PersonaId);
                            }
                        }}
                    >
                        <option value="">None selected</option>
                        {s.presets.map(preset => (
                            <option key={preset.id} value={preset.id}>
                                {preset.label}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedPreset && (
                    <div className="card" style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <div className="section-title" style={{ fontSize: '14px' }}>Active: {selectedPreset.label}</div>
                        <div className="help">
                            Target Price: ${selectedPreset.expectations.targetPriceMax} |
                            Gender Focus: {selectedPreset.expectations.focusGender.join(', ')} |
                            Risk: {selectedPreset.expectations.riskTolerance}
                        </div>
                    </div>
                )}

                <div className="grid grid-2">
                    <button className="btn" onClick={() => alert('Preset editor coming soon!')}>
                        Create New Preset
                    </button>
                    <button className="btn btn-secondary" onClick={resetToDefaults}>
                        Reset All to Defaults
                    </button>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <h4 className="section-title" style={{ fontSize: '14px' }}>Available Presets</h4>
                    <div className="grid">
                        {s.presets.map(preset => (
                            <div key={preset.id} className="card" style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div className="section-title" style={{ fontSize: '14px' }}>
                                            {preset.label}
                                        </div>
                                        <div className="help">
                                            ${preset.expectations.targetPriceMax} | {preset.expectations.riskTolerance} risk
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn"
                                            style={{ fontSize: '12px', padding: '4px 8px' }}
                                            onClick={() => applyPreset(preset.id)}
                                        >
                                            Apply
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ fontSize: '12px', padding: '4px 8px' }}
                                            onClick={() => alert('Preset editor coming soon!')}
                                        >
                                            Edit
                                        </button>
                                        {!['sneakerhead', 'lifestyle', 'performance', 'kids_youth_parent'].includes(preset.id) && (
                                            <button
                                                className="btn"
                                                style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#dc2626' }}
                                                onClick={() => {
                                                    if (confirm(`Delete preset "${preset.label}"?`)) {
                                                        deletePreset(preset.id);
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Region Weights */}
            <div className="section">
                <h3 className="section-title">
                    Region Weights
                    <HelpTip text="Regional market importance weighting for analysis context" />
                </h3>
                <div className="help" style={{ marginBottom: '16px' }}>
                    Configure how much each region influences buying decisions. Weights are auto-normalized to sum to 1.0.
                </div>

                <div className="grid">
                    {Object.entries(s.regionWeights).map(([region, weight]) => (
                        <div key={region} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label className="section-title" style={{ fontSize: '14px' }}>
                                    {region}
                                </label>
                                <span className="help">{weight.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                className="slider"
                                min={0}
                                max={1}
                                step={0.01}
                                value={weight}
                                onChange={e => handleRegionWeightChange(region, Number(e.target.value))}
                            />
                        </div>
                    ))}

                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: regionWeightsSum > 1.1 || regionWeightsSum < 0.9 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                        borderRadius: '8px',
                        border: `1px solid ${regionWeightsSum > 1.1 || regionWeightsSum < 0.9 ? '#dc2626' : '#059669'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="help">Total Weight Sum: {regionWeightsSum.toFixed(2)}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn"
                                    onClick={handleNormalizeRegions}
                                    style={{ fontSize: '12px', padding: '4px 8px' }}
                                >
                                    Normalize
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={resetRegionWeights}
                                    style={{ fontSize: '12px', padding: '4px 8px' }}
                                >
                                    Reset Defaults
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Buyer Expectations */}
            <div className="section">
                <h3 className="section-title">
                    Buyer Expectations
                    <HelpTip text="Configure target parameters for the selected buyer persona" />
                </h3>
                <div className="help" style={{ marginBottom: '16px' }}>
                    Set expectations that guide AI analysis decisions. These are applied when a persona is active.
                </div>

                <div className="grid grid-2">
                    <div>
                        <label className="section-title" style={{ fontSize: '14px', marginBottom: '4px' }}>
                            Target Price Max: ${s.buyerExpectations.targetPriceMax}
                            <HelpTip text="Maximum price point this buyer segment typically accepts" />
                        </label>
                        <input
                            type="range"
                            className="slider"
                            min={60}
                            max={250}
                            step={5}
                            value={s.buyerExpectations.targetPriceMax}
                            onChange={e => updateSettings({
                                buyerExpectations: {
                                    ...s.buyerExpectations,
                                    targetPriceMax: Number(e.target.value)
                                }
                            })}
                        />
                    </div>
                    <div>
                        <label className="section-title" style={{ fontSize: '14px', marginBottom: '4px' }}>
                            Risk Tolerance
                            <HelpTip text="How willing this buyer segment is to take inventory risks" />
                        </label>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            {(['low', 'medium', 'high'] as const).map(level => (
                                <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input
                                        type="radio"
                                        name="riskTolerance"
                                        value={level}
                                        checked={s.buyerExpectations.riskTolerance === level}
                                        onChange={e => updateSettings({
                                            buyerExpectations: {
                                                ...s.buyerExpectations,
                                                riskTolerance: e.target.value as any
                                            }
                                        })}
                                    />
                                    <span className="help" style={{ textTransform: 'capitalize' }}>{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <label className="section-title" style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Focus Gender
                        <HelpTip text="Primary gender segments this buyer targets" />
                    </label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        {(['men', 'women', 'kids'] as const).map(gender => (
                            <label key={gender} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="checkbox"
                                    checked={s.buyerExpectations.focusGender.includes(gender)}
                                    onChange={e => {
                                        const newFocus = e.target.checked
                                            ? [...s.buyerExpectations.focusGender, gender]
                                            : s.buyerExpectations.focusGender.filter(g => g !== gender);
                                        updateSettings({
                                            buyerExpectations: {
                                                ...s.buyerExpectations,
                                                focusGender: newFocus
                                            }
                                        });
                                    }}
                                />
                                <span className="help" style={{ textTransform: 'capitalize' }}>{gender}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <label className="section-title" style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Size Notes
                        <HelpTip text="Special sizing considerations for this buyer segment" />
                    </label>
                    <textarea
                        className="input textarea"
                        style={{
                            width: '100%',
                            minHeight: '60px',
                            resize: 'vertical',
                            marginTop: '4px'
                        }}
                        placeholder="e.g., Full size runs important, focus on popular sizes 8-11..."
                        value={s.buyerExpectations.sizeNotes || ''}
                        onChange={e => updateSettings({
                            buyerExpectations: {
                                ...s.buyerExpectations,
                                sizeNotes: e.target.value
                            }
                        })}
                    />
                </div>
            </div>

            {/* Import/Export */}
            <div className="section">
                <h3 className="section-title">
                    Import/Export Settings
                    <HelpTip text="Backup and restore your complete settings configuration" />
                </h3>
                <div className="help" style={{ marginBottom: '16px' }}>
                    Export your settings as JSON for backup or sharing. Import to restore a previous configuration.
                </div>

                <div className="grid grid-2">
                    <button className="btn" onClick={handleExport}>
                        Export Settings JSON
                    </button>
                    <div>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                            id="import-settings"
                        />
                        <label htmlFor="import-settings" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            Import Settings JSON
                        </label>
                    </div>
                </div>

                {importError && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        border: '1px solid #dc2626',
                        borderRadius: '4px',
                        color: '#dc2626',
                        fontSize: '14px'
                    }}>
                        Import Error: {importError}
                    </div>
                )}
            </div>

            {/* AI Training Context */}
            <div className="section">
                <h3 className="section-title">
                    AI Training Context
                    <HelpTip text="Custom context passed to AI for more accurate, brand-specific analysis" />
                </h3>
                <div className="help" style={{ marginBottom: '16px' }}>
                    Provide specific guidance to help the AI understand your brand, buying preferences, and regional considerations.
                </div>
                <div className="grid">
                    <div style={{ marginBottom: '16px' }}>
                        <label className="section-title" style={{ fontSize: '14px' }}>
                            Brand Guidelines
                            <HelpTip text="Describe your brand identity, product categories, target customers, and general merchandise strategy" />
                        </label>
                        <textarea
                            className="input textarea"
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                resize: 'vertical',
                                marginTop: '4px'
                            }}
                            placeholder="e.g., Premium streetwear brand targeting 18-35 urban consumers. Focus on limited drops, collaborative pieces. Avoid basic/generic items."
                            value={s.trainingContext.brandGuidelines}
                            onChange={e => updateSettings({
                                trainingContext: {
                                    ...s.trainingContext,
                                    brandGuidelines: e.target.value
                                }
                            })}
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="section-title" style={{ fontSize: '14px' }}>
                            Buyer Notes
                            <HelpTip text="Specific buying criteria, exclusions, preferences, and markdown policies that influence decisions" />
                        </label>
                        <textarea
                            className="input textarea"
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                resize: 'vertical',
                                marginTop: '4px'
                            }}
                            placeholder="e.g., No buying if saturation >75%. Prefer momentum >60 for new categories. Quick markdown policy - exit within 30 days if underperforming."
                            value={s.trainingContext.buyerNotes}
                            onChange={e => updateSettings({
                                trainingContext: {
                                    ...s.trainingContext,
                                    buyerNotes: e.target.value
                                }
                            })}
                        />
                    </div>
                    <div>
                        <label className="section-title" style={{ fontSize: '14px' }}>
                            Region Notes
                            <HelpTip text="Regional preferences, cultural considerations, and market-specific factors (US/EU differences, etc.)" />
                        </label>
                        <textarea
                            className="input textarea"
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                resize: 'vertical',
                                marginTop: '4px'
                            }}
                            placeholder="e.g., US market prefers bold colorways, EU favors minimalist designs. Asian markets show higher price sensitivity. Consider seasonal differences."
                            value={s.trainingContext.regionNotes}
                            onChange={e => updateSettings({
                                trainingContext: {
                                    ...s.trainingContext,
                                    regionNotes: e.target.value
                                }
                            })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}