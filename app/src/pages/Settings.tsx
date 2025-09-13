import { useEffect, useState } from 'react';
import { getSettings, setSettings, type Settings, type Theme, type RegionPreset, type ReasoningLevel } from '../lib/settings';
import { initTheme, applyTheme } from '../lib/theme';
import '../styles/theme.css';

export default function SettingsPage(){
  const [s, setS] = useState<Settings>(getSettings());

  useEffect(()=>{ initTheme(s.theme); }, []);
  function update<K extends keyof Settings>(k: K, v: Settings[K]){
    const merged = setSettings({ [k]: v } as Partial<Settings>);
    setS(merged);
    if (k === 'theme') applyTheme(v as Theme);
  }

  return (
    <div className="app-container">
      <h1>Settings</h1>

      <div className="grid grid-12">
        <div className="card col-8">
          <h3>AI Model</h3>
          <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <label>Model:&nbsp;
              <select value={s.model} onChange={(e)=>update('model', e.target.value as Settings['model'])}>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </label>
            <label>Temperature:&nbsp;
              <input type="range" min={0} max={1} step={0.05} value={s.temperature}
                     onChange={(e)=>update('temperature', Number(e.target.value))}/>
              <span className="badge">{s.temperature.toFixed(2)}</span>
            </label>
            <label>Reasoning:&nbsp;
              <select value={s.reasoning} onChange={(e)=>update('reasoning', e.target.value as ReasoningLevel)}>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="detailed">Detailed</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </label>
            <label>Region preset:&nbsp;
              <select value={s.region} onChange={(e)=>update('region', e.target.value as RegionPreset)}>
                <option value="global">Global</option>
                <option value="central-ca">Central CA</option>
                <option value="las-vegas">Las Vegas</option>
                <option value="tx-wa">TX / WA (out-of-market)</option>
              </select>
            </label>
            <label>Daily API cap:&nbsp;
              <input type="number" min={50} max={5000} step={50}
                     value={s.budgetCap} onChange={(e)=>update('budgetCap', Number(e.target.value))}/>
            </label>
          </div>
        </div>

        <div className="card col-4">
          <h3>Theme</h3>
          <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <select value={s.theme} onChange={(e)=>update('theme', e.target.value as Theme)}>
              <option value="light">Light (Eggshell)</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <span className="badge">Background changes instantly</span>
          </div>
        </div>
      </div>
    </div>
  );
}