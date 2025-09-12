import { useState, useEffect } from 'react';
import { getSettings, subscribeSettings, getCurrentWeights } from '../lib/settings';
import { getCsvRows, subscribeCsv, getCsvValidation } from '../lib/csv-store';
import { computeQuickIndices } from '../lib/verdict';
import { getUniqueColorTags, filterRowsByColorTags, groupColorTagsByPalette, getPaletteColor, type PaletteGroup } from '../lib/color-palette';

export default function TrendRadar() {
    const [settings, setSettings] = useState(getSettings());
    const [csvRows, setCsvRows] = useState(getCsvRows());
    const [indices, setIndices] = useState({ demand: 0, momentum: 0, saturation: 0, freshness: 0, styleFit: 0 });
    const [selectedColorTags, setSelectedColorTags] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'radar' | 'palette'>('radar');

    const validation = getCsvValidation();
    const csvIsValid = validation?.ok !== false;

    // Get unique color tags and palette groups from current dataset
    const uniqueColorTags = getUniqueColorTags(csvRows);
    const paletteGroups = groupColorTagsByPalette(uniqueColorTags);
    const filteredRows = filterRowsByColorTags(csvRows, selectedColorTags);

    useEffect(() => {
        const unsubSettings = subscribeSettings(setSettings);
        const unsubCsv = subscribeCsv(setCsvRows);
        return () => {
            unsubSettings();
            unsubCsv();
        };
    }, []);

    useEffect(() => {
        const rowsToAnalyze = selectedColorTags.length > 0 ? filteredRows : csvRows;
        if (rowsToAnalyze.length > 0) {
            const weights = getCurrentWeights();
            const newIndices = computeQuickIndices(rowsToAnalyze, weights, settings.scenario);
            setIndices(newIndices);
        }
    }, [csvRows, settings, selectedColorTags, filteredRows]);

    const getColorForValue = (value: number) => {
        if (value >= 70) return '#22c55e'; // green
        if (value >= 50) return '#eab308'; // yellow  
        return '#ef4444'; // red
    };

    const handleDrillDown = (metric: string) => {
        // This would integrate with navigation to Analyze page
        console.log(`Drill down into ${metric}`);
    };

    return (
        <div style={{ padding: '2rem', backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '2rem' }}>Trend Radar</h2>

            {/* View Mode Toggle */}
            {csvIsValid && uniqueColorTags.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setViewMode('radar')}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: viewMode === 'radar' ? 'var(--accent)' : 'var(--card)',
                                color: 'var(--text)',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                            }}
                        >
                            Trend Radar
                        </button>
                        <button
                            onClick={() => setViewMode('palette')}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: viewMode === 'palette' ? 'var(--accent)' : 'var(--card)',
                                color: 'var(--text)',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                            }}
                        >
                            Palette Heatmap
                        </button>
                    </div>

                    {/* Color Tag Filter */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ color: 'var(--text)', display: 'block', marginBottom: '0.5rem' }}>
                            Filter by Colors:
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {uniqueColorTags.slice(0, 20).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        setSelectedColorTags(prev =>
                                            prev.includes(tag)
                                                ? prev.filter(t => t !== tag)
                                                : [...prev, tag]
                                        );
                                    }}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: selectedColorTags.includes(tag) ? 'var(--accent)' : 'var(--card)',
                                        color: 'var(--text)',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                            {selectedColorTags.length > 0 && (
                                <button
                                    onClick={() => setSelectedColorTags([])}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: '#ef4444',
                                        color: '#f2f2f5',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        {selectedColorTags.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                                Showing {filteredRows.length} of {csvRows.length} rows
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CSV Validation Banner */}
            {!csvIsValid && (
                <div style={{
                    backgroundColor: '#f44336',
                    color: '#fff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem'
                }}>
                    <strong>CSV Missing Required Headers:</strong> Trend analysis requires valid CSV data with required headers.
                </div>
            )}

            {csvIsValid ? (
                <>
                    {viewMode === 'radar' ? (
                        // Traditional Trend Radar View
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            {Object.entries(indices).map(([key, value]) => (
                                <div
                                    key={key}
                                    onClick={() => handleDrillDown(key)}
                                    style={{
                                        padding: '1.5rem',
                                        backgroundColor: 'var(--card)',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        border: '1px solid var(--border)',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <h3 style={{
                                        color: 'var(--text)',
                                        margin: '0 0 1rem 0',
                                        textTransform: 'capitalize'
                                    }}>
                                        {key}
                                    </h3>
                                    <div style={{
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        color: getColorForValue(value)
                                    }}>
                                        {Math.round(value)}
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: 'var(--border)',
                                        borderRadius: '4px',
                                        marginTop: '1rem',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${value}%`,
                                            height: '100%',
                                            backgroundColor: getColorForValue(value),
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Palette Heatmap View
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Color Palette Distribution</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                {Object.entries(paletteGroups).map(([palette, tags]) => (
                                    <div
                                        key={palette}
                                        style={{
                                            padding: '1rem',
                                            backgroundColor: 'var(--card)',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <div
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    backgroundColor: getPaletteColor(palette as PaletteGroup),
                                                    borderRadius: '50%',
                                                    marginRight: '0.5rem'
                                                }}
                                            />
                                            <h4 style={{ color: '#f2f2f5', margin: 0, textTransform: 'capitalize' }}>
                                                {palette} ({tags.length})
                                            </h4>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                            {tags.slice(0, 10).map(tag => (
                                                <span
                                                    key={tag}
                                                    onClick={() => {
                                                        setSelectedColorTags(prev =>
                                                            prev.includes(tag)
                                                                ? prev.filter(t => t !== tag)
                                                                : [...prev, tag]
                                                        );
                                                    }}
                                                    style={{
                                                        padding: '0.125rem 0.25rem',
                                                        backgroundColor: selectedColorTags.includes(tag) ? '#10b981' : '#374151',
                                                        color: '#f2f2f5',
                                                        borderRadius: '0.125rem',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {tags.length > 10 && (
                                                <span style={{
                                                    color: '#9ca3af',
                                                    fontSize: '0.75rem',
                                                    padding: '0.125rem 0.25rem'
                                                }}>
                                                    +{tags.length - 10} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginTop: '1rem'
                    }}>
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Sources:</span>
                        {csvRows.length > 0 ? (
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem'
                            }}>
                                csv ({selectedColorTags.length > 0 ? filteredRows.length : csvRows.length} rows)
                            </span>
                        ) : (
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#64748b',
                                color: 'white',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem'
                            }}>
                                no data
                            </span>
                        )}
                        <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                        }}>
                            quick analysis
                        </span>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                        Note: External signals available with Deep analysis in Analyze page
                    </div>
                </>
            ) : (
                <div style={{
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '1.125rem',
                    marginTop: '3rem'
                }}>
                    Please upload a valid CSV file to see trend analysis.
                </div>
            )}
        </div>
    );
}