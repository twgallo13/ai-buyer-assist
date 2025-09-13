import { useEffect, useState } from 'react';
import { getSettings, applyTheme } from '../lib/settings';
import KpiTile from '../components/KpiTile';
import '../styles/theme.css';

type Headline = { title: string; url: string; source: string; };

interface AnalyzeProps {
  initialQuery?: string;
}

export default function AnalyzePage({ initialQuery = '' }: AnalyzeProps) {
  const settings = getSettings();
  const [q, setQ] = useState(initialQuery);
  const [headlines, setHeadlines] = useState<Headline[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<{ ok: boolean; keyPresent: boolean } | null>(null);

  useEffect(() => { applyTheme(settings.theme); }, []);

  // health check for real key presence
  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(j => setHealth({ ok: !!j?.ok, keyPresent: !!j?.keyPresent })).catch(() => setHealth({ ok: false, keyPresent: false }));
  }, []);

  // headlines (right rail)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/trends?query=sneakers');
        const j = await r.json().catch(() => null);
        setHeadlines(Array.isArray(j?.items) ? j.items.slice(0, 6) : []);
      } catch { setHeadlines([]); }
    })();
  }, []);

  async function run(mode: 'quick' | 'deep') {
    setLoading(true); setError(null); setResult(null);
    try {
      if (mode === 'quick') {
        // Minimal quick mock (no CSV yet)
        setResult({ summary: 'Quick read from public trend signals.', indices: { demand: 58, momentum: 55, saturation: 44, freshness: 53, styleFit: 61 }, sources: ['quick'] });
      } else {
        const body = { query: q, model: settings.model, temperature: settings.temperature, reasoningLevel: settings.reasoningLevel, region: settings.regionPreset };
        const r = await fetch('/api/deep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const j = await r.json();
        setResult(j);
      }
    } catch (e: any) {
      setError('Analysis failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="app-container grid grid-12">
      {/* LEFT: hero + results */}
      <div className="col-8">
        <div className="card" style={{ marginBottom: 16 }}>
          {!health ? <span className="badge">Checking API health…</span> :
            (!health.keyPresent ? <span className="badge">Running without Sales Anchors — AI will infer from public signals; confidence may be lower.</span> :
              <span className="badge">API connected</span>)}
          <div className="hr" />
          <div style={{ display: 'grid', gap: 12 }}>
            <textarea
              placeholder="Paste SKU / product / brand / trend question…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: '100%', minHeight: 120, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={() => run('quick')} disabled={loading}>Run Quick</button>
              <button className="btn primary" onClick={() => run('deep')} disabled={loading}>Run Deep</button>
              <span className="badge">Model: {settings.model}</span>
              <span className="badge">Temp: {settings.temperature.toFixed(2)}</span>
              <span className="badge">Region: {settings.regionPreset}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Results</h3>
          {error && <div className="badge" style={{ borderColor: 'crimson', color: 'crimson' }}> {error} </div>}
          {loading && <div className="badge">Analyzing…</div>}
          {!loading && !error && !result && <div className="badge">No results yet. Try "Nike Dunk Low VS Jordan 1 for Fall denim".</div>}
          {!loading && result && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div><strong>{result.summary || 'Summary unavailable'}</strong></div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <KpiTile
                  label="Demand"
                  score={result.indices?.demand ?? 0}
                  tone={result.indices?.demand >= 70 ? 'good' : result.indices?.demand >= 40 ? 'warn' : 'risk'}
                  help="Market demand strength - higher scores indicate stronger consumer interest"
                />
                <KpiTile
                  label="Momentum"
                  score={result.indices?.momentum ?? 0}
                  tone={result.indices?.momentum >= 70 ? 'good' : result.indices?.momentum >= 40 ? 'warn' : 'risk'}
                  help="Trend velocity - measures how quickly interest is growing or declining"
                />
                <KpiTile
                  label="Saturation"
                  score={result.indices?.saturation ?? 0}
                  tone={result.indices?.saturation <= 40 ? 'good' : result.indices?.saturation <= 70 ? 'warn' : 'risk'}
                  help="Market saturation level - lower scores indicate less competition"
                />
                <KpiTile
                  label="Freshness"
                  score={result.indices?.freshness ?? 0}
                  tone={result.indices?.freshness >= 70 ? 'good' : result.indices?.freshness >= 40 ? 'warn' : 'risk'}
                  help="Trend freshness - newer trends score higher"
                />
                <KpiTile
                  label="Style Fit"
                  score={result.indices?.styleFit ?? 0}
                  tone={result.indices?.styleFit >= 70 ? 'good' : result.indices?.styleFit >= 40 ? 'warn' : 'risk'}
                  help="Style alignment with current trends and consumer preferences"
                />
              </div>
              <div className="hr" />
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Sources</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(result.sources || []).map((s: string) => (<span key={s} className="badge">{s}</span>))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: headlines + tips */}
      <div className="col-4">
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>AI Headlines</h3>
          {!headlines && <div className="badge">Loading…</div>}
          {headlines && headlines.length === 0 && <div className="badge">No headlines right now.</div>}
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {headlines?.map((h) => (
              <li key={h.url} style={{ marginBottom: 8 }}>
                <a href={h.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }}>{h.title}</a>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{h.source}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Tips</h3>
          <ul>
            <li>Paste SKU or catalog title.</li>
            <li>Add color/material terms.</li>
            <li>Use "vs" to compare styles.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}