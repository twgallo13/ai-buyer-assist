import React, { useState, useEffect, useRef } from 'react';
import KpiTile from '../components/KpiTile';
import { getApiHealth } from '../lib/env-health';
import { getSettings, subscribeSettings, applyTheme, type Settings } from '../lib/settings';

interface HomeProps {
    navigate: (path: string) => void;
    initialQuery?: string;
}

const Home: React.FC<HomeProps> = ({ navigate: _navigate, initialQuery = '' }) => {
    const [headlines, setHeadlines] = useState<Array<{ title: string; source: string }>>([]);
    const [headlinesLoading, setHeadlinesLoading] = useState(true);
    const [apiHealth, setApiHealth] = useState<{ ok: boolean; keyPresent: boolean } | null>(null);
    const [settings, setSettings] = useState<Settings>(getSettings());

    // Analysis state
    const [query, setQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const hasAutoRun = useRef(false);

    useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

    // Subscribe to settings changes
    useEffect(() => {
        const unsubscribe = subscribeSettings(setSettings);
        return unsubscribe;
    }, []);

    useEffect(() => {
        // Check API health on mount
        getApiHealth().then(health => {
            setApiHealth(health);
        });

        // Try to fetch headlines from /api/trends
        fetch('/api/trends?limit=5')
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data)) {
                    setHeadlines(data);
                }
                setHeadlinesLoading(false);
            })
            .catch(() => {
                setHeadlinesLoading(false);
            });
    }, []);

    // Auto-run Quick analysis if query param exists and hasn't run yet (Quick only)
    useEffect(() => {
        if (initialQuery && initialQuery.trim() && !hasAutoRun.current && !loading && !result) {
            hasAutoRun.current = true;
            runAnalysis('quick');
        }
    }, [initialQuery]);

    const runAnalysis = async (mode: 'quick' | 'deep') => {
        // Silently no-op if input is blank or empty
        if (!query || !query.trim()) {
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            if (mode === 'quick') {
                // Quick analysis - minimal mock
                setResult({
                    summary: 'Quick read from public trend signals.',
                    indices: { demand: 58, momentum: 55, saturation: 44, freshness: 53, styleFit: 61 },
                    sources: ['quick']
                });
            } else {
                // Deep analysis
                const body = {
                    query: query,
                    model: settings.model,
                    temperature: settings.temperature,
                    reasoningLevel: settings.reasoningLevel,
                    region: settings.regionPreset
                };
                const response = await fetch('/api/deep', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                setResult(data);
            }
        } catch (e: any) {
            setError('Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container grid grid-12">
            {/* LEFT: hero + results */}
            <div className="col-8">
                <div className="card" style={{ marginBottom: 16 }}>
                    {!apiHealth ? <span className="badge">Checking API health…</span> :
                        (!apiHealth.keyPresent ? <span className="badge">Running without Sales Anchors — AI will infer from public signals; confidence may be lower.</span> :
                            <span className="badge">API connected</span>)}
                    <div className="hr" />
                    <div style={{ display: 'grid', gap: 12 }}>
                        <textarea
                            placeholder="Paste SKU / product / brand / trend question…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ width: '100%', minHeight: 120, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn" onClick={() => runAnalysis('quick')} disabled={loading}>Run Quick</button>
                            <button className="btn primary" onClick={() => runAnalysis('deep')} disabled={loading}>Run Deep</button>
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
                        <div style={{ display: 'grid', gap: 20 }}>
                            {/* Decision Snapshot */}
                            <div><strong>{result.summary || 'Summary unavailable'}</strong></div>

                            {/* KPI Tiles */}
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

                            {/* Explain Card */}
                            {result.explain?.factors?.length && (
                                <div>
                                    <h4>Why this verdict?</h4>
                                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                                        {result.explain.factors.map((f: any, i: number) => (
                                            <li key={i} style={{ marginBottom: 8 }}>
                                                <strong>{f.impact}</strong> {f.label} — {f.note}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Images (only show if present) */}
                            {result.images && result.images.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Images</div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {result.images.map((img: any, i: number) => (
                                            <img
                                                key={i}
                                                src={img.url || img}
                                                alt={img.alt || `Result image ${i + 1}`}
                                                style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4, border: '1px solid var(--border)' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sources & Citations */}
                            <div>
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Sources</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {(result.sources || []).map((s: string, i: number) => (
                                        <span key={`${s}-${i}`} className="badge">
                                            {s === 'trends' ? 'External Signals' : s}
                                        </span>
                                    ))}
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
                    {headlinesLoading && <div className="badge">Loading…</div>}
                    {!headlinesLoading && (!headlines || headlines.length === 0) && <div className="badge">No headlines right now.</div>}
                    {!headlinesLoading && headlines && headlines.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {headlines.map((h, i) => (
                                <li key={i} style={{ marginBottom: 8 }}>
                                    <span style={{ color: 'var(--text)' }}>{h?.title || 'Untitled'}</span>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{h?.source || 'Unknown source'}</div>
                                </li>
                            ))}
                        </ul>
                    )}
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
};

export default Home;