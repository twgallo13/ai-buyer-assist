import React, { useState } from 'react';

export interface SearchHeroProps {
    onRunQuick: (query: string, reasoningLevel: string, region: string) => void;
    onRunDeep: (query: string, reasoningLevel: string, region: string) => void;
    isLoading: boolean;
    disabled?: boolean;
}

const REASONING_OPTIONS = [
    { value: 'standard', label: 'Standard' },
    { value: 'brief', label: 'Brief' },
    { value: 'detailed', label: 'Detailed' }
];

const REGION_OPTIONS = [
    { value: 'central-ca', label: 'Central CA' },
    { value: 'las-vegas-nv', label: 'Las Vegas NV' },
    { value: 'tx-wa', label: 'TX/WA' }
];

const SearchHero: React.FC<SearchHeroProps> = ({
    onRunQuick,
    onRunDeep,
    isLoading,
    disabled = false
}) => {
    const [query, setQuery] = useState('');
    const [reasoningLevel, setReasoningLevel] = useState('standard');
    const [region, setRegion] = useState('central-ca');

    const handleRunQuick = () => {
        if (query.trim() && !isLoading && !disabled) {
            onRunQuick(query.trim(), reasoningLevel, region);
        }
    };

    const handleRunDeep = () => {
        if (query.trim() && !isLoading && !disabled) {
            onRunDeep(query.trim(), reasoningLevel, region);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleRunDeep(); // Default to deep analysis on Enter
        }
    };

    return (
        <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
        }}>
            {/* Search Input */}
            <div style={{ marginBottom: '1.5rem' }}>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Paste SKU / Product / Brand / Collection …"
                    rows={3}
                    disabled={isLoading || disabled}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.125rem',
                        borderRadius: '12px',
                        border: '2px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        fontFamily: 'inherit',
                        lineHeight: '1.5'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
            </div>

            {/* Controls Row */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleRunQuick}
                        disabled={!query.trim() || isLoading || disabled}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: (!query.trim() || isLoading || disabled) ? 'var(--muted)' : 'var(--border)',
                            color: (!query.trim() || isLoading || disabled) ? 'var(--bg)' : 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            cursor: (!query.trim() || isLoading || disabled) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            if (!(!query.trim() || isLoading || disabled)) {
                                e.currentTarget.style.backgroundColor = 'var(--muted)';
                                e.currentTarget.style.color = 'var(--bg)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!(!query.trim() || isLoading || disabled)) {
                                e.currentTarget.style.backgroundColor = 'var(--border)';
                                e.currentTarget.style.color = 'var(--text)';
                            }
                        }}
                    >
                        {isLoading ? 'Running...' : 'Run Quick'}
                    </button>

                    <button
                        onClick={handleRunDeep}
                        disabled={!query.trim() || isLoading || disabled}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: (!query.trim() || isLoading || disabled) ? 'var(--muted)' : 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: (!query.trim() || isLoading || disabled) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            if (!(!query.trim() || isLoading || disabled)) {
                                e.currentTarget.style.opacity = '0.9';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!(!query.trim() || isLoading || disabled)) {
                                e.currentTarget.style.opacity = '1';
                            }
                        }}
                    >
                        {isLoading ? 'Running...' : 'Run Deep'}
                    </button>
                </div>

                {/* Dropdowns */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--muted)'
                        }}>
                            Reasoning:
                        </label>
                        <select
                            value={reasoningLevel}
                            onChange={(e) => setReasoningLevel(e.target.value)}
                            disabled={isLoading || disabled}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--card)',
                                color: 'var(--text)',
                                fontSize: '0.875rem',
                                cursor: (isLoading || disabled) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {REASONING_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--muted)'
                        }}>
                            Region:
                        </label>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            disabled={isLoading || disabled}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--card)',
                                color: 'var(--text)',
                                fontSize: '0.875rem',
                                cursor: (isLoading || disabled) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {REGION_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchHero;