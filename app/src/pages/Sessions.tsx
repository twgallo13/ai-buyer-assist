import { useState, useEffect } from 'react';
import { listSessions, deleteSession } from '../lib/sessions';
import type { SessionItem } from '../lib/sessions';

export default function SessionsPage() {
    const [sessions, setSessions] = useState<SessionItem[]>([]);

    const refreshSessions = () => {
        setSessions(listSessions());
    };

    useEffect(() => {
        refreshSessions();
    }, []);

    const handleDelete = (id: string) => {
        deleteSession(id);
        refreshSessions();
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0b0b0f',
            color: '#f2f2f5',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    textAlign: 'center'
                }}>
                    Saved Sessions
                </h2>

                {!sessions.length && (
                    <div style={{
                        textAlign: 'center',
                        opacity: 0.7,
                        marginTop: '40px',
                        fontSize: '16px'
                    }}>
                        No saved sessions yet. Save an analysis from the Analyze tab to see it here.
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            style={{
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '16px',
                                backgroundColor: '#14141a'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    fontSize: '12px',
                                    opacity: 0.7
                                }}>
                                    {s.timestamp ? new Date(s.timestamp).toLocaleString() : 'Unknown date'}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: s.verdict === 'Go' ? '#4CAF50' : s.verdict === 'Hold' ? '#FF9800' : s.verdict === 'Skip' ? '#f44336' : '#666',
                                    color: '#fff'
                                }}>
                                    {s.verdict || 'No verdict'}
                                </div>
                            </div>

                            <div style={{
                                fontWeight: 'medium',
                                fontSize: '16px',
                                marginBottom: '8px'
                            }}>
                                {s.summary}
                            </div>

                            <div style={{
                                fontSize: '12px',
                                opacity: 0.8,
                                marginBottom: '8px'
                            }}>
                                Sources: {s.sources.join(', ')}
                            </div>

                            {s.indices && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    padding: '8px',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    borderRadius: '4px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>Demand</div>
                                        <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                                            {s.indices.demand}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>Momentum</div>
                                        <div style={{ fontWeight: 'bold', color: '#2196F3' }}>
                                            {s.indices.momentum}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>Saturation</div>
                                        <div style={{ fontWeight: 'bold', color: '#FF5722' }}>
                                            {s.indices.saturation}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>Freshness</div>
                                        <div style={{ fontWeight: 'bold', color: '#9C27B0' }}>
                                            {s.indices.freshness}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>StyleFit</div>
                                        <div style={{ fontWeight: 'bold', color: '#FF9800' }}>
                                            {s.indices.styleFit}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {s.confidence && (
                                <div style={{
                                    fontSize: '12px',
                                    opacity: 0.8,
                                    marginBottom: '8px'
                                }}>
                                    Confidence: {s.confidence}%
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    style={{
                                        fontSize: '12px',
                                        padding: '4px 8px',
                                        backgroundColor: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#f2f2f5',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        navigator.clipboard?.writeText(JSON.stringify(s, null, 2))
                                            .then(() => alert('Session copied to clipboard!'))
                                            .catch(() => alert('Failed to copy'));
                                    }}
                                >
                                    Copy JSON
                                </button>
                                <button
                                    style={{
                                        fontSize: '12px',
                                        padding: '4px 8px',
                                        backgroundColor: '#f44336',
                                        border: 'none',
                                        color: '#fff',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        if (confirm('Delete this session?')) {
                                            handleDelete(s.id);
                                        }
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}