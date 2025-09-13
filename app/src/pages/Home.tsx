import React, { useState, useEffect } from 'react';
import VerdictCard from '../components/card/VerdictCard';
import Banner from '../components/Banner';
import { getApiHealth, getApiVersion } from '../lib/env-health';

interface HomeProps {
    navigate: (path: string) => void;
}

const Home: React.FC<HomeProps> = ({ navigate }) => {
    const [headlines, setHeadlines] = useState<Array<{ title: string; source: string }>>([]);
    const [headlinesLoading, setHeadlinesLoading] = useState(true);
    const [apiHealth, setApiHealth] = useState<{ ok: boolean; keyPresent: boolean } | null>(null);
    const [version, setVersion] = useState<string>('v2.1.1');

    useEffect(() => {
        // Check API health on mount
        getApiHealth().then(health => {
            setApiHealth(health);
        });

        // Fetch version (non-blocking)
        getApiVersion().then(v => {
            setVersion(v);
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

    const handleSearchAction = (query: string, mode: 'quick' | 'deep') => {
        if (!query.trim()) return;
        const encodedQuery = encodeURIComponent(query.trim());
        navigate(`/analyze?q=${encodedQuery}&mode=${mode}`);
    };

    // Sample verdict cards data
    const sampleVerdicts = [
        {
            title: 'Nike Air Force 1',
            verdict: 'BUY' as const,
            kpis: { demand: 85, competition: 72, momentum: 90, freshness: 45 },
            confidence: 87
        },
        {
            title: 'Sustainable Denim',
            verdict: 'TEST' as const,
            kpis: { demand: 65, competition: 40, momentum: 78, freshness: 92 },
            confidence: 72
        }
    ];

    const aiHighlights = [
        'Market momentum in athletic wear up 23% this week',
        'Sustainable materials trending across 5 categories',
        'Holiday shopping patterns suggest early inventory needs'
    ];

    return (
        <div style={{
            minHeight: 'calc(100vh - 4rem)',
            backgroundColor: 'var(--bg)',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Page Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'var(--text)',
                        marginBottom: '0.5rem'
                    }}>
                        Dashboard
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: 'var(--muted)',
                        margin: 0
                    }}>
                        Market intelligence and analysis at a glance
                    </p>
                </div>

                {/* API Health Banner */}
                {apiHealth && !apiHealth.keyPresent && (
                    <Banner kind="info" dismissible>
                        Running without AI key — using limited signals.
                    </Banner>
                )}                {/* Main Grid Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '2rem',
                    alignItems: 'start'
                }}>
                    {/* Main Content (8/12) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Search Hero */}
                        <div style={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '2rem'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: 'var(--text)',
                                marginBottom: '1rem'
                            }}>
                                Quick Analysis
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <textarea
                                    placeholder="Enter product, brand, or category to analyze..."
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--bg)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        resize: 'vertical',
                                        minHeight: '100px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    id="search-input"
                                />
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('search-input') as HTMLTextAreaElement;
                                            handleSearchAction(input.value, 'quick');
                                        }}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: 'var(--muted)',
                                            color: 'var(--text)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                                    >
                                        Run Quick
                                    </button>
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('search-input') as HTMLTextAreaElement;
                                            handleSearchAction(input.value, 'deep');
                                        }}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: 'var(--accent)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        Run Deep
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results Shelf */}
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: 'var(--text)',
                                marginBottom: '1rem'
                            }}>
                                Recent Analysis
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '1rem'
                            }}>
                                {sampleVerdicts.map((verdict, index) => (
                                    <VerdictCard
                                        key={index}
                                        title={verdict.title}
                                        verdict={verdict.verdict}
                                        kpis={verdict.kpis}
                                        confidence={verdict.confidence}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Rail (4/12) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* AI Highlights */}
                        <div style={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: 'var(--text)',
                                marginBottom: '1rem'
                            }}>
                                AI Highlights
                            </h3>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                            }}>
                                {aiHighlights.map((highlight, index) => (
                                    <li key={index} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--accent)',
                                            marginTop: '0.5rem',
                                            flexShrink: 0
                                        }} />
                                        <span style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--text)',
                                            lineHeight: '1.5'
                                        }}>
                                            {highlight}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Headlines */}
                        <div style={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: 'var(--text)',
                                marginBottom: '1rem'
                            }}>
                                Headlines
                            </h3>
                            {headlinesLoading ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'var(--muted)',
                                    fontSize: '0.875rem'
                                }}>
                                    <div style={{
                                        width: '1rem',
                                        height: '1rem',
                                        border: '2px solid var(--border)',
                                        borderTop: '2px solid var(--accent)',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    Loading headlines...
                                </div>
                            ) : headlines.length > 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    {headlines.map((headline, index) => (
                                        <div key={index} style={{
                                            paddingBottom: '0.75rem',
                                            borderBottom: index < headlines.length - 1 ? '1px solid var(--border)' : 'none'
                                        }}>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--text)',
                                                lineHeight: '1.4',
                                                marginBottom: '0.25rem'
                                            }}>
                                                {headline.title}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {headline.source}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    color: 'var(--muted)',
                                    fontSize: '0.875rem',
                                    fontStyle: 'italic'
                                }}>
                                    No headlines yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;