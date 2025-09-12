import { useState, useEffect } from 'react';
import { getSettings, subscribeSettings } from '../lib/settings';
import { getCsvRows, subscribeCsv, getCsvValidation } from '../lib/csv-store';
import { computeQuickIndices } from '../lib/verdict';

export default function TrendRadar() {
    const [settings, setSettings] = useState(getSettings());
    const [csvRows, setCsvRows] = useState(getCsvRows());
    const [indices, setIndices] = useState({ demand: 0, momentum: 0, saturation: 0, freshness: 0, styleFit: 0 });

    const validation = getCsvValidation();
    const csvIsValid = validation?.ok !== false;

    useEffect(() => {
        const unsubSettings = subscribeSettings(setSettings);
        const unsubCsv = subscribeCsv(setCsvRows);
        return () => {
            unsubSettings();
            unsubCsv();
        };
    }, []);

    useEffect(() => {
        if (csvRows.length > 0) {
            const newIndices = computeQuickIndices(csvRows, settings.weights, settings.scenario);
            setIndices(newIndices);
        }
    }, [csvRows, settings.weights, settings.scenario]);

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
        <div style={{ padding: '2rem', backgroundColor: '#0b0b0f', minHeight: '100vh' }}>
            <h2 style={{ color: '#f2f2f5', marginBottom: '2rem' }}>Trend Radar</h2>

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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {Object.entries(indices).map(([key, value]) => (
                            <div
                                key={key}
                                onClick={() => handleDrillDown(key)}
                                style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#14141a',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    border: '1px solid #333',
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
                                    color: '#f2f2f5',
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
                                    backgroundColor: '#333',
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
                                csv ({csvRows.length} rows)
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