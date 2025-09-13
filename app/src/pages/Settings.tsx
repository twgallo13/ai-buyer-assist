import { useEffect, useState } from 'react';
import { getSettings, updateSettings, applyTheme, type Settings, type Theme, type RegionPreset } from '../lib/settings';
import '../styles/theme.css';

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
    <div className="app-container">
      <h1>Settings</h1>

      <div className="grid grid-12">
        {/* AI Model & Behavior */}
        <div className="card col-6">
          <h3>AI Model & Behavior</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label>Model:&nbsp;
                <select value={s.model} onChange={(e) => update('model', e.target.value as Settings['model'])}>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Flash is faster, Pro gives deeper analysis
              </div>
            </div>

            <div>
              <label>Temperature:&nbsp;
                <input type="range" min={0} max={1} step={0.05} value={s.temperature}
                  onChange={(e) => update('temperature', Number(e.target.value))} />
                <span className="badge">{s.temperature.toFixed(2)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Higher values make AI more creative and unpredictable
              </div>
            </div>

            <div>
              <label>Reasoning:&nbsp;
                <select value={s.reasoningLevel} onChange={(e) => update('reasoningLevel', e.target.value as 'basic' | 'detailed' | 'comprehensive')}>
                  <option value="basic">Basic</option>
                  <option value="detailed">Detailed</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Controls depth of explanation and factor analysis
              </div>
            </div>
          </div>
        </div>

        {/* Regional Preset */}
        <div className="card col-3">
          <h3>Regional Preset</h3>
          <div>
            <select value={s.regionPreset} onChange={(e) => update('regionPreset', e.target.value as RegionPreset)}>
              <option value="global">Global</option>
              <option value="us">US Market</option>
              <option value="eu">European Market</option>
              <option value="apac">APAC Market</option>
            </select>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              Adjusts trend analysis for regional preferences
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="card col-3">
          <h3>Theme</h3>
          <div>
            <select value={s.theme} onChange={(e) => update('theme', e.target.value as Theme)}>
              <option value="light">Light (Eggshell)</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              Interface appearance updates immediately
            </div>
          </div>
        </div>

        {/* Scoring Weights */}
        <div className="card col-6">
          <h3>Scoring Weights</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Demand:&nbsp;
                <input type="range" min={0.1} max={1} step={0.1} value={s.weights.demand}
                  onChange={(e) => updateWeights('demand', Number(e.target.value))} />
                <span className="badge">{s.weights.demand.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                How much market demand affects verdict scoring
              </div>
            </div>

            <div>
              <label>Momentum:&nbsp;
                <input type="range" min={0.1} max={1} step={0.1} value={s.weights.momentum}
                  onChange={(e) => updateWeights('momentum', Number(e.target.value))} />
                <span className="badge">{s.weights.momentum.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Importance of trend velocity in final scores
              </div>
            </div>

            <div>
              <label>Saturation:&nbsp;
                <input type="range" min={0.1} max={1} step={0.1} value={s.weights.saturation}
                  onChange={(e) => updateWeights('saturation', Number(e.target.value))} />
                <span className="badge">{s.weights.saturation.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                How much market competition affects recommendations
              </div>
            </div>

            <div>
              <label>Freshness:&nbsp;
                <input type="range" min={0.1} max={1} step={0.1} value={s.weights.freshness}
                  onChange={(e) => updateWeights('freshness', Number(e.target.value))} />
                <span className="badge">{s.weights.freshness.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Weight given to trend recency and novelty
              </div>
            </div>

            <div>
              <label>Style Fit:&nbsp;
                <input type="range" min={0.1} max={1} step={0.1} value={s.weights.styleFit}
                  onChange={(e) => updateWeights('styleFit', Number(e.target.value))} />
                <span className="badge">{s.weights.styleFit.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Impact of style alignment on final verdict
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Thresholds */}
        <div className="card col-6">
          <h3>Verdict Thresholds</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Demand Go:&nbsp;
                <input type="range" min={50} max={90} step={5} value={s.thresholds.demandGo}
                  onChange={(e) => updateThresholds('demandGo', Number(e.target.value))} />
                <span className="badge">{s.thresholds.demandGo}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Minimum demand score needed for Go verdict
              </div>
            </div>

            <div>
              <label>Momentum Go:&nbsp;
                <input type="range" min={40} max={80} step={5} value={s.thresholds.momentumGo}
                  onChange={(e) => updateThresholds('momentumGo', Number(e.target.value))} />
                <span className="badge">{s.thresholds.momentumGo}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Momentum threshold required for positive recommendation
              </div>
            </div>

            <div>
              <label>Freshness Go:&nbsp;
                <input type="range" min={30} max={70} step={5} value={s.thresholds.freshnessGo}
                  onChange={(e) => updateThresholds('freshnessGo', Number(e.target.value))} />
                <span className="badge">{s.thresholds.freshnessGo}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Freshness level required for Go classification
              </div>
            </div>

            <div>
              <label>Demand Hold:&nbsp;
                <input type="range" min={20} max={60} step={5} value={s.thresholds.demandHold}
                  onChange={(e) => updateThresholds('demandHold', Number(e.target.value))} />
                <span className="badge">{s.thresholds.demandHold}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Demand cutoff between Hold and Skip verdicts
              </div>
            </div>

            <div>
              <label>Momentum Hold:&nbsp;
                <input type="range" min={20} max={60} step={5} value={s.thresholds.momentumHold}
                  onChange={(e) => updateThresholds('momentumHold', Number(e.target.value))} />
                <span className="badge">{s.thresholds.momentumHold}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Momentum boundary for Hold vs Skip decisions
              </div>
            </div>

            <div>
              <label>Freshness Hold:&nbsp;
                <input type="range" min={15} max={50} step={5} value={s.thresholds.freshnessHold}
                  onChange={(e) => updateThresholds('freshnessHold', Number(e.target.value))} />
                <span className="badge">{s.thresholds.freshnessHold}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Freshness threshold for Hold classification
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Tweaks */}
        <div className="card col-12">
          <h3>Scenario Tweaks</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <label>Marketing Push:&nbsp;
                <input type="range" min={-1} max={1} step={0.1} value={s.scenario.marketingPush}
                  onChange={(e) => updateScenario('marketingPush', Number(e.target.value))} />
                <span className="badge">{s.scenario.marketingPush.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Adjusts for planned marketing campaigns (-1 to +1)
              </div>
            </div>

            <div>
              <label>Collaboration Frequency:&nbsp;
                <input type="range" min={0} max={1} step={0.1} value={s.scenario.collabFrequency}
                  onChange={(e) => updateScenario('collabFrequency', Number(e.target.value))} />
                <span className="badge">{s.scenario.collabFrequency.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Expected rate of brand collaborations and partnerships
              </div>
            </div>

            <div>
              <label>Price Sensitivity:&nbsp;
                <input type="range" min={0} max={1} step={0.1} value={s.scenario.priceSensitivity}
                  onChange={(e) => updateScenario('priceSensitivity', Number(e.target.value))} />
                <span className="badge">{s.scenario.priceSensitivity.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Market sensitivity to pricing changes and premium
              </div>
            </div>

            <div>
              <label>Macro Sentiment:&nbsp;
                <input type="range" min={-1} max={1} step={0.1} value={s.scenario.macroSentiment}
                  onChange={(e) => updateScenario('macroSentiment', Number(e.target.value))} />
                <span className="badge">{s.scenario.macroSentiment.toFixed(1)}</span>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Overall economic and consumer sentiment adjustment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}