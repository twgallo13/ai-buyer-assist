import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Row } from '../types';
import type { AnalysisResult } from '../lib/types';
import { getSettings } from '../lib/settings';
import { computeQuickIndices, verdictFrom, explainQuick } from '../lib/verdict';
import { getCsvRows, setCsv, setCsvRows, subscribeCsv, getCsvValidation } from '../lib/csv-store';
import { saveSession } from '../lib/sessions';
import { validateCsv } from '../lib/csv-validate';
import { uniqueValues, buildQuery, type QueryParts } from '../lib/query-builder';
import {
    INTENT_OPTIONS,
    HORIZON_OPTIONS
} from '../lib/fallback-taxonomy';

// Load persisted mode or use settings default
function getLastMode(): 'quick' | 'deep' {
    try {
        const stored = localStorage.getItem('aba_last_mode');
        if (stored && (stored === 'quick' || stored === 'deep')) {
            return stored;
        }
    } catch { }
    return getSettings().defaultMode;
}

const Analyze: React.FC = () => {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'quick' | 'deep'>(getLastMode());
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [csvRows, setCsvRowsLocal] = useState<any[]>(getCsvRows());
    const [showBudgetBanner, setShowBudgetBanner] = useState(false);
    const [showFallbackBanner, setShowFallbackBanner] = useState(false);
    const [showCacheBanner, setShowCacheBanner] = useState(false);
    const [showCapBanner, setShowCapBanner] = useState(false);
    const [isSharedView, setIsSharedView] = useState(false);

    // CSV state  
    const [isLoading, setIsLoading] = useState(false);
    const [remaining, setRemaining] = useState(10000);
    const [showMockBanner, setShowMockBanner] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [previewRows, setPreviewRows] = useState<Row[]>([]);

    // Guided Query Builder state
    const [showQueryBuilder, setShowQueryBuilder] = useState(false);
    const [queryParts, setQueryParts] = useState<QueryParts>({});

    // Dashboard state for v1.9.6
    const [selectedIntent, setSelectedIntent] = useState<string>('question');
    const [selectedHorizon, setSelectedHorizon] = useState<number>(6);

    // Memoized unique values for dropdowns
    const collections = useMemo(() => uniqueValues('Collection'), [csvRows]);
    const categories = useMemo(() => uniqueValues('Category'), [csvRows]);
    const colors = useMemo(() => uniqueValues('Color Family'), [csvRows]);
    const genders = useMemo(() => uniqueValues('Gender Target'), [csvRows]);

    // CSV validation
    const validation = getCsvValidation();
    const csvIsValid = validation?.ok !== false;

    // Check for shared run on load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const runId = urlParams.get('run');
        if (runId) {
            setIsSharedView(true);
            fetch(`/api/runs/${runId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.ok && data.run) {
                        setInput(data.run.query);
                        setMode(data.run.mode);
                        setResult(data.run.result);
                    }
                })
                .catch(() => {
                    // Handle error silently
                });
        }
    }, []);
    const hasWarnings = validation && validation.issues.length > 0;

    // Subscribe to CSV changes
    useEffect(() => {
        const unsubscribe = subscribeCsv((newRows) => {
            setCsvRowsLocal(newRows);
        });
        return unsubscribe;
    }, []);

    // Check for prefilled query from Compare page
    useEffect(() => {
        try {
            const prefill = sessionStorage.getItem('aba_prefill_query');
            if (prefill) {
                setInput(prefill);
                sessionStorage.removeItem('aba_prefill_query');
            }
        } catch {
            // Ignore session storage errors
        }
    }, []);

    // Persist mode changes
    const handleModeChange = (newMode: 'quick' | 'deep') => {
        setMode(newMode);
        try {
            localStorage.setItem('aba_last_mode', newMode);
        } catch {
            // Ignore storage errors
        }
    };
    const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
    const [csvLoaded, setCsvLoaded] = useState(false);
    const [includedRowsCount, setIncludedRowsCount] = useState(0);

    const expectedHeaders = [
        'SKU', 'Product Name', 'Collection', 'Category', 'Class',
        'Velocity Units/Day', 'Historic Sell-through 28d', 'Historic Sell-through 90d', 'Color Family'
    ];

    const parseCSV = useCallback((csvText: string): Row[] => {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const headerMap: { [key: string]: number } = {};
        headers.forEach((header, index) => {
            headerMap[header.toLowerCase()] = index;
        });

        const missing: string[] = [];
        const headerLookup = {
            sku: ['sku'],
            productName: ['product name', 'productname'],
            collection: ['collection'],
            category: ['category'],
            class: ['class'],
            velocityUnitsPerDay: ['velocity units/day', 'velocity'],
            st28: ['historic sell-through 28d', 'st28'],
            st90: ['historic sell-through 90d', 'st90'],
            colorFamily: ['color family', 'colorfamily']
        };

        Object.entries(headerLookup).forEach(([field, variants]) => {
            const found = variants.some(variant =>
                Object.keys(headerMap).some(header => header.includes(variant.toLowerCase()))
            );
            if (!found && field !== 'colorFamily') {
                const originalName = expectedHeaders.find(h =>
                    h.toLowerCase().replace(/[^a-z]/g, '') === field.toLowerCase()
                ) || field;
                missing.push(originalName);
            }
        });

        setMissingHeaders(missing);

        const parsedRows: Row[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

            let sku = '';
            for (const variant of headerLookup.sku) {
                const headerIndex = Object.keys(headerMap).find(h => h.includes(variant));
                if (headerIndex !== undefined) {
                    sku = values[headerMap[headerIndex]] || '';
                    break;
                }
            }

            if (!sku) continue;

            const row: Row = { sku };

            const findValue = (variants: string[]) => {
                for (const variant of variants) {
                    const headerIndex = Object.keys(headerMap).find(h => h.includes(variant));
                    if (headerIndex !== undefined) {
                        return values[headerMap[headerIndex]] || undefined;
                    }
                }
                return undefined;
            };

            row.productName = findValue(headerLookup.productName);
            row.collection = findValue(headerLookup.collection);
            row.category = findValue(headerLookup.category);
            row.class = findValue(headerLookup.class);
            row.colorFamily = findValue(headerLookup.colorFamily);

            ['velocityUnitsPerDay', 'st28', 'st90'].forEach(field => {
                const value = findValue(headerLookup[field as keyof typeof headerLookup]);
                if (value) {
                    const num = Number(value);
                    if (!isNaN(num)) (row as any)[field] = num;
                }
            });

            parsedRows.push(row);
        }
        return parsedRows;
    }, []);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target?.result as string;
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length < 2) return;

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const parsedRows = parseCSV(csvText);
            const validation = validateCsv(headers, parsedRows);

            setCsv(parsedRows, headers, validation);
            setPreviewRows(parsedRows.slice(0, 200));
            setCsvLoaded(true);
        };
        reader.readAsText(file);
    }, [parseCSV]);

    const findMatchingRows = useCallback((query: string, allRows: Row[]): Row[] => {
        if (!csvLoaded || allRows.length === 0) return [];

        const filters: Array<(row: Row) => boolean> = [];
        const collectionMatch = query.match(/collection:"([^"]+)"/i);
        if (collectionMatch) {
            const collection = collectionMatch[1].toLowerCase();
            filters.push(row => row.collection?.toLowerCase().includes(collection) || false);
        }

        const categoryMatch = query.match(/category:"([^"]+)"/i);
        if (categoryMatch) {
            const category = categoryMatch[1].toLowerCase();
            filters.push(row => row.category?.toLowerCase().includes(category) || false);
        }

        const colorMatch = query.match(/colorFamily:"([^"]+)"/i);
        if (colorMatch) {
            const color = colorMatch[1].toLowerCase();
            filters.push(row => row.colorFamily?.toLowerCase().includes(color) || false);
        }

        if (filters.length === 0 && !query.includes(' AND ') && !query.includes(' OR ')) {
            const trimmedQuery = query.trim();
            filters.push(row => row.sku === trimmedQuery);
        }

        if (filters.length === 0) return [];
        return allRows.filter(row => filters.every(filter => filter(row))).slice(0, 20);
    }, [csvLoaded]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setIsLoading(true);
        setShowMockBanner(false);
        setShowBudgetBanner(false);
        setShowFallbackBanner(false);
        setShowCacheBanner(false);
        setShowCapBanner(false);
        setErrorMessage(null);

        try {
            if (mode === 'quick') {
                const s = getSettings();
                const indices = computeQuickIndices(csvRows || [], s.weights, s.scenario);
                const verdict = verdictFrom(indices, s.thresholds);
                const explain = explainQuick(csvRows || [], s.weights, s.scenario);
                const result: AnalysisResult = {
                    verdict,
                    demand: indices.demand,
                    momentum: indices.momentum,
                    saturation: indices.saturation,
                    freshness: indices.freshness,
                    styleFit: indices.styleFit,
                    summary: `Quick analysis verdict: ${verdict}.`,
                    indices,
                    sources: ['csv', 'quick'],
                    explain,
                    timestamp: Date.now()
                };
                setResult(result);
                setShowMockBanner(false);
                setShowBudgetBanner(false);
                setShowFallbackBanner(false);
                setShowCacheBanner(false);
                setShowCapBanner(false);
                setIncludedRowsCount(0);
            } else {
                const hasRows = Array.isArray(csvRows) && csvRows.length > 0;
                const matchedRows = hasRows ? findMatchingRows(input, csvRows) : [];
                setIncludedRowsCount(matchedRows.length);

                const s = getSettings();
                const response = await fetch('/api/deep', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: input, rows: matchedRows, model: s.model, temperature: s.temperature, settings: s }),
                });

                if (!response.ok) {
                    // Don't alert, show inline error instead
                    setErrorMessage('Analysis failed. Falling back to mock.');

                    // Use a fallback mock response
                    const fallbackMock = {
                        verdict: 'Hold' as const,
                        demand: 50,
                        momentum: 50,
                        saturation: 50,
                        freshness: 50,
                        styleFit: 50,
                        summary: 'Analysis failed. Falling back to mock.',
                        indices: { demand: 50, momentum: 50, saturation: 50, freshness: 50, styleFit: 50 },
                        sources: ['mock', 'fallback']
                    };
                    setResult(fallbackMock);
                    setShowMockBanner(true);
                    setShowFallbackBanner(true);
                } else {
                    const data = await response.json();
                    setResult(data);

                    // Set banner states based on response sources
                    const sources = Array.isArray(data.sources) ? data.sources : [];
                    setShowMockBanner(sources.includes('mock'));
                    setShowFallbackBanner(sources.includes('fallback'));
                    setShowBudgetBanner(sources.includes('budget'));
                    setShowCacheBanner(sources.includes('cache'));
                    setShowCapBanner(sources.includes('cap'));

                    // Only decrement remaining on real success
                    if (data.mode === 'real') {
                        setRemaining(prev => Math.max(0, prev - 100));
                    }
                }
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            // Show inline error instead of alert
            setErrorMessage('Analysis failed. Falling back to mock.');

            // Use a fallback mock response
            const fallbackMock = {
                verdict: 'Hold' as const,
                demand: 50,
                momentum: 50,
                saturation: 50,
                freshness: 50,
                styleFit: 50,
                summary: 'Network error. Falling back to mock.',
                indices: { demand: 50, momentum: 50, saturation: 50, freshness: 50, styleFit: 50 },
                sources: ['mock', 'fallback']
            };
            setResult(fallbackMock);
            setShowMockBanner(true);
            setShowFallbackBanner(true);
        } finally {
            setIsLoading(false);
        }
    };

    const containerStyle: React.CSSProperties = {
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        fontFamily: 'Arial, sans-serif'
    };

    const leftRailStyle: React.CSSProperties = {
        width: '320px',
        backgroundColor: 'var(--card)',
        borderRight: '1px solid var(--border)',
        padding: '20px',
        overflowY: 'auto'
    };

    const centerStyle: React.CSSProperties = {
        flex: 1,
        padding: '20px',
        overflowY: 'auto'
    };

    const rightRailStyle: React.CSSProperties = {
        width: '320px',
        backgroundColor: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        padding: '20px',
        overflowY: 'auto'
    };

    const headerStyle: React.CSSProperties = {
        textAlign: 'center',
        marginBottom: '40px'
    };

    const sectionStyle: React.CSSProperties = {
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#2a2a2a',
        padding: '30px',
        borderRadius: '8px',
        marginBottom: '30px'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px',
        backgroundColor: '#3a3a3a',
        border: '1px solid #555',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '16px',
        marginBottom: '20px'
    };

    const toggleStyle: React.CSSProperties = {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        alignItems: 'center'
    };

    const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
        padding: '8px 16px',
        backgroundColor: active ? '#4CAF50' : '#555',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    });

    const submitButtonStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px',
        backgroundColor: isLoading ? '#666' : '#0066cc',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    };

    const bannerStyle: React.CSSProperties = {
        backgroundColor: '#ff9800',
        color: '#000',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px',
        textAlign: 'center'
    };







    return (
        <div style={containerStyle}>
            {/* Left Rail - Filters */}
            <div style={leftRailStyle}>
                <h2 style={{ marginBottom: '20px' }}>Filters</h2>

                {/* Intent Chips */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Intent</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {INTENT_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedIntent(option.value)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: selectedIntent === option.value ? 'var(--accent)' : 'var(--card)',
                                    color: selectedIntent === option.value ? 'white' : 'var(--text)',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Horizon */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Horizon</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {HORIZON_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedHorizon(option.value)}
                                style={{
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: selectedHorizon === option.value ? 'var(--accent)' : 'var(--card)',
                                    color: selectedHorizon === option.value ? 'white' : 'var(--text)',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode Toggle */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Mode</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setMode('quick')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                backgroundColor: mode === 'quick' ? 'var(--accent)' : 'var(--card)',
                                color: mode === 'quick' ? 'white' : 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Quick
                        </button>
                        <button
                            onClick={() => setMode('deep')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                backgroundColor: mode === 'deep' ? 'var(--accent)' : 'var(--card)',
                                color: mode === 'deep' ? 'white' : 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Deep
                        </button>
                    </div>
                    {mode === 'deep' && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--muted)', borderRadius: '4px', fontSize: '11px' }}>
                            💰 Deep mode uses API budget
                        </div>
                    )}
                </div>

                {/* CSV Info */}
                {csvRows.length === 0 && (
                    <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px', fontSize: '12px' }}>
                        ℹ️ No CSV data loaded. Using fallback options.
                    </div>
                )}
            </div>

            {/* Center - Main Content */}
            <div style={centerStyle}>
                <div style={headerStyle}>
                    <h1>AI Buyer Assist</h1>
                    <p>Remaining: {remaining.toLocaleString()}</p>
                </div>

                {/* CSV Upload Section */}
                <div style={{ ...sectionStyle, maxWidth: '800px' }}>
                    <h3>CSV Data (Optional)</h3>

                    {!csvLoaded && (
                        <div style={bannerStyle}>
                            Running without CSV – KPIs limited (CSV optional)
                        </div>
                    )}

                    {csvLoaded && missingHeaders.length > 0 && (
                        <div style={{ ...bannerStyle, backgroundColor: '#f44336', color: '#fff' }}>
                            Missing: {missingHeaders.join(', ')}
                        </div>
                    )}

                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="file-input"
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="file-input-button">
                            {csvLoaded ? 'Replace CSV' : 'Upload CSV'}
                        </label>
                    </div>

                    {csvLoaded && (
                        <div>
                            <p>Loaded {csvRows.length} rows. Showing first {previewRows.length}:</p>
                            <div className="csv-preview-container">
                                <table className="csv-preview-table">
                                    <thead>
                                        <tr>
                                            <th>SKU</th><th>Product Name</th><th>Collection</th><th>Category</th>
                                            <th>Class</th><th>Velocity/Day</th><th>ST28</th><th>ST90</th><th>Color Family</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.map((row, index) => (
                                            <tr key={index}>
                                                <td>{row.sku}</td>
                                                <td>{row.productName || '-'}</td>
                                                <td>{row.collection || '-'}</td>
                                                <td>{row.category || '-'}</td>
                                                <td>{row.class || '-'}</td>
                                                <td>{row.velocityUnitsPerDay ?? '-'}</td>
                                                <td>{row.st28 ?? '-'}</td>
                                                <td>{row.st90 ?? '-'}</td>
                                                <td>{row.colorFamily || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {!csvRows?.length && (
                    <div style={{ ...bannerStyle, border: '1px solid #facc15', backgroundColor: '#fef3c7', color: '#92400e', marginBottom: '20px', maxWidth: '600px' }}>
                        No CSV loaded — Deep will infer from general trend knowledge. Results may have lower confidence.
                        <button
                            type="button"
                            style={{ marginLeft: '12px', textDecoration: 'underline', background: 'none', border: 'none', color: '#92400e', cursor: 'pointer' }}
                            onClick={async () => {
                                try {
                                    const res = await fetch('/sample-data.csv');
                                    const text = await res.text();
                                    // naive CSV parse (headers required)
                                    const parsedRows = parseCSV(text);
                                    setCsvRows(parsedRows);
                                    setCsvLoaded(true);
                                    setPreviewRows(parsedRows.slice(0, 5));
                                    setMissingHeaders([]);
                                } catch (error) {
                                    console.error('Failed to load sample data:', error);
                                }
                            }}
                        >
                            Load sample data
                        </button>
                    </div>
                )}

                {/* CSV Validation Banners */}
                {validation && !validation.ok && (
                    <div style={{
                        ...sectionStyle,
                        maxWidth: '600px',
                        backgroundColor: '#f44336',
                        color: '#fff',
                        marginBottom: '20px'
                    }}>
                        <strong>CSV Missing Required Headers:</strong> Please upload a file with: {validation.issues
                            .filter(i => i.type === 'missingHeader')
                            .map(i => (i as any).header)
                            .join(', ')}
                    </div>
                )}

                {hasWarnings && validation?.ok && (
                    <div style={{
                        ...sectionStyle,
                        maxWidth: '600px',
                        backgroundColor: '#ff9800',
                        color: '#fff',
                        marginBottom: '20px'
                    }}>
                        <strong>Data warnings ({validation.issues.length}):</strong> Some rows may have data quality issues.
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ ...sectionStyle, maxWidth: '600px' }}>
                    <h3>Analysis</h3>

                    {/* Guided Query Builder */}
                    <div style={{ marginBottom: '16px' }}>
                        <button
                            type="button"
                            onClick={() => setShowQueryBuilder(!showQueryBuilder)}
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#f2f2f5',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                marginBottom: showQueryBuilder ? '12px' : '0'
                            }}
                        >
                            {showQueryBuilder ? '▼' : '▶'} Guided Query Builder
                        </button>

                        {showQueryBuilder && (
                            <div style={{
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                padding: '16px',
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                marginBottom: '16px'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                                    <select
                                        value={queryParts.collection || ''}
                                        onChange={(e) => setQueryParts({ ...queryParts, collection: e.target.value || undefined })}
                                        style={{ padding: '6px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#f2f2f5', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                                    >
                                        <option value="">Collection...</option>
                                        {collections.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>

                                    <select
                                        value={queryParts.category || ''}
                                        onChange={(e) => setQueryParts({ ...queryParts, category: e.target.value || undefined })}
                                        style={{ padding: '6px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#f2f2f5', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                                    >
                                        <option value="">Category...</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>

                                    <select
                                        value={queryParts.colorFamily || ''}
                                        onChange={(e) => setQueryParts({ ...queryParts, colorFamily: e.target.value || undefined })}
                                        style={{ padding: '6px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#f2f2f5', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                                    >
                                        <option value="">Color...</option>
                                        {colors.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>

                                    <select
                                        value={queryParts.genderTarget || ''}
                                        onChange={(e) => setQueryParts({ ...queryParts, genderTarget: e.target.value || undefined })}
                                        style={{ padding: '6px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#f2f2f5', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                                    >
                                        <option value="">Gender...</option>
                                        {genders.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Additional text (optional)"
                                    value={queryParts.text || ''}
                                    onChange={(e) => setQueryParts({ ...queryParts, text: e.target.value || undefined })}
                                    style={{ width: '100%', padding: '6px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#f2f2f5', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '12px' }}
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        const query = buildQuery(queryParts);
                                        setInput(query);
                                    }}
                                    style={{
                                        backgroundColor: '#6366f1',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Compose Query
                                </button>

                                {/* Active Filter Chips */}
                                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {Object.entries(queryParts).filter(([_, v]) => v).map(([key, value]) => (
                                        <span
                                            key={key}
                                            style={{
                                                backgroundColor: '#6366f1',
                                                color: '#fff',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {key}: {value}
                                            <button
                                                type="button"
                                                onClick={() => setQueryParts({ ...queryParts, [key]: undefined })}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='collection:"Jordan 1" or SKU'
                        style={inputStyle}
                        disabled={isLoading}
                    />

                    <div style={toggleStyle}>
                        <span>Mode:</span>
                        <button
                            type="button"
                            onClick={() => handleModeChange('quick')}
                            style={toggleButtonStyle(mode === 'quick')}
                            disabled={isLoading}
                        >
                            Quick
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('deep')}
                            style={toggleButtonStyle(mode === 'deep')}
                            disabled={isLoading}
                        >
                            Deep
                        </button>
                    </div>

                    <button type="submit" style={submitButtonStyle} disabled={isLoading || !input.trim() || !csvIsValid}>
                        {isLoading ? 'Analyzing...' : `Run ${mode} Analysis`}
                    </button>
                </form>

                {result && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Status Banners */}
                        {isSharedView && (
                            <div style={{ ...bannerStyle, backgroundColor: '#2196f3', color: '#fff' }}>
                                Viewing a shared session (read-only)
                            </div>
                        )}

                        {showMockBanner && (
                            <div style={bannerStyle}>
                                Using mock response (no API key present)
                            </div>
                        )}

                        {showBudgetBanner && (
                            <div style={{ ...bannerStyle, backgroundColor: '#ff9800', color: '#fff' }}>
                                Daily budget limit reached - using mock response
                            </div>
                        )}

                        {showFallbackBanner && !showMockBanner && !showBudgetBanner && (
                            <div style={{ ...bannerStyle, backgroundColor: '#f44336', color: '#fff' }}>
                                API error - fell back to mock response
                            </div>
                        )}

                        {showCacheBanner && (
                            <div style={{ ...bannerStyle, backgroundColor: '#2196f3', color: '#fff' }}>
                                From cache - no API call made
                            </div>
                        )}

                        {showCapBanner && (
                            <div style={{ ...bannerStyle, backgroundColor: '#ff9800', color: '#fff' }}>
                                Daily AI budget cap reached. Showing conservative fallback.
                            </div>
                        )}

                        {errorMessage && (
                            <div style={{
                                ...bannerStyle,
                                backgroundColor: '#f44336',
                                color: '#fff',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{errorMessage}</span>
                                <button
                                    onClick={() => setErrorMessage(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        padding: '0 5px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {/* Header Cards - Verdict & Confidence */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '16px',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <div style={{
                                    fontSize: '14px',
                                    color: 'var(--muted)',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Decision
                                </div>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: 'var(--text)',
                                    lineHeight: '1.2'
                                }}>
                                    {result.summary}
                                </div>
                                {includedRowsCount > 0 && (
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#4CAF50',
                                        marginTop: '4px'
                                    }}>
                                        Based on {includedRowsCount} data points
                                    </div>
                                )}
                            </div>

                            {'confidence' in result && result.confidence !== undefined && (
                                <div style={{
                                    backgroundColor: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '120px'
                                }}>
                                    <div style={{
                                        fontSize: '14px',
                                        color: 'var(--muted)',
                                        fontWeight: '500',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '8px'
                                    }}>
                                        Confidence
                                    </div>
                                    <div style={{
                                        fontSize: '32px',
                                        fontWeight: '700',
                                        color: 'var(--accent)',
                                        lineHeight: '1'
                                    }}>
                                        {Math.round(result.confidence)}%
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mini Gauges for Indices */}
                        {mode === 'deep' && result.indices && (
                            <div style={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '20px'
                            }}>
                                <div style={{
                                    fontSize: '14px',
                                    color: 'var(--muted)',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '16px'
                                }}>
                                    Market Indices
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                    gap: '16px'
                                }}>
                                    {[
                                        { key: 'demand', label: 'Demand', color: '#4CAF50' },
                                        { key: 'momentum', label: 'Momentum', color: '#2196F3' },
                                        { key: 'saturation', label: 'Saturation', color: '#FF5722' },
                                        { key: 'freshness', label: 'Freshness', color: '#9C27B0' },
                                        { key: 'styleFit', label: 'Style Fit', color: '#FF9800' }
                                    ].map(({ key, label, color }) => {
                                        const value = result.indices?.[key as keyof typeof result.indices] || 0;
                                        const percentage = Math.max(0, Math.min(100, value));

                                        return (
                                            <div key={key} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                {/* Mini circular gauge */}
                                                <div style={{
                                                    position: 'relative',
                                                    width: '60px',
                                                    height: '60px'
                                                }}>
                                                    <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                                                        <circle
                                                            cx="30"
                                                            cy="30"
                                                            r="25"
                                                            fill="none"
                                                            stroke="var(--border)"
                                                            strokeWidth="6"
                                                        />
                                                        <circle
                                                            cx="30"
                                                            cy="30"
                                                            r="25"
                                                            fill="none"
                                                            stroke={color}
                                                            strokeWidth="6"
                                                            strokeDasharray={`${2 * Math.PI * 25}`}
                                                            strokeDashoffset={`${2 * Math.PI * 25 * (1 - percentage / 100)}`}
                                                            strokeLinecap="round"
                                                            style={{
                                                                transition: 'stroke-dashoffset 0.8s ease-in-out'
                                                            }}
                                                        />
                                                    </svg>
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        fontSize: '16px',
                                                        fontWeight: '700',
                                                        color: 'var(--text)'
                                                    }}>
                                                        {value}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: 'var(--muted)',
                                                    textAlign: 'center',
                                                    fontWeight: '500'
                                                }}>
                                                    {label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Why Section */}
                        {result?.explain && (
                            <div style={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '20px'
                            }}>
                                <div style={{
                                    fontSize: '14px',
                                    color: 'var(--muted)',
                                    fontWeight: '500',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '16px'
                                }}>
                                    Why this verdict?
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    {result.explain.factors.map((f, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'flex-start',
                                            padding: '12px',
                                            backgroundColor: 'var(--bg)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: f.impact === '+' ? '#4CAF50' : f.impact === '-' ? '#f44336' : '#9e9e9e',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                flexShrink: 0
                                            }}>
                                                {f.impact}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: 'var(--text)',
                                                    marginBottom: '4px'
                                                }}>
                                                    {f.label}
                                                </div>
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: 'var(--muted)',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {f.note}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Save Session Button */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            paddingTop: '8px'
                        }}>
                            <button
                                onClick={() => {
                                    const sessionId = saveSession(result);
                                    alert(`Session saved! ID: ${sessionId}`);
                                }}
                                style={{
                                    padding: '12px 20px',
                                    backgroundColor: 'var(--accent)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'opacity 0.2s ease'
                                }}
                                onMouseOver={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
                                onMouseOut={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
                            >
                                Save Session
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Rail - Evidence */}
            <div style={rightRailStyle}>
                <h2 style={{ marginBottom: '20px' }}>Evidence</h2>

                {result?.sources && (
                    <div style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            color: 'var(--muted)',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '12px'
                        }}>
                            Data Sources
                        </div>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px'
                        }}>
                            {result.sources.map((source: string, index: number) => (
                                <span key={index} style={{
                                    backgroundColor: 'var(--accent)',
                                    color: '#fff',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}>
                                    {source}
                                </span>
                            ))}
                            {result.sources.includes('trends') && (
                                <span style={{
                                    backgroundColor: '#2196f3',
                                    color: '#fff',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}>
                                    + External Signals
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {result?.citations?.length ? (
                    <div style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            color: 'var(--muted)',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '12px'
                        }}>
                            Citations
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {result.citations.map((c, i) => (
                                <div key={i} style={{
                                    padding: '12px',
                                    backgroundColor: 'var(--bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <a
                                        href={c.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            color: 'var(--accent)',
                                            textDecoration: 'none',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            display: 'block',
                                            marginBottom: '4px'
                                        }}
                                        onMouseOver={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'underline'}
                                        onMouseOut={(e) => (e.target as HTMLAnchorElement).style.textDecoration = 'none'}
                                    >
                                        {c.title}
                                    </a>
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'var(--muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span style={{
                                            backgroundColor: 'var(--muted)',
                                            color: 'var(--bg)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '500',
                                            textTransform: 'uppercase'
                                        }}>
                                            {c.source}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {csvIsValid && (
                    <div style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            color: 'var(--muted)',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '12px'
                        }}>
                            CSV Analysis
                        </div>
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'var(--bg)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: 'var(--text)',
                                marginBottom: '4px'
                            }}>
                                Data Set Active
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: 'var(--muted)',
                                lineHeight: '1.4'
                            }}>
                                Analysis includes competitive data from uploaded CSV file
                            </div>
                            {includedRowsCount > 0 && (
                                <div style={{
                                    fontSize: '12px',
                                    color: '#4CAF50',
                                    marginTop: '8px',
                                    fontWeight: '500'
                                }}>
                                    {includedRowsCount} rows analyzed
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {result && !isSharedView && (
                    <div style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            color: 'var(--muted)',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '12px'
                        }}>
                            Export & Share
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    if (result?.runId) {
                                        window.open(`/api/export?id=${result.runId}`, '_blank');
                                    } else {
                                        window.open('/api/export?type=analyze', '_blank');
                                    }
                                }}
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    width: '100%'
                                }}
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={() => {
                                    if (result?.runId) {
                                        const shareUrl = `${window.location.origin}${window.location.pathname}?run=${result.runId}`;
                                        navigator.clipboard.writeText(shareUrl);
                                        alert('Share link copied to clipboard!');
                                    }
                                }}
                                disabled={!result?.runId}
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: result?.runId ? '#059669' : '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: result?.runId ? 'pointer' : 'not-allowed',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    width: '100%'
                                }}
                            >
                                Copy Share Link
                            </button>
                        </div>
                    </div>
                )}

                {!result && (
                    <div style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            color: 'var(--muted)',
                            lineHeight: '1.5'
                        }}>
                            Run an analysis to see citations, data sources, and export options here
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analyze;