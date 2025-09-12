import { useMemo, useState } from 'react';
import { getCsvRows } from '../lib/csv-store';
import { getSettings, getCurrentWeights, getCurrentThresholds } from '../lib/settings';
import { computeQuickIndices, verdictFrom } from '../lib/verdict';

export default function ComparePage() {
    const rows = getCsvRows();
    const [a, setA] = useState<string>('');
    const [b, setB] = useState<string>('');
    const collections = useMemo(() =>
        Array.from(new Set(
            rows.map(r => String(r.collection || r.Collection || '').trim())
                .filter(Boolean)
        )).sort(),
        [rows]
    );
    const s = getSettings();

    const pick = (name: string) => rows.filter(r =>
        (String(r.collection || r.Collection || '').trim() === name)
    );

    const weights = getCurrentWeights();
    const thresholds = getCurrentThresholds();

    const ai = useMemo(() =>
        a ? computeQuickIndices(pick(a), weights, s.scenario) : null,
        [a, rows, weights, s.scenario]
    );

    const bi = useMemo(() =>
        b ? computeQuickIndices(pick(b), weights, s.scenario) : null,
        [b, rows, weights, s.scenario]
    );

    const aVerdict = ai ? verdictFrom(ai, thresholds) : null;
    const bVerdict = bi ? verdictFrom(bi, thresholds) : null;

    const handleOpenInAnalyze = (collection: string) => {
        // Store the query in session storage for the Analyze page to pick up
        sessionStorage.setItem('aba_prefill_query', `collection:"${collection}"`);
        // Navigate to analyze page (assuming router is available)
        window.location.hash = '#analyze';
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    textAlign: 'center'
                }}>
                    Collection Compare
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }}>
                    {[
                        { label: 'A', val: a, setter: setA, idx: ai, verdict: aVerdict },
                        { label: 'B', val: b, setter: setB, idx: bi, verdict: bVerdict }
                    ].map(({ label, val, setter, idx, verdict }) => (
                        <div key={label} style={{
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: 'var(--card)'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                opacity: 0.8,
                                marginBottom: '8px'
                            }}>
                                Collection {label}
                            </div>

                            <select
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'var(--text)',
                                    fontSize: '14px'
                                }}
                                value={val}
                                onChange={e => setter(e.target.value)}
                            >
                                <option value="">Select a collection…</option>
                                {collections.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            {idx && (
                                <>
                                    <div style={{
                                        marginTop: '16px',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(5, 1fr)',
                                        gap: '8px',
                                        textAlign: 'center',
                                        fontSize: '12px'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '10px', opacity: 0.7 }}>Demand</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#4CAF50' }}>
                                                {idx.demand}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', opacity: 0.7 }}>Momentum</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2196F3' }}>
                                                {idx.momentum}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', opacity: 0.7 }}>Saturation</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#FF5722' }}>
                                                {idx.saturation}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', opacity: 0.7 }}>Freshness</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#9C27B0' }}>
                                                {idx.freshness}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', opacity: 0.7 }}>StyleFit</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#FF9800' }}>
                                                {idx.styleFit}
                                            </div>
                                        </div>
                                    </div>

                                    {verdict && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '8px',
                                            textAlign: 'center',
                                            borderRadius: '4px',
                                            backgroundColor: verdict === 'Go' ? '#4CAF50' : verdict === 'Hold' ? '#FF9800' : '#f44336',
                                            color: '#fff',
                                            fontWeight: 'bold'
                                        }}>
                                            {verdict}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleOpenInAnalyze(val)}
                                        style={{
                                            marginTop: '12px',
                                            width: '100%',
                                            padding: '8px',
                                            backgroundColor: '#6366f1',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Open in Analyze
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {ai && bi && (
                    <div style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: 'var(--card)'
                    }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Side-by-side Comparison</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto repeat(5, 1fr)',
                            gap: '8px',
                            alignItems: 'center',
                            fontSize: '14px'
                        }}>
                            <div></div>
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Demand</div>
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Momentum</div>
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Saturation</div>
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Freshness</div>
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>StyleFit</div>

                            <div style={{ fontWeight: 'bold' }}>{a}</div>
                            <div style={{ textAlign: 'center' }}>{ai.demand}</div>
                            <div style={{ textAlign: 'center' }}>{ai.momentum}</div>
                            <div style={{ textAlign: 'center' }}>{ai.saturation}</div>
                            <div style={{ textAlign: 'center' }}>{ai.freshness}</div>
                            <div style={{ textAlign: 'center' }}>{ai.styleFit}</div>

                            <div style={{ fontWeight: 'bold' }}>{b}</div>
                            <div style={{ textAlign: 'center' }}>{bi.demand}</div>
                            <div style={{ textAlign: 'center' }}>{bi.momentum}</div>
                            <div style={{ textAlign: 'center' }}>{bi.saturation}</div>
                            <div style={{ textAlign: 'center' }}>{bi.freshness}</div>
                            <div style={{ textAlign: 'center' }}>{bi.styleFit}</div>
                        </div>
                    </div>
                )}

                {!collections.length && (
                    <div style={{
                        textAlign: 'center',
                        opacity: 0.7,
                        marginTop: '40px'
                    }}>
                        No CSV data loaded. Please upload a CSV file in the Analyze tab first.
                    </div>
                )}
            </div>
        </div>
    );
}