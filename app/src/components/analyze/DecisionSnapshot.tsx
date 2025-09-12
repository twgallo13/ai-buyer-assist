import React from 'react';
import type { AnalysisResult } from '../../lib/types';

export interface DecisionSnapshotProps {
    result: AnalysisResult | null;
    isLoading: boolean;
    errorMessage?: string | null;
    onDismissError?: () => void;
}

const DecisionSnapshot: React.FC<DecisionSnapshotProps> = ({
    result,
    isLoading,
    errorMessage,
    onDismissError
}) => {
    // Show error banner if present
    if (errorMessage) {
        return (
            <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#dc2626',
                        marginBottom: '0.25rem'
                    }}>
                        Analysis Error
                    </div>
                    <div style={{
                        fontSize: '0.875rem',
                        color: '#7f1d1d'
                    }}>
                        {errorMessage}
                    </div>
                </div>
                {onDismissError && (
                    <button
                        onClick={onDismissError}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            padding: '0.25rem',
                            borderRadius: '4px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        ×
                    </button>
                )}
            </div>
        );
    }

    // Show loading state
    if (isLoading) {
        return (
            <div style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '0.5rem'
                }}>
                    Analyzing...
                </div>
                <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--muted)'
                }}>
                    Running AI analysis on your query
                </div>
                <div style={{
                    marginTop: '1rem',
                    height: '4px',
                    backgroundColor: 'var(--border)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        backgroundColor: 'var(--accent)',
                        borderRadius: '2px',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                </div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 0.5; transform: scaleX(0.5); }
                        50% { opacity: 1; transform: scaleX(1); }
                    }
                `}</style>
            </div>
        );
    }

    // Show empty state if no result
    if (!result) {
        return (
            <div style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '3rem 2rem',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem'
                }}>
                    🔍
                </div>
                <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--text)',
                    marginBottom: '0.75rem'
                }}>
                    Ready to analyze
                </div>
                <div style={{
                    fontSize: '1rem',
                    color: 'var(--muted)',
                    lineHeight: '1.5',
                    maxWidth: '400px',
                    margin: '0 auto'
                }}>
                    Enter a product, brand, SKU, or collection above and click <strong>Run Deep</strong> to get AI-powered market insights and decision recommendations.
                </div>
            </div>
        );
    }

    // Get verdict styling
    const getVerdictStyle = (verdict: string) => {
        const baseStyle = {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '700',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px'
        };

        switch (verdict.toLowerCase()) {
            case 'go':
                return { ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' };
            case 'hold':
                return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' };
            case 'skip':
                return { ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626' };
            default:
                return { ...baseStyle, backgroundColor: 'var(--border)', color: 'var(--text)' };
        }
    };

    // Show result
    return (
        <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
        }}>
            {/* Header with Verdict and Confidence */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <div style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--muted)',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Decision Snapshot
                    </div>
                    <div style={getVerdictStyle(result.verdict)}>
                        {result.verdict}
                    </div>
                </div>

                {result.confidence !== undefined && (
                    <div style={{
                        textAlign: 'right'
                    }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: 'var(--accent)',
                            lineHeight: '1'
                        }}>
                            {Math.round(result.confidence)}%
                        </div>
                        <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Confidence
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            {result.summary && (
                <div style={{
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    color: 'var(--text)',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                }}>
                    {result.summary}
                </div>
            )}

            {/* Indices */}
            {result.indices && (
                <div style={{
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--muted)',
                        marginBottom: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Market Indices
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '1rem'
                    }}>
                        {[
                            { key: 'demand', label: 'Demand', color: '#059669' },
                            { key: 'momentum', label: 'Momentum', color: '#2563eb' },
                            { key: 'freshness', label: 'Freshness', color: '#7c3aed' },
                            { key: 'saturation', label: 'Saturation', color: '#dc2626' },
                            { key: 'styleFit', label: 'Style-Fit', color: '#ea580c' }
                        ].map(({ key, label, color }) => {
                            const value = result.indices?.[key as keyof typeof result.indices] || 0;
                            return (
                                <div key={key} style={{
                                    textAlign: 'center',
                                    padding: '1rem',
                                    backgroundColor: 'var(--bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        color: color,
                                        marginBottom: '0.25rem'
                                    }}>
                                        {value}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--muted)',
                                        fontWeight: '500',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Badge Chips */}
            {result.sources && result.sources.length > 0 && (
                <div>
                    <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--muted)',
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Analysis Tags
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        {result.sources.map((source, index) => (
                            <span key={index} style={{
                                backgroundColor: 'var(--accent)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}>
                                {source}
                            </span>
                        ))}
                        {/* Add some example badge chips for demonstration */}
                        <span style={{
                            backgroundColor: '#059669',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                        }}>
                            West Coast
                        </span>
                        <span style={{
                            backgroundColor: '#7c3aed',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                        }}>
                            GS sizes
                        </span>
                        <span style={{
                            backgroundColor: '#ea580c',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                        }}>
                            Neutral palette
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecisionSnapshot;