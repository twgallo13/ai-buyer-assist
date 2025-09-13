import { useEffect, useState } from 'react';
import { getSettings, updateSettings, applyTheme, type Settings, type Theme, type RegionPreset } from '../lib/settings';
import '../styles/theme.css';
import '../styles/settings.css';

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(getSettings());

  useEffect(() => { applyTheme(s.theme); }, []);

  function update<K extends keyof Settings>(k: K, v: Settings[K]) {
    const newSettings = { ...s, [k]: v };
    updateSettings({ [k]: v } as Partial<Settings>);
    setS(newSettings);
    if (k === 'theme') applyTheme(v as Theme);
  }

  function updateWeights(key: keyof Settings['weights'], value: number) {
    const newWeights = { ...s.weights, [key]: value };
    update('weights', newWeights);
  }

  function updateThresholds(key: keyof Settings['thresholds'], value: number) {
    const newThresholds = { ...s.thresholds, [key]: value };
    update('thresholds', newThresholds);
  }

  function updateScenario(key: keyof Settings['scenario'], value: number) {
    const newScenario = { ...s.scenario, [key]: value };
    update('scenario', newScenario);
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>

      <div className="settings-grid">
        {/* AI Model & Behavior */}
        <div className="settings-card">
          <h3>AI Model & Behavior</h3>
          
          <div className="form-row">
            <label className="form-label">Model</label>
            <select className="form-select" value={s.model} onChange={(e) => update('model', e.target.value as Settings['model'])}>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
            <div className="form-help">Flash is faster, Pro gives deeper analysis</div>
          </div>

          <div className="form-row">
            <label className="form-label">Temperature</label>
            <input className="form-range" type="range" min={0} max={1} step={0.05} value={s.temperature}
              onChange={(e) => update('temperature', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.temperature.toFixed(2)}</span>
            </div>
            <div className="form-help">Higher values make AI more creative and unpredictable</div>
          </div>

          <div className="form-row">
            <label className="form-label">Reasoning</label>
            <select className="form-select" value={s.reasoningLevel} onChange={(e) => update('reasoningLevel', e.target.value as 'basic' | 'detailed' | 'comprehensive')}>
              <option value="basic">Basic</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
            <div className="form-help">Controls depth of explanation and factor analysis</div>
          </div>
        </div>

        {/* Regional & Theme */}
        <div className="settings-card">
          <h3>Regional & Theme</h3>
          
          <div className="form-row">
            <label className="form-label">Regional Preset</label>
            <select className="form-select" value={s.regionPreset} onChange={(e) => update('regionPreset', e.target.value as RegionPreset)}>
              <option value="global">Global</option>
              <option value="us">US Market</option>
              <option value="eu">European Market</option>
              <option value="apac">APAC Market</option>
            </select>
            <div className="form-help">Adjusts trend analysis for regional preferences</div>
          </div>

          <div className="form-row">
            <label className="form-label">Theme</label>
            <select className="form-select" value={s.theme} onChange={(e) => update('theme', e.target.value as Theme)}>
              <option value="light">Light (Eggshell)</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <div className="form-help">Interface appearance updates immediately</div>
          </div>
        </div>

        {/* Scoring Weights */}
        <div className="settings-card">
          <h3>Scoring Weights</h3>
          
          <div className="form-row">
            <label className="form-label">Demand</label>
            <input className="form-range" type="range" min={0.1} max={1} step={0.1} value={s.weights.demand}
              onChange={(e) => updateWeights('demand', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.weights.demand.toFixed(1)}</span>
            </div>
            <div className="form-help">How much market demand affects verdict scoring</div>
          </div>

          <div className="form-row">
            <label className="form-label">Momentum</label>
            <input className="form-range" type="range" min={0.1} max={1} step={0.1} value={s.weights.momentum}
              onChange={(e) => updateWeights('momentum', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.weights.momentum.toFixed(1)}</span>
            </div>
            <div className="form-help">Importance of trend velocity in final scores</div>
          </div>

          <div className="form-row">
            <label className="form-label">Saturation</label>
            <input className="form-range" type="range" min={0.1} max={1} step={0.1} value={s.weights.saturation}
              onChange={(e) => updateWeights('saturation', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.weights.saturation.toFixed(1)}</span>
            </div>
            <div className="form-help">How much market competition affects recommendations</div>
          </div>

          <div className="form-row">
            <label className="form-label">Freshness</label>
            <input className="form-range" type="range" min={0.1} max={1} step={0.1} value={s.weights.freshness}
              onChange={(e) => updateWeights('freshness', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.weights.freshness.toFixed(1)}</span>
            </div>
            <div className="form-help">Weight given to trend recency and novelty</div>
          </div>

          <div className="form-row">
            <label className="form-label">Style Fit</label>
            <input className="form-range" type="range" min={0.1} max={1} step={0.1} value={s.weights.styleFit}
              onChange={(e) => updateWeights('styleFit', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.weights.styleFit.toFixed(1)}</span>
            </div>
            <div className="form-help">Impact of style alignment on final verdict</div>
          </div>
        </div>

        {/* Verdict Thresholds */}
        <div className="settings-card">
          <h3>Verdict Thresholds</h3>
          
          <div className="form-row">
            <label className="form-label">Demand Go</label>
            <input className="form-range" type="range" min={50} max={90} step={5} value={s.thresholds.demandGo}
              onChange={(e) => updateThresholds('demandGo', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.thresholds.demandGo}</span>
            </div>
            <div className="form-help">Minimum demand score needed for Go verdict</div>
          </div>

          <div className="form-row">
            <label className="form-label">Momentum Go</label>
            <input className="form-range" type="range" min={40} max={80} step={5} value={s.thresholds.momentumGo}
              onChange={(e) => updateThresholds('momentumGo', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.thresholds.momentumGo}</span>
            </div>
            <div className="form-help">Momentum threshold required for positive recommendation</div>
          </div>

          <div className="form-row">
            <label className="form-label">Freshness Go</label>
            <input className="form-range" type="range" min={30} max={70} step={5} value={s.thresholds.freshnessGo}
              onChange={(e) => updateThresholds('freshnessGo', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.thresholds.freshnessGo}</span>
            </div>
            <div className="form-help">Freshness level required for Go classification</div>
          </div>

          <div className="form-row">
            <label className="form-label">Demand Hold</label>
            <input className="form-range" type="range" min={20} max={60} step={5} value={s.thresholds.demandHold}
              onChange={(e) => updateThresholds('demandHold', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.thresholds.demandHold}</span>
            </div>
            <div className="form-help">Demand cutoff between Hold and Skip verdicts</div>
          </div>

          <div className="form-row">
            <label className="form-label">Momentum Hold</label>
            <input className="form-range" type="range" min={20} max={60} step={5} value={s.thresholds.momentumHold}
              onChange={(e) => updateThresholds('momentumHold', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.thresholds.momentumHold}</span>
            </div>
            <div className="form-help">Momentum boundary for Hold vs Skip decisions</div>
          </div>

          <div className="form-row">
            <label className="form-label">Freshness Hold</label>
            <input className="form-range" type="range" min={15} max={50} step={5} value={s.thresholds.freshnessHold}
              onChange={(e) => updateThresholds('freshnessHold', Number(e.target.value))} />
            <div className="preview-badges">
              <span className="preview-badge">{s.thresholds.freshnessHold}</span>
            </div>
            <div className="form-help">Freshness threshold for Hold classification</div>
          </div>
        </div>

        {/* Scenario Tweaks - spans 2 columns */}
        <div className="settings-card" style={{ gridColumn: 'span 2' }}>
          <h3>Scenario Tweaks</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="form-row">
              <label className="form-label">Marketing Push</label>
              <input className="form-range" type="range" min={-1} max={1} step={0.1} value={s.scenario.marketingPush}
                onChange={(e) => updateScenario('marketingPush', Number(e.target.value))} />
              <div className="preview-badges">
                <span className="preview-badge">{s.scenario.marketingPush.toFixed(1)}</span>
              </div>
              <div className="form-help">Adjusts for planned marketing campaigns (-1 to +1)</div>
            </div>

            <div className="form-row">
              <label className="form-label">Collaboration Frequency</label>
              <input className="form-range" type="range" min={0} max={1} step={0.1} value={s.scenario.collabFrequency}
                onChange={(e) => updateScenario('collabFrequency', Number(e.target.value))} />
              <div className="preview-badges">
                <span className="preview-badge">{s.scenario.collabFrequency.toFixed(1)}</span>
              </div>
              <div className="form-help">Expected rate of brand collaborations and partnerships</div>
            </div>

            <div className="form-row">
              <label className="form-label">Price Sensitivity</label>
              <input className="form-range" type="range" min={0} max={1} step={0.1} value={s.scenario.priceSensitivity}
                onChange={(e) => updateScenario('priceSensitivity', Number(e.target.value))} />
              <div className="preview-badges">
                <span className="preview-badge">{s.scenario.priceSensitivity.toFixed(1)}</span>
              </div>
              <div className="form-help">Market sensitivity to pricing changes and premium</div>
            </div>

            <div className="form-row">
              <label className="form-label">Macro Sentiment</label>
              <input className="form-range" type="range" min={-1} max={1} step={0.1} value={s.scenario.macroSentiment}
                onChange={(e) => updateScenario('macroSentiment', Number(e.target.value))} />
              <div className="preview-badges">
                <span className="preview-badge">{s.scenario.macroSentiment.toFixed(1)}</span>
              </div>
                            <div className="form-help">Overall economic and consumer sentiment adjustment</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}