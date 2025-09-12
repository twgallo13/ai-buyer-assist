import React, {useEffect} from 'react';
import '../styles/theme.css';
import {applyTheme} from '../lib/theme';
import { useEffect as useEffectOrig, useState } from 'react';
import { getSettings, updateSettings, subscribeSettings, applyPreset, BUYER_PRESETS, type Settings, type BuyerPresetKey } from '../lib/settings';

export default function Settings(){
  const [s, setS] = useState<Settings>(getSettings());
  
  useEffectOrig(() => {
    return subscribeSettings(setS);
  }, []);
  
  useEffect(()=>{ applyTheme(s.theme || 'light'); },[s.theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: newTheme });
    applyTheme(newTheme);
  };

  return (
    <div style={{maxWidth:'1000px',margin:'0 auto',padding:'20px'}} className="space-y-4">
      <div className="card p-4">
        <div className="font-semibold mb-2">Theme</div>
        <select
          className="card p-2 w-full"
          value={s.theme}
          onChange={e => handleThemeChange(e.target.value as any)}
        >
          <option value="light">Light (Eggshell)</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
      
      <div className="card p-4">
        <div className="font-semibold mb-2">AI Model & Creativity</div>
        <div className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">Model</div>
            <select className="card p-2 w-full" value={s.model}
              onChange={e => updateSettings({ model: e.target.value })}>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
            </select>
          </label>
          <label className="block">
            <div className="text-sm mb-1">Temperature ({s.temperature})</div>
            <input type="range" min={0} max={1} step={0.05} value={s.temperature}
              onChange={e => updateSettings({ temperature: Number(e.target.value) })} className="w-full" />
          </label>
        </div>
      </div>
      
      <div className="card p-4">
        <div className="font-semibold mb-2">Buyer & Region</div>
        <div className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">Reasoning Level</div>
            <select className="card p-2 w-full" value={s.reasoningLevel}
              onChange={e => updateSettings({ reasoningLevel: e.target.value as any })}>
              <option value="basic">Basic</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </label>
          <label className="block">
            <div className="text-sm mb-1">Region Preset</div>
            <select className="card p-2 w-full" value={s.regionPreset}
              onChange={e => updateSettings({ regionPreset: e.target.value as any })}>
              <option value="global">Global</option>
              <option value="us">United States</option>
              <option value="eu">Europe</option>
              <option value="asia">Asia Pacific</option>
            </select>
          </label>
          <label className="block">
            <div className="text-sm mb-1">Default Mode</div>
            <select className="card p-2 w-full" value={s.defaultMode}
              onChange={e => updateSettings({ defaultMode: e.target.value as any })}>
              <option value="quick">Quick (CSV only)</option>
              <option value="deep">Deep (Gemini)</option>
            </select>
          </label>
        </div>
      </div>
      
      <div className="card p-4">
        <div className="font-semibold mb-2">Thresholds & Weights</div>
        <div className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">Budget cap (calls/day): {s.budgetCap}</div>
            <input type="range" min={50} max={5000} step={50} value={s.budgetCap}
              onChange={e => updateSettings({ budgetCap: Number(e.target.value) })} className="w-full" />
          </label>
          
          <div>
            <div className="text-sm mb-1">Buyer Presets</div>
            <select
              className="card p-2 w-full"
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
          </div>

          <div>
            <div className="text-sm mb-2">Thresholds (Go / Hold)</div>
            <div className="grid md:grid-cols-3 gap-3">
              {(['demand', 'momentum', 'freshness'] as const).map(k => (
                <div key={k} className="card p-3">
                  <div className="text-sm muted mb-2">{k.toUpperCase()}</div>
                  <label className="block mb-1">
                    <div className="text-xs">Go: {s.thresholds[`${k}Go` as const]}</div>
                    <input type="range" min={40} max={90} step={1}
                      value={s.thresholds[`${k}Go` as const]}
                      onChange={e => updateSettings({ thresholds: { ...s.thresholds, [`${k}Go`]: Number(e.target.value) } } as any)} className="w-full" />
                  </label>
                  <label className="block">
                    <div className="text-xs">Hold: {s.thresholds[`${k}Hold` as const]}</div>
                    <input type="range" min={30} max={80} step={1}
                      value={s.thresholds[`${k}Hold` as const]}
                      onChange={e => updateSettings({ thresholds: { ...s.thresholds, [`${k}Hold`]: Number(e.target.value) } } as any)} className="w-full" />
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-sm mb-2">Weights & Scenario</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-3">
                <div className="text-sm muted mb-2">Weights</div>
                {(['demand', 'momentum', 'saturation', 'freshness', 'styleFit'] as const).map(k => (
                  <label key={k} className="block mb-1">
                    <div className="text-xs capitalize">{k}: {s.weights[k]}</div>
                    <input type="range" min={0} max={1} step={0.05} value={s.weights[k]}
                      onChange={e => updateSettings({ weights: { ...s.weights, [k]: Number(e.target.value) } })} className="w-full" />
                  </label>
                ))}
              </div>
              <div className="card p-3">
                <div className="text-sm muted mb-2">Scenario</div>
                {(['marketingPush', 'collabFrequency', 'priceSensitivity', 'macroSentiment'] as const).map(k => (
                  <label key={k} className="block mb-1">
                    <div className="text-xs">{k}: {s.scenario[k]}</div>
                    <input type="range" min={0} max={1} step={0.05} value={s.scenario[k]}
                      onChange={e => updateSettings({ scenario: { ...s.scenario, [k]: Number(e.target.value) } })} className="w-full" />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="muted text-xs">Settings auto-save and are used as defaults in Analyze.</div>
    </div>
  );
}
