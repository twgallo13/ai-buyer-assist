import React, { useState, useCallback, useEffect } from 'react';
import type { AnalysisResult } from '../lib/types';
import { saveSession } from '../lib/sessions';
import DashboardShell from '../components/layout/DashboardShell';
import SearchHero from '../components/analyze/SearchHero';
import DecisionSnapshot from '../components/analyze/DecisionSnapshot';
import {
    INTENT_OPTIONS,
    HORIZON_OPTIONS
} from '../lib/fallback-taxonomy';

// Load persisted mode or use settings default


const Analyze: React.FC = () => {
    const [mode, setMode] = useState<'quick' | 'deep'>('quick');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [showBudgetBanner, setShowBudgetBanner] = useState(false);
    const [showFallbackBanner, setShowFallbackBanner] = useState(false);
    const [showCacheBanner, setShowCacheBanner] = useState(false);
    const [showCapBanner, setShowCapBanner] = useState(false);
    const [isSharedView, setIsSharedView] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [remaining, setRemaining] = useState(10000);
    const [showMockBanner, setShowMockBanner] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Dashboard state for v2.0
    const [selectedIntent, setSelectedIntent] = useState<string>('question');
    const [selectedHorizon, setSelectedHorizon] = useState<number>(6);

    // URL params for shared sessions
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const runId = urlParams.get('run');
        if (runId) {
            setIsSharedView(true);
            fetchSharedResult(runId);
        }
    }, []);

    // Persist mode selection
    useEffect(() => {
        try {
            localStorage.setItem('aba_last_mode', mode);
        } catch { }
    }, [mode]);

    const fetchSharedResult = async (runId: string) => {
        try {
            const response = await fetch(`/api/shared/${runId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.result) {
                    setResult(data.result);

                }
            }
        } catch (e) {
            console.error('Failed to fetch shared result:', e);
        }
    };

    const handleRunQuick = useCallback(async (query: string, reasoningLevel: string, region: string) => {
        setIsLoading(true);
        setErrorMessage(null);
        setShowBudgetBanner(false);
        setShowFallbackBanner(false);
        setShowCacheBanner(false);
        setShowCapBanner(false);
        setShowMockBanner(false);

        try {
            // Quick mode - use fallback analysis
            const mockResult: AnalysisResult = {
                verdict: 'Go',
                demand: 75,
                momentum: 80,
                saturation: 45,
                freshness: 90,
                styleFit: 70,
                summary: `Based on market analysis of "${query}", this appears to be a trending category with moderate competition.`,
                runId: `quick_${Date.now()}`,
                confidence: 75,
                sources: ['mock', reasoningLevel, region],
                indices: {
                    demand: 75,
                    momentum: 80,
                    saturation: 45,
                    freshness: 90,
                    styleFit: 70
                },
                explain: {
                    mode: 'quick',
                    factors: [
                        { impact: '+', label: 'Market Demand', note: 'Strong consumer interest in this category' },
                        { impact: '-', label: 'Competition', note: 'Several established brands present' },
                        { impact: '+', label: 'Trend Momentum', note: 'Growing social media mentions' }
                    ]
                }
            };
            setResult(mockResult);
            setShowMockBanner(true);
        } catch (error) {
            console.error('Quick analysis failed:', error);
            setErrorMessage('Quick analysis failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleRunDeep = useCallback(async (query: string, reasoningLevel: string, region: string) => {
        setIsLoading(true);
        setErrorMessage(null);
        setShowBudgetBanner(false);
        setShowFallbackBanner(false);
        setShowCacheBanner(false);
        setShowCapBanner(false);
        setShowMockBanner(false);

        try {
            // Deep mode - API call
            const response = await fetch('/api/deep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    reasoningLevel,
                    region
                })
            });

            const data = await response.json();

            if (data.budgetExceeded || data.capped) {
                setShowBudgetBanner(true);
                setResult(data.fallback || {
                    verdict: 'Hold',
                    demand: 50,
                    momentum: 50,
                    saturation: 50,
                    freshness: 50,
                    styleFit: 50,
                    confidence: 30,
                    summary: 'Daily AI budget cap reached. Showing conservative fallback.',
                    sources: ['cap'],
                    indices: { demand: 50, momentum: 50, saturation: 50, freshness: 50, styleFit: 50 }
                });
            } else if (data.fromCache) {
                setShowCacheBanner(true);
                setResult(data);
            } else if (data.error) {
                setErrorMessage(data.error);
                if (data.fallback) {
                    setShowFallbackBanner(true);
                    setResult(data.fallback);
                }
            } else {
                // Convert server response to AnalysisResult format
                const result: AnalysisResult = {
                    verdict: data.verdict || 'Hold',
                    demand: data.indices?.demand || data.demand || 50,
                    momentum: data.indices?.momentum || data.momentum || 50,
                    saturation: data.indices?.saturation || data.saturation || 50,
                    freshness: data.indices?.freshness || data.freshness || 50,
                    styleFit: data.indices?.styleFit || data.styleFit || 50,
                    confidence: data.confidence,
                    summary: data.summary,
                    sources: data.sources,
                    indices: data.indices,
                    explain: data.explain,
                    runId: data.runId,
                    citations: data.citations
                };
                setResult(result);

                if (data.sources?.includes('mock')) {
                    setShowMockBanner(true);
                }
            }

            if (data.remaining !== undefined) {
                setRemaining(data.remaining);
            }
        } catch (error) {
            console.error('Deep analysis failed:', error);
            setErrorMessage('Deep analysis failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Main content
    const mainContent = (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
        }}>
            {/* Header */}
            <div>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    color: 'var(--text)'
                }}>
                    Analyze Market Opportunity
                </h1>
                <p style={{
                    fontSize: '1.125rem',
                    color: 'var(--muted)',
                    marginBottom: '2rem'
                }}>
                    Get AI-powered insights on market trends, competitive landscape, and opportunity assessment
                </p>
            </div>

            {/* Filters */}
            <div style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.5rem'
            }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Analysis Parameters</h3>

                {/* Intent Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text)'
                    }}>
                        Intent
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {INTENT_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedIntent(option.value)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: selectedIntent === option.value ? 'var(--accent)' : 'var(--card)',
                                    color: selectedIntent === option.value ? 'white' : 'var(--text)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Horizon Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text)'
                    }}>
                        Time Horizon
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                        {HORIZON_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedHorizon(option.value)}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: selectedHorizon === option.value ? 'var(--accent)' : 'var(--card)',
                                    color: selectedHorizon === option.value ? 'white' : 'var(--text)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode Toggle */}
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text)'
                    }}>
                        Analysis Mode
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['quick', 'deep'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: mode === m ? 'var(--accent)' : 'var(--card)',
                                    color: mode === m ? 'white' : 'var(--text)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {m} Analysis
                            </button>
                        ))}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                        marginTop: '0.5rem'
                    }}>
                        {mode === 'deep' ? `Budget: ${remaining}/10000 calls` : 'Uses fallback data (free)'}
                    </div>
                </div>
            </div>

            <SearchHero
                onRunQuick={handleRunQuick}
                onRunDeep={handleRunDeep}
                isLoading={isLoading}
            />

            {/* Results Display */}
            <DecisionSnapshot
                result={result}
                isLoading={isLoading}
                errorMessage={errorMessage}
                onDismissError={() => setErrorMessage(null)}
            />

            {/* Status Banners */}
            {result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                    {isSharedView && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#2196f3',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                        }}>
                            Viewing a shared session (read-only)
                        </div>
                    )}

                    {showMockBanner && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#ff9800',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                        }}>
                            Using mock response (no API key present)
                        </div>
                    )}

                    {showBudgetBanner && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#ff9800',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                        }}>
                            Daily budget limit reached - using mock response
                        </div>
                    )}

                    {showFallbackBanner && !showMockBanner && !showBudgetBanner && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                        }}>
                            API error - fell back to mock response
                        </div>
                    )}

                    {showCacheBanner && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#2196f3',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                        }}>
                            From cache - no API call made
                        </div>
                    )}

                    {showCapBanner && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#ff9800',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                        }}>
                            Daily AI budget cap reached. Showing conservative fallback.
                        </div>
                    )}

                    {errorMessage && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>{errorMessage}</span>
                            <button
                                onClick={() => setErrorMessage(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    padding: '0 5px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Main Result Card */}
                    <div style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '2rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1.5rem'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: 'var(--text)',
                                margin: 0,
                                flex: 1
                            }}>
                                Analysis Result
                            </h2>
                            {'confidence' in result && result.confidence !== undefined && (
                                <div style={{
                                    backgroundColor: 'var(--accent)',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                }}>
                                    {Math.round(result.confidence)}% Confidence
                                </div>
                            )}
                        </div>

                        <p style={{
                            fontSize: '1.125rem',
                            lineHeight: '1.6',
                            color: 'var(--text)',
                            marginBottom: result?.explain ? '2rem' : '1rem'
                        }}>
                            {result.summary}
                        </p>

                        {/* Market Indices */}
                        {mode === 'deep' && result.indices && (
                            <div style={{
                                marginBottom: '2rem',
                                padding: '1.5rem',
                                backgroundColor: 'var(--bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--border)'
                            }}>
                                <h4 style={{
                                    marginBottom: '1rem',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    fontWeight: '600'
                                }}>
                                    Market Indices
                                </h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {[
                                        { key: 'demand', label: 'Demand', color: '#4CAF50' },
                                        { key: 'momentum', label: 'Momentum', color: '#2196F3' },
                                        { key: 'saturation', label: 'Saturation', color: '#FF5722' },
                                        { key: 'freshness', label: 'Freshness', color: '#9C27B0' },
                                        { key: 'styleFit', label: 'Style Fit', color: '#FF9800' }
                                    ].map(({ key, label, color }) => {
                                        const value = result.indices?.[key as keyof typeof result.indices] || 0;

                                        return (
                                            <div key={key} style={{
                                                textAlign: 'center',
                                                padding: '1rem',
                                                backgroundColor: 'var(--card)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div style={{
                                                    fontSize: '2rem',
                                                    fontWeight: '700',
                                                    color: color,
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    {value}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.875rem',
                                                    color: 'var(--muted)',
                                                    fontWeight: '500'
                                                }}>
                                                    {label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Why Section */}
                        {result?.explain && (
                            <div style={{
                                padding: '1.5rem',
                                backgroundColor: 'var(--bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--border)'
                            }}>
                                <h4 style={{
                                    marginBottom: '1rem',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    fontWeight: '600'
                                }}>
                                    Why this verdict?
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    {result.explain.factors.map((f, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            gap: '0.75rem',
                                            alignItems: 'flex-start',
                                            padding: '0.75rem',
                                            backgroundColor: 'var(--card)',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: f.impact === '+' ? '#4CAF50' : f.impact === '-' ? '#f44336' : '#9e9e9e',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                flexShrink: 0
                                            }}>
                                                {f.impact}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    color: 'var(--text)',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {f.label}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.8125rem',
                                                    color: 'var(--muted)',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {f.note}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // Right rail content
    const rightRailContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{
                color: 'var(--text)',
                marginBottom: '1rem',
                fontSize: '1.125rem',
                fontWeight: '600'
            }}>
                Analysis Details
            </h3>

            {result?.sources && (
                <div style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1rem'
                }}>
                    <h4 style={{
                        fontSize: '0.875rem',
                        color: 'var(--muted)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.75rem'
                    }}>
                        Data Sources
                    </h4>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        {result.sources.map((source: string, index: number) => (
                            <span key={index} style={{
                                backgroundColor: 'var(--accent)',
                                color: '#fff',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}>
                                {source}
                            </span>
                        ))}
                        {result.sources.includes('trends') && (
                            <span style={{
                                backgroundColor: '#2196f3',
                                color: '#fff',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}>
                                + External Signals
                            </span>
                        )}
                    </div>
                </div>
            )}

            {result?.citations?.length ? (
                <div style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1rem'
                }}>
                    <h4 style={{
                        fontSize: '0.875rem',
                        color: 'var(--muted)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.75rem'
                    }}>
                        Citations
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.citations.map((c, i) => (
                            <div key={i} style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--card)',
                                borderRadius: '6px',
                                border: '1px solid var(--border)'
                            }}>
                                <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        color: 'var(--accent)',
                                        textDecoration: 'none',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        display: 'block',
                                        marginBottom: '0.25rem'
                                    }}
                                >
                                    {c.title}
                                </a>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--muted)'
                                }}>
                                    <span style={{
                                        backgroundColor: 'var(--muted)',
                                        color: 'var(--bg)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.625rem',
                                        fontWeight: '500',
                                        textTransform: 'uppercase'
                                    }}>
                                        {c.source}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {result && !isSharedView && (
                <div style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1rem'
                }}>
                    <h4 style={{
                        fontSize: '0.875rem',
                        color: 'var(--muted)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.75rem'
                    }}>
                        Export & Share
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                            onClick={() => {
                                if (result?.runId) {
                                    window.open(`/api/export?id=${result.runId}`, '_blank');
                                } else {
                                    window.open('/api/export?type=analyze', '_blank');
                                }
                            }}
                            style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                width: '100%'
                            }}
                        >
                            Export Report
                        </button>
                        <button
                            onClick={() => {
                                if (result?.runId) {
                                    const shareUrl = `${window.location.origin}${window.location.pathname}?run=${result.runId}`;
                                    navigator.clipboard.writeText(shareUrl);
                                    alert('Share link copied to clipboard!');
                                }
                            }}
                            disabled={!result?.runId}
                            style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: result?.runId ? '#059669' : '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: result?.runId ? 'pointer' : 'not-allowed',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                width: '100%'
                            }}
                        >
                            Copy Share Link
                        </button>
                        <button
                            onClick={() => {
                                const sessionId = saveSession(result);
                                alert(`Session saved! ID: ${sessionId}`);
                            }}
                            style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: 'var(--accent)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                width: '100%'
                            }}
                        >
                            Save Session
                        </button>
                    </div>
                </div>
            )}

            {!result && (
                <div style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--muted)',
                        lineHeight: '1.5'
                    }}>
                        Run an analysis to see detailed insights, citations, and export options here
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <DashboardShell rightRail={rightRailContent}>
            {mainContent}
        </DashboardShell>
    );
};

export default Analyze;