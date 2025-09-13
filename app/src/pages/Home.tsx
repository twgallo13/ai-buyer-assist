import React, { useState, useEffect, useRef } from 'react';
import KpiTile from '../components/KpiTile';
import ImagesStrip from '../components/home/ImagesStrip';
import { getApiHealth } from '../lib/env-health';
import { getSettings, subscribeSettings, applyTheme, type Settings } from '../lib/settings';
import { getKpis, type Kpis } from '../lib/kpis';

interface HomeProps {
    navigate: (path: string) => void;
    initialQuery?: string;
}

const Home: React.FC<HomeProps> = ({ navigate: _navigate, initialQuery = '' }) => {
    const [headlines, setHeadlines] = useState<Array<{ title: string; source: string }>>([]);
    const [headlinesLoading, setHeadlinesLoading] = useState(true);
    const [apiHealth, setApiHealth] = useState<{ ok: boolean; keyPresent: boolean } | null>(null);
    const [settings, setSettings] = useState<Settings>(getSettings());

    // KPI state
    const [kpis, setKpis] = useState<Kpis>({});

    // Analysis state
    const [query, setQuery] = useState(initialQuery);
    const [lastQuery, setLastQuery] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<{ message: string; canRetry: boolean } | null>(null);
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

        // Load KPIs on mount
        getKpis().then(kpiData => {
            setKpis(kpiData);
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

    const runAnalysis = async (mode: 'quick' | 'deep', queryToAnalyze?: string) => {
        const targetQuery = queryToAnalyze || query;
        // Silently no-op if input is blank or empty
        if (!targetQuery || !targetQuery.trim()) {
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setLastQuery(targetQuery);

        try {
            if (mode === 'quick') {
                // Quick analysis - minimal mock with basic verdict logic
                const indices = { demand: 58, momentum: 55, saturation: 44, freshness: 53, styleFit: 61 };
                const avgScore = Object.values(indices).reduce((a, b) => a + b, 0) / Object.values(indices).length;
                const verdict = avgScore >= 60 ? 'Go' : avgScore >= 45 ? 'Hold' : 'Skip';
                const confidence = Math.round(50 + (avgScore - 50) * 0.8); // Scale confidence based on score
                
                setResult({
                    verdict,
                    confidence: Math.max(20, Math.min(95, confidence)),
                    summary: 'Quick read from public trend signals.',
                    indices,
                    sources: ['quick'],
                    explain: {
                        factors: [
                            { impact: avgScore >= 55 ? '+' : '-', label: 'Market Demand', note: `Average performance at ${avgScore.toFixed(0)}%` },
                            { impact: indices.saturation <= 50 ? '+' : '-', label: 'Market Saturation', note: `${indices.saturation}% market saturation` },
                            { impact: '~', label: 'Quick Analysis', note: 'Limited data sources - use Deep analysis for comprehensive insights' }
                        ]
                    }
                });
            } else {
                // Deep analysis
                const body = {
                    query: targetQuery,
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
            console.error('Analysis failed:', e);
            let errorMessage = 'Analysis failed. Please try again.';
            let canRetry = true;

            if (e.message?.includes('fetch')) {
                errorMessage = 'Network error. Check your connection and try again.';
            } else if (e.message?.includes('timeout')) {
                errorMessage = 'Request timed out. Please try again.';
            } else if (e.status === 429) {
                errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
            } else if (e.status === 401) {
                errorMessage = 'API authentication failed. Please check your settings.';
                canRetry = false;
            }

            setError({ message: errorMessage, canRetry });
        } finally {
            setLoading(false);
        }
    };

    const retryLastAnalysis = () => {
        if (lastQuery) {
            runAnalysis('deep', lastQuery);
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

                    {/* KPI Row */}
                    <div className="kpi-row">
                        <KpiTile label="Diversification" value={kpis.diversification} suffix="%" goodHigh />
                        <KpiTile label="Nike Dependency" value={kpis.dependency} suffix="%" goodHigh={false} />
                        <KpiTile label="Markdown Trend" value={kpis.markdownPct} suffix="%" goodHigh={false} />
                        <KpiTile label="Availability" value={kpis.availability} suffix="%" goodHigh />
                    </div>

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
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>{error.message}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {error.canRetry && (
                                    <button
                                        className="btn"
                                        style={{ fontSize: '12px', padding: '4px 8px' }}
                                        onClick={retryLastAnalysis}
                                    >
                                        Retry
                                    </button>
                                )}
                                <button
                                    className="btn"
                                    style={{ fontSize: '12px', padding: '4px 8px' }}
                                    onClick={() => window.location.href = '/settings'}
                                >
                                    Open Settings
                                </button>
                            </div>
                        </div>
                    )}
                    {loading && <div className="badge">Analyzing…</div>}
                    {!loading && !error && !result && <div className="badge">No results yet. Try "Nike Dunk Low VS Jordan 1 for Fall denim".</div>}
                    {!loading && result && (
                        <div style={{ display: 'grid', gap: 20 }}>
                            {/* Decision Snapshot */}
                            <div>
                                {result.verdict && (
                                    <div style={{ 
                                        display: 'inline-block',
                                        background: result.verdict === 'Go' ? '#10b981' : result.verdict === 'Hold' ? '#f59e0b' : '#ef4444',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        marginBottom: '8px',
                                        marginRight: '8px'
                                    }}>
                                        {result.verdict}
                                    </div>
                                )}
                                {result.confidence && (
                                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                        {result.confidence}% confidence
                                    </span>
                                )}
                                <div><strong>{result.summary || 'Summary unavailable'}</strong></div>
                            </div>

                            {/* KPI Tiles */}
                            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                                <KpiTile
                                    label="Demand"
                                    value={result.indices?.demand ?? 0}
                                    suffix="%"
                                    goodHigh={true}
                                />
                                <KpiTile
                                    label="Momentum"
                                    value={result.indices?.momentum ?? 0}
                                    suffix="%"
                                    goodHigh={true}
                                />
                                <KpiTile
                                    label="Saturation"
                                    value={result.indices?.saturation ?? 0}
                                    suffix="%"
                                    goodHigh={false}
                                />
                                <KpiTile
                                    label="Freshness"
                                    value={result.indices?.freshness ?? 0}
                                    suffix="%"
                                    goodHigh={true}
                                />
                                <KpiTile
                                    label="Style Fit"
                                    value={result.indices?.styleFit ?? 0}
                                    suffix="%"
                                    goodHigh={true}
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

                            {/* Images Strip */}
                            <ImagesStrip
                                images={result.images}
                                onImageClick={(src) => window.open(src, '_blank')}
                            />

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