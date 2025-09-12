import { useEffect, useState } from 'react';
import { getSettings, updateSettings, subscribeSettings, applyPreset, resetToDefaults, BUYER_PRESETS, type Settings, type BuyerPresetKey } from '../lib/settings';
import HelpTip from '../components/HelpTip';

export default function SettingsPage() {
    const [s, setS] = useState<Settings>(getSettings());
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        return subscribeSettings(setS);
    }, []);

    // Validation functions
    const validateThreshold = (value: number, field: string) => {
        if (value < 0 || value > 100) {
            setValidationErrors(prev => ({ ...prev, [field]: 'Must be between 0-100' }));
            return false;
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
            return true;
        }
    };

    const weightsSum = Object.values(s.weights).reduce((sum, w) => sum + w, 0);
    const normalizeWeights = () => {
        const sum = weightsSum;
        if (sum > 0) {
            const normalized = Object.fromEntries(
                Object.entries(s.weights).map(([k, v]) => [k, v / sum])
            ) as typeof s.weights;
            updateSettings({ weights: normalized });
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: 'var(--text)' }}>
                Settings
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

            {/* Decision Thresholds */}
            <div className="section">
                <h3 className="section-title">
                    Decision Thresholds
                    <HelpTip text="Minimum combined index scores (0-100) required for Go/Hold recommendations" />
                </h3>
                <div className="help" style={{ marginBottom: '12px' }}>
                    Set the minimum scores needed for each recommendation type. Higher thresholds = more conservative decisions.
                </div>
                <div className="grid grid-3">
                    {(['demand', 'momentum', 'freshness'] as const).map(metric => (
                        <div key={metric} className="card" style={{ padding: '12px' }}>
                            <div className="section-title" style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                                {metric}
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <label className="help">
                                    Go Threshold: {s.thresholds[`${metric}Go` as const]}
                                </label>
                                <input
                                    type="range"
                                    className="slider"
                                    min={40}
                                    max={90}
                                    step={1}
                                    value={s.thresholds[`${metric}Go` as const]}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        if (validateThreshold(val, `${metric}Go`)) {
                                            updateSettings({
                                                thresholds: {
                                                    ...s.thresholds,
                                                    [`${metric}Go`]: val
                                                }
                                            } as any);
                                        }
                                    }}
                                />
                                {validationErrors[`${metric}Go`] && (
                                    <div style={{ color: '#dc2626', fontSize: '12px' }}>
                                        {validationErrors[`${metric}Go`]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="help">
                                    Hold Threshold: {s.thresholds[`${metric}Hold` as const]}
                                </label>
                                <input
                                    type="range"
                                    className="slider"
                                    min={30}
                                    max={80}
                                    step={1}
                                    value={s.thresholds[`${metric}Hold` as const]}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        if (validateThreshold(val, `${metric}Hold`)) {
                                            updateSettings({
                                                thresholds: {
                                                    ...s.thresholds,
                                                    [`${metric}Hold`]: val
                                                }
                                            } as any);
                                        }
                                    }}
                                />
                                {validationErrors[`${metric}Hold`] && (
                                    <div style={{ color: '#dc2626', fontSize: '12px' }}>
                                        {validationErrors[`${metric}Hold`]}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Index Weights */}
            <div className="section">
                <h3 className="section-title">
                    Index Weights
                    <HelpTip text="How much each metric contributes to the final analysis. Higher weights = more influence." />
                </h3>
                <div className="help" style={{ marginBottom: '12px' }}>
                    Configure the relative importance of each metric in decision-making.
                </div>
                <div className="grid">
                    {(['demand', 'momentum', 'saturation', 'freshness', 'styleFit'] as const).map(metric => (
                        <div key={metric} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label className="section-title" style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                                    {metric === 'styleFit' ? 'Style Fit' : metric}
                                    <HelpTip text={
                                        metric === 'demand' ? 'Current market appetite (velocity, sell-through rates)' :
                                            metric === 'momentum' ? 'Trend direction - rising or falling popularity over time' :
                                                metric === 'saturation' ? 'Market crowding level - risk of markdowns and oversupply' :
                                                    metric === 'freshness' ? 'Novelty factor - new styles vs. lifecycle stage' :
                                                        'Brand and customer aesthetic alignment'
                                    } />
                                </label>
                                <span className="help">{s.weights[metric].toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                className="slider"
                                min={0}
                                max={1}
                                step={0.05}
                                value={s.weights[metric]}
                                onChange={e => updateSettings({
                                    weights: {
                                        ...s.weights,
                                        [metric]: Number(e.target.value)
                                    }
                                })}
                            />
                        </div>
                    ))}
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: weightsSum > 1.1 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                        borderRadius: '8px',
                        border: `1px solid ${weightsSum > 1.1 ? '#dc2626' : '#059669'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="help">Total Weight Sum: {weightsSum.toFixed(2)}</span>
                            {weightsSum > 1.1 && (
                                <button
                                    className="btn"
                                    onClick={normalizeWeights}
                                    style={{ fontSize: '12px', padding: '4px 8px' }}
                                >
                                    Normalize to 1.0
                                </button>
                            )}
                        </div>
                        {weightsSum > 1.1 && (
                            <div className="help" style={{ color: '#dc2626', marginTop: '4px' }}>
                                Warning: Sum exceeds 1.0. Consider normalizing for balanced weighting.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Market Scenario */}
            <div className="section">
                <h3 className="section-title">
                    Market Scenario (What-if)
                    <HelpTip text="Adjust market conditions to bias analysis results. Values from -2 to +2 affect metric calculations." />
                </h3>
                <div className="help" style={{ marginBottom: '12px' }}>
                    Simulate different market conditions to see how they would impact buying decisions.
                </div>
                <div className="grid grid-2">
                    {([
                        { key: 'marketingPush', label: 'Marketing Push', help: 'Planned promotional intensity - higher values boost demand forecasts' },
                        { key: 'collabFrequency', label: 'Collab Frequency', help: 'Collaboration cadence - affects freshness and momentum calculations' },
                        { key: 'priceSensitivity', label: 'Price Sensitivity', help: 'Customer price awareness - impacts saturation risk assessment' },
                        { key: 'macroSentiment', label: 'Macro Sentiment', help: 'Overall economic mood - influences all buying behavior predictions' }
                    ] as const).map(({ key, label, help }) => (
                        <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label className="section-title" style={{ fontSize: '14px' }}>
                                    {label}
                                    <HelpTip text={help} />
                                </label>
                                <span className="help">{(s.scenario[key] * 4 - 2).toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                className="slider"
                                min={0}
                                max={1}
                                step={0.05}
                                value={s.scenario[key]}
                                onChange={e => updateSettings({
                                    scenario: {
                                        ...s.scenario,
                                        [key]: Number(e.target.value)
                                    }
                                })}
                            />
                            <div className="help" style={{ fontSize: '11px' }}>
                                {s.scenario[key] < 0.4 ? 'Negative Impact' :
                                    s.scenario[key] > 0.6 ? 'Positive Impact' :
                                        'Neutral'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Buyer Presets */}
            <div className="section">
                <h3 className="section-title">
                    Buyer Presets
                    <HelpTip text="Quick configurations for different buying scenarios and regions" />
                </h3>
                <div className="help" style={{ marginBottom: '12px' }}>
                    Apply preset configurations that update weights and thresholds. You can fine-tune manually afterwards.
                </div>
                <div className="grid grid-2">
                    <div>
                        <select
                            className="select"
                            onChange={e => {
                                if (e.target.value) {
                                    applyPreset(e.target.value as BuyerPresetKey);
                                    e.target.value = ''; // Reset dropdown
                                }
                            }}
                            defaultValue=""
                        >
                            <option value="">Apply a preset...</option>
                            {Object.entries(BUYER_PRESETS).map(([key, preset]) => (
                                <option key={key} value={key}>{preset.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <button
                            className="btn"
                            onClick={resetToDefaults}
                            style={{ width: '100%' }}
                        >
                            Reset to Defaults
                        </button>
                    </div>
                </div>
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
                            className="input"
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
                            className="input"
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
                            className="input"
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