import React from 'react';

interface DashboardShellProps {
    children: React.ReactNode;
    rightRail?: React.ReactNode;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ children, rightRail }) => {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)'
        }}>
            {/* Main Content Area */}
            <main style={{
                flex: 1,
                minWidth: 0, // Allows flex item to shrink below its content size
                padding: '2rem',
                maxWidth: rightRail ? 'calc(100% - 360px)' : '100%'
            }}>
                {children}
            </main>

            {/* Right Rail */}
            {rightRail && (
                <aside style={{
                    width: '360px',
                    flexShrink: 0,
                    backgroundColor: 'var(--card)',
                    borderLeft: '1px solid var(--border)',
                    padding: '2rem',
                    overflowY: 'auto'
                }}>
                    {rightRail}
                </aside>
            )}

            {/* Responsive: Stack on small screens */}
            <style>{`
                @media (max-width: 768px) {
                    div[style*="display: flex"] {
                        flex-direction: column;
                    }
                    main[style*="maxWidth"] {
                        max-width: 100% !important;
                    }
                    aside[style*="width: 360px"] {
                        width: 100% !important;
                        border-left: none !important;
                        border-top: 1px solid var(--border) !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default DashboardShell;