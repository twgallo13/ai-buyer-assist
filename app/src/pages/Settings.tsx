import { useEffect, useState } from 'react';
import { getSettings, updateSettings, applyTheme, applyPreset, PRESETS, HELP_TEXT, type Settings, type Theme, type RegionPreset, type KpiWeights, type VerdictThresholds } from '../lib/settings';
import { getApiVersion, getFallbackVersion } from '../lib/api';
import '../styles/settings.css';

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(getSettings());
  const [version, setVersion] = useState<string>(getFallbackVersion());

  // External Signals verification state
  const [verifying, setVerifying] = useState(false);
  const [signalsStatus, setSignalsStatus] = useState<'ACTIVE' | 'ERROR' | 'UNKNOWN'>('UNKNOWN');
  const [signalsLastUpdate, setSignalsLastUpdate] = useState<string>('');
  const [signalsError, setSignalsError] = useState<string>('');

  useEffect(() => {
    applyTheme(s.theme);

    // Load unified version
    const loadVersion = async () => {
      const apiVersion = await getApiVersion();
      setVersion(apiVersion);
    };
    loadVersion();
  }, []);

  function update<K extends keyof Settings>(k: K, v: Settings[K]) {
    const newSettings = { ...s, [k]: v };
    setS(newSettings);
    if (k === 'theme') applyTheme(v as Theme);
  }

  function updateKpiWeight(key: keyof KpiWeights, value: number) {
    const newWeights = { ...s.kpiWeights, [key]: value };
    update('kpiWeights', newWeights);
  }

  function updateVerdictThreshold(category: keyof VerdictThresholds, index: 0 | 1, value: number) {
    const newThresholds = { ...s.verdictThresholds };
    newThresholds[category][index] = value;
    update('verdictThresholds', newThresholds);
  }

  function handleSave() {
    updateSettings(s);
  }

  function handleReset() {
    const defaultSettings = getSettings();
    setS(defaultSettings);
  }

  function handlePresetApply(presetName: keyof typeof PRESETS) {
    applyPreset(presetName);
    setS(getSettings());
  }

  async function verifyExternalSignals() {
    setVerifying(true);
    try {
      const r = await fetch('/api/trends?query=ping', { credentials: 'include' });
      const data = await r.json();
      const ok = Array.isArray(data.items) && data.items.length > 0;
      setSignalsStatus(ok ? 'ACTIVE' : 'ERROR');
      setSignalsLastUpdate(new Date().toISOString());
      setSignalsError(ok ? '' : 'No items returned.');
    } catch (e: any) {
      setSignalsStatus('ERROR');
      setSignalsError(e.message ?? 'Network error');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="settings-page">
      {/* Sticky Header */}
      <div className="settings-header">
        <h1>Settings</h1>
        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-grid">
          {/* Left Column */}
          <div className="settings-main">
            {/* Theme Section */}
            <div className="settings-card">
              <h3>Theme</h3>
              <div className="form-row">
                <label className="form-label">Appearance</label>
                <select className="form-select" value={s.theme} onChange={(e) => update('theme', e.target.value as Theme)}>
                  <option value="light">Light (Eggshell)</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <div className="form-help">{HELP_TEXT.theme}</div>
              </div>
            </div>

            {/* AI Model Section */}
            <div className="settings-card">
              <h3>AI Model Configuration</h3>
              <div className="form-row">
                <label className="form-label">Model</label>
                <select className="form-select" value={s.model} onChange={(e) => update('model', e.target.value as Settings['model'])}>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
                <div className="form-help">{HELP_TEXT.model}</div>
              </div>
              <div className="form-row">
                <label className="form-label">Temperature: {s.temperature}</label>
                <input
                  className="form-range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={s.temperature}
                  onChange={(e) => update('temperature', Number(e.target.value))}
                />
                <div className="form-help">{HELP_TEXT.temperature}</div>
              </div>
              <div className="form-row">
                <label className="form-label">Reasoning Level</label>
                <select className="form-select" value={s.reasoningLevel} onChange={(e) => update('reasoningLevel', e.target.value as Settings['reasoningLevel'])}>
                  <option value="basic">Basic</option>
                  <option value="detailed">Detailed</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
                <div className="form-help">{HELP_TEXT.reasoningLevel}</div>
              </div>
              <div className="form-row">
                <label className="form-label">Region Preset</label>
                <select className="form-select" value={s.regionPreset} onChange={(e) => update('regionPreset', e.target.value as RegionPreset)}>
                  <option value="global">Global</option>
                  <option value="us">US</option>
                  <option value="eu">EU</option>
                </select>
                <div className="form-help">{HELP_TEXT.regionPreset}</div>
              </div>
            </div>

            {/* KPI Weights Section */}
            <div className="settings-card">
              <h3>KPI Weights</h3>
              {Object.entries(s.kpiWeights).map(([key, value]) => (
                <div key={key} className="form-row">
                  <label className="form-label">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: {value}
                  </label>
                  <input
                    className="form-range"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={value}
                    onChange={(e) => updateKpiWeight(key as keyof KpiWeights, Number(e.target.value))}
                  />
                  <div className="form-help">{HELP_TEXT.kpiWeights[key as keyof typeof HELP_TEXT.kpiWeights]}</div>
                </div>
              ))}
            </div>

            {/* Verdict Thresholds Section */}
            <div className="settings-card">
              <h3>Verdict Thresholds</h3>
              <div className="form-help" style={{ marginBottom: '16px' }}>{HELP_TEXT.verdictThresholds}</div>
              {Object.entries(s.verdictThresholds).map(([category, [min, max]]) => (
                <div key={category} className="form-row">
                  <label className="form-label">
                    {category.toUpperCase()} ({min}-{max})
                  </label>
                  <div className="threshold-inputs">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={min}
                      onChange={(e) => updateVerdictThreshold(category as keyof VerdictThresholds, 0, Number(e.target.value))}
                      className="form-input threshold-input"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={max}
                      onChange={(e) => updateVerdictThreshold(category as keyof VerdictThresholds, 1, Number(e.target.value))}
                      className="form-input threshold-input"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Presets Section */}
            <div className="settings-card">
              <h3>Presets</h3>
              <div className="presets-grid">
                {Object.keys(PRESETS).map((presetName) => (
                  <div key={presetName} className="preset-item">
                    <button
                      className="btn btn-preset"
                      onClick={() => handlePresetApply(presetName as keyof typeof PRESETS)}
                    >
                      {presetName}
                    </button>
                    <div className="form-help">{HELP_TEXT.presets[presetName as keyof typeof HELP_TEXT.presets]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Health & External Signals */}
          <div className="settings-sidebar">
            <div className="settings-card">
              <h3>Health</h3>
              <div className="health-item">
                <span className="health-label">Coverage</span>
                <span className="health-chip health-good">85%</span>
              </div>
              <div className="health-item">
                <span className="health-label">Confidence</span>
                <span className="health-chip health-warn">Medium</span>
              </div>
              <div className="health-item">
                <span className="health-label">Last Refresh</span>
                <span className="health-text">2 mins ago</span>
              </div>
            </div>

            {/* External Signals Section */}
            <div className="settings-card">
              <h3>External Signals</h3>
              <div className="form-row">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={s.externalSignalsEnabled}
                    onChange={(e) => update('externalSignalsEnabled', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Enable Headlines & Trends
                </label>
              </div>
              <div className="form-help" style={{ marginBottom: '16px' }}>{HELP_TEXT.externalSignalsEnabled}</div>

              {s.externalSignalsEnabled && (
                <>
                  <div className="health-item">
                    <span className="health-label">Status</span>
                    <span className={`health-chip ${signalsStatus === 'ACTIVE' ? 'health-good' : signalsStatus === 'ERROR' ? 'health-error' : 'health-warn'}`}>
                      {signalsStatus === 'ACTIVE' ? 'Active' : signalsStatus === 'ERROR' ? 'Error' : 'Unknown'}
                    </span>
                  </div>
                  <div className="health-item">
                    <span className="health-label">Last Update</span>
                    <span className="health-text">
                      {signalsLastUpdate ? new Date(signalsLastUpdate).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  {signalsError && (
                    <div className="health-item">
                      <span className="health-label">Error</span>
                      <span className="health-text" style={{ color: 'var(--error)', fontSize: '12px' }}>
                        {signalsError}
                      </span>
                    </div>
                  )}
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '12px' }}
                    onClick={verifyExternalSignals}
                    disabled={verifying}
                  >
                    {verifying ? 'Verifying...' : 'Verify Now'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version Footer */}
      <div className="settings-footer">
        <span className="version-text">Version {version}</span>
      </div>
    </div>
  );
}