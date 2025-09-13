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

// Helper to normalize API payload to UI model
const normalizeToUi = (api: any) => {
    const result = api?.result || api;

    return {
        title: result?.title || 'Analysis Result',
        verdict: result?.verdict || 'HOLD',
        confidence: result?.confidence || 50,
        kpis: {
            availability: result?.kpis?.availability || 0,
            markdownTrend: result?.kpis?.markdownRisk || 0,
            diversification: result?.kpis?.diversification || 0,
            nikeDependency: Math.max(0, Math.min(100, 100 - (result?.kpis?.diversification || 0)))
        },
        explain: (result?.explain || []).map((item: any) => ({
            factor: item?.factor || 'Unknown',
            impact: item?.impact === 'positive' ? 'positive' :
                item?.impact === 'negative' ? 'negative' : 'neutral',
            note: item?.note || ''
        })),
        images: (result?.images || []).map((img: any) => ({
            url: typeof img === 'string' ? img : (img?.url || img?.src || ''),
            alt: typeof img === 'string' ? '' : (img?.alt || '')
        })).filter((img: any) => img.url)
    };
};

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
                // Quick analysis - call /api/quick
                const response = await fetch('/api/quick', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: targetQuery })
                });
                const data = await response.json();
                const normalized = normalizeToUi(data);
                setResult(normalized);

                // Update KPI state with normalized data
                setKpis({
                    availability: normalized.kpis.availability,
                    markdownPct: normalized.kpis.markdownTrend,
                    diversification: normalized.kpis.diversification,
                    dependency: normalized.kpis.nikeDependency
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
                const normalized = normalizeToUi(data);
                setResult(normalized);

                // Update KPI state with normalized data
                setKpis({
                    availability: normalized.kpis.availability,
                    markdownPct: normalized.kpis.markdownTrend,
                    diversification: normalized.kpis.diversification,
                    dependency: normalized.kpis.nikeDependency
                });
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
                        <div className="action-bar">
                            <div className="btn-group">
                                <button className="btn" onClick={() => runAnalysis('quick')} disabled={loading}>Run Quick</button>
                                <button className="btn btn-primary" onClick={() => runAnalysis('deep')} disabled={loading}>Run Deep</button>
                            </div>
                            <div className="pill-group">
                                <span className="pill">Model: {settings.model}</span>
                                <span className="pill">Temp: {settings.temperature.toFixed(2)}</span>
                                <span className="pill">Region: {settings.regionPreset}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results - Error States */}
                {error && (
                    <div className="card">
                        <h3>Results</h3>
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
                    </div>
                )}

                {/* Results - Loading & Empty States */}
                {!error && (loading || (!result && !loading)) && (
                    <div className="card">
                        <h3>Results</h3>
                        {loading && <div className="badge">Analyzing…</div>}
                        {!loading && !result && <div className="badge">No results yet. Try "Nike Dunk Low VS Jordan 1 for Fall denim".</div>}
                    </div>
                )}

                {/* Results - Verdict Card */}
                {!loading && !error && result && (
                    <section className="verdict-card">
                        {/* Header Row: Verdict Badge and Confidence */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span className={`badge ${(result.verdict || 'test').toLowerCase()}`}>
                                {result.verdict || 'TEST'}
                            </span>
                            <span className="pill">
                                {result.confidence || 50}% confidence
                            </span>
                        </div>

                        {/* Subheader */}
                        <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
                            Quick analysis for: <strong>{lastQuery || 'product analysis'}</strong>
                        </div>

                        {/* KPI Grid - Map data to 5 tiles */}
                        <div className="kpi-grid-5">
                            <KpiTile
                                label="Demand"
                                value={result.kpis?.availability || kpis.availability || 0}
                                suffix="%"
                                goodHigh
                            />
                            <KpiTile
                                label="Momentum"
                                value={result.kpis?.markdownTrend ? 100 - result.kpis.markdownTrend : (100 - (kpis.markdownPct || 0))}
                                suffix="%"
                                goodHigh
                            />
                            <KpiTile
                                label="Saturation"
                                value={result.kpis?.markdownTrend || kpis.markdownPct || 0}
                                suffix="%"
                                goodHigh={false}
                            />
                            <KpiTile
                                label="Freshness"
                                value={result.confidence || 75}
                                suffix="%"
                                goodHigh
                            />
                            <KpiTile
                                label="Style Fit"
                                value={result.kpis?.diversification || kpis.diversification || 0}
                                suffix="%"
                                goodHigh
                            />
                        </div>

                        {/* Why this verdict? Explanation List */}
                        {result.explain?.length && (
                            <div className="explain-list">
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Why this verdict?</h4>
                                <div>
                                    {result.explain.map((f: any, i: number) => (
                                        <div key={i} className={`explain-item tone-${f.impact || 'neutral'}`}>
                                            <strong>
                                                {f.impact === 'positive' ? '+' : f.impact === 'negative' ? '–' : '•'}
                                            </strong> {f.factor} — {f.note}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sources & Citations */}
                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Sources & Citations</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {result.sources?.length ? (
                                    result.sources.map((s: string, i: number) => (
                                        <a key={`${s}-${i}`}
                                            href="#"
                                            style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            {s === 'trends' ? 'External Signals' : s}
                                        </a>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Source: gemini</span>
                                )}
                            </div>
                        </div>

                        {/* Optional Images Strip */}
                        {result.images?.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <ImagesStrip
                                    images={result.images}
                                    onImageClick={(src) => window.open(src, '_blank', 'noopener,noreferrer')}
                                />
                                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', textAlign: 'center' }}>
                                    Images are illustrative; click to open source
                                </div>
                            </div>
                        )}
                    </section>
                )}
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