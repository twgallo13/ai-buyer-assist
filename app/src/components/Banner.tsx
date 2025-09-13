import { useState } from 'react';

interface BannerProps {
    kind: 'info' | 'warn' | 'error';
    children: React.ReactNode;
    dismissible?: boolean;
}

const Banner: React.FC<BannerProps> = ({ kind, children, dismissible = false }) => {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const getColors = () => {
        switch (kind) {
            case 'info':
                return {
                    bg: '#dbeafe',
                    border: '#3b82f6',
                    text: '#1e40af',
                };
            case 'warn':
                return {
                    bg: '#fef3c7',
                    border: '#f59e0b',
                    text: '#92400e',
                };
            case 'error':
                return {
                    bg: '#fee2e2',
                    border: '#ef4444',
                    text: '#991b1b',
                };
            default:
                return {
                    bg: '#f3f4f6',
                    border: '#6b7280',
                    text: '#374151',
                };
        }
    };

    const colors = getColors();

    return (
        <div
            style={{
                backgroundColor: colors.bg,
                borderLeft: `4px solid ${colors.border}`,
                color: colors.text,
                padding: '0.75rem 1rem',
                borderRadius: '0 6px 6px 0',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1rem',
            }}
        >
            <div>{children}</div>
            {dismissible && (
                <button
                    onClick={() => setDismissed(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: colors.text,
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        lineHeight: 1,
                        padding: '0 0.25rem',
                        opacity: 0.7,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    aria-label="Dismiss"
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default Banner;