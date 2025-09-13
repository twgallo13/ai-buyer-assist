import React from 'react';

interface KpiTileProps {
    label: string;
    score: number;
    help?: string;
    tone?: 'good' | 'warn' | 'risk';
}

const KpiTile: React.FC<KpiTileProps> = ({ label, score, help, tone = 'good' }) => {
    const getToneStyles = () => {
        switch (tone) {
            case 'good':
                return {
                    borderColor: '#22c55e',
                    topBarColor: '#22c55e'
                };
            case 'warn':
                return {
                    borderColor: '#eab308',
                    topBarColor: '#eab308'
                };
            case 'risk':
                return {
                    borderColor: '#ef4444',
                    topBarColor: '#ef4444'
                };
            default:
                return {
                    borderColor: '#6b7280',
                    topBarColor: '#6b7280'
                };
        }
    };

    const { borderColor, topBarColor } = getToneStyles();

    return (
        <div
            title={help}
            style={{
                backgroundColor: '#1a1a1a',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                position: 'relative',
                minWidth: '120px',
                cursor: help ? 'help' : 'default'
            }}
        >
            {/* Top accent bar */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: topBarColor,
                    borderRadius: '8px 8px 0 0'
                }}
            />

            {/* Score */}
            <div
                style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '8px',
                    lineHeight: 1
                }}
            >
                {Math.round(score)}
            </div>

            {/* Label */}
            <div
                style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '500'
                }}
            >
                {label}
            </div>
        </div>
    );
};

export default KpiTile;