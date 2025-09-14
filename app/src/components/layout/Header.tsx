import React, { useState, useEffect } from 'react';
import ThemeToggle from '../ThemeToggle';
import { getApiVersion, getFallbackVersion } from '../../lib/api';

interface HeaderProps {
    currentPage: string;
    setCurrentPage: (page: 'home' | 'analyze' | 'trendradar' | 'compare' | 'batch' | 'settings' | 'sessions' | 'usage') => void;
    usage?: { deepCalls: number; budget: number } | null;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, usage }) => {
    const [version, setVersion] = useState<string>(getFallbackVersion());
    const [healthStatus, setHealthStatus] = useState<{ ok: boolean; keyPresent: boolean } | null>(null);

    useEffect(() => {
        // Use unified version API
        const loadVersion = async () => {
            const apiVersion = await getApiVersion();
            setVersion(apiVersion);
        };

        // Check API health on mount
        const fetchHealth = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch('/api/health', {
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                setHealthStatus({
                    ok: data.ok || false,
                    keyPresent: data.keyPresent || false
                });
            } catch (error) {
                // API is down or unreachable
                setHealthStatus({
                    ok: false,
                    keyPresent: false
                });
            }
        };

        loadVersion();
        fetchHealth();
    }, []);

    const navItems = [
        { key: 'home', label: 'Home' },
        { key: 'trendradar', label: 'Trends' },
        { key: 'compare', label: 'Compare' },
        { key: 'batch', label: 'Batch' },
        { key: 'settings', label: 'Settings' },
        { key: 'sessions', label: 'Sessions' },
        { key: 'usage', label: 'Usage' }
    ];

    return (
        <>
            {/* Health ribbon - shown when API is down or no API key */}
            {healthStatus && (!healthStatus.ok || !healthStatus.keyPresent) && (
                <div style={{
                    backgroundColor: '#fbbf24',
                    color: '#92400e',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textAlign: 'center',
                    padding: '0.25rem 1rem',
                    borderBottom: '1px solid #f59e0b',
                    position: 'sticky',
                    top: 0,
                    zIndex: 51
                }}>
                    {!healthStatus.keyPresent
                        ? '⚠️ GEMINI_API_KEY not configured - API features unavailable'
                        : '⚠️ API server unavailable - some features may not work'
                    }
                </div>
            )}
            <nav style={{
                backgroundColor: 'var(--card)',
                borderBottom: '1px solid var(--border)',
                position: 'sticky',
                top: healthStatus && (!healthStatus.ok || !healthStatus.keyPresent) ? '1.75rem' : 0,
                zIndex: 50
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        height: '4rem',
                        alignItems: 'center'
                    }}>
                        {/* Left side - App name and version */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 style={{
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                color: 'var(--text)',
                                margin: 0
                            }}>
                                AI Buyer Assist
                            </h1>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                color: 'var(--muted)',
                                backgroundColor: 'var(--bg)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)'
                            }}>
                                {version}
                            </span>
                        </div>

                        {/* Center - Navigation */}
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem'
                        }}>
                            {navItems.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setCurrentPage(key as any)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: currentPage === key ? 'var(--accent)' : 'transparent',
                                        color: currentPage === key ? 'white' : 'var(--text)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== key) {
                                            e.currentTarget.style.backgroundColor = 'var(--bg)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentPage !== key) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Right side - Usage and theme toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {usage && (
                                <span style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--muted)',
                                    fontWeight: '500'
                                }}>
                                    {usage.deepCalls}/{usage.budget} calls
                                </span>
                            )}
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Header;