import React from 'react';

interface VerdictCardProps {
    title: string;
    verdict: 'PASS' | 'TEST' | 'BUY' | 'AGGRESSIVE';
    kpis: Record<string, number>;
    confidence?: number;
}

const VerdictCard: React.FC<VerdictCardProps> = ({ title, verdict, kpis, confidence }) => {
    const getVerdictColor = (verdict: string) => {
        switch (verdict) {
            case 'PASS': return '#10b981'; // green
            case 'TEST': return '#f59e0b'; // yellow
            case 'BUY': return '#3b82f6'; // blue
            case 'AGGRESSIVE': return '#ef4444'; // red
            default: return '#6b7280'; // gray
        }
    };

    const getVerdictBg = (verdict: string) => {
        switch (verdict) {
            case 'PASS': return '#dcfce7'; // green bg
            case 'TEST': return '#fef3c7'; // yellow bg
            case 'BUY': return '#dbeafe'; // blue bg
            case 'AGGRESSIVE': return '#fee2e2'; // red bg
            default: return '#f3f4f6'; // gray bg
        }
    };

    return (
        <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
            }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--text)',
                    margin: 0,
                    lineHeight: '1.4'
                }}>
                    {title}
                </h3>
                <div style={{
                    backgroundColor: getVerdictBg(verdict),
                    color: getVerdictColor(verdict),
                    padding: '0.25rem 0.75rem',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {verdict}
                </div>
            </div>

            {/* KPIs Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginBottom: confidence ? '1rem' : '0'
            }}>
                {Object.entries(kpis).map(([key, value]) => (
                    <div key={key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{
                            fontSize: '0.875rem',
                            color: 'var(--muted)',
                            textTransform: 'capitalize'
                        }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'var(--text)'
                        }}>
                            {typeof value === 'number' ? Math.round(value) : value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Confidence */}
            {confidence && (
                <div style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--muted)'
                    }}>
                        Confidence
                    </span>
                    <span style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: 'var(--text)'
                    }}>
                        {confidence}%
                    </span>
                </div>
            )}
        </div>
    );
};

export default VerdictCard;