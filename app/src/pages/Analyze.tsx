import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Row } from '../types';
import type { AnalysisResult } from '../lib/types';
import { getSettings } from '../lib/settings';
import { computeQuickIndices, verdictFrom, explainQuick } from '../lib/verdict';
import { getCsvRows, setCsv, setCsvRows, subscribeCsv, getCsvValidation } from '../lib/csv-store';
import { saveSession } from '../lib/sessions';
import { validateCsv } from '../lib/csv-validate';
import { uniqueValues, buildQuery, type QueryParts } from '../lib/query-builder';

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

    // CSV state  
    const [isLoading, setIsLoading] = useState(false);
    const [remaining, setRemaining] = useState(10000);
    const [showMockBanner, setShowMockBanner] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [previewRows, setPreviewRows] = useState<Row[]>([]);

    // Guided Query Builder state
    const [showQueryBuilder, setShowQueryBuilder] = useState(false);
    const [queryParts, setQueryParts] = useState<QueryParts>({});
    
    // Memoized unique values for dropdowns
    const collections = useMemo(() => uniqueValues('Collection'), [csvRows]);
    const categories = useMemo(() => uniqueValues('Category'), [csvRows]);
    const colors = useMemo(() => uniqueValues('Color Family'), [csvRows]);
    const genders = useMemo(() => uniqueValues('Gender Target'), [csvRows]);
    
    // CSV validation
    const validation = getCsvValidation();
    const csvIsValid = validation?.ok !== false;
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
        setErrorMessage(null);

        try {
            if (mode === 'quick') {
                const s = getSettings();
                const indices = computeQuickIndices(csvRows || [], s.weights, s.scenario);
                const verdict = verdictFrom(indices, s.thresholds);
                const explain = explainQuick(csvRows || [], s.weights, s.scenario);
                const result: AnalysisResult = {
                    summary: `Quick analysis verdict: ${verdict}.`,
                    indices,
                    verdict,
                    sources: ['csv', 'quick'],
                    explain,
                    timestamp: new Date().toISOString()
                };
                setResult(result);
                setShowMockBanner(false);
                setShowBudgetBanner(false);
                setShowFallbackBanner(false);
                setIncludedRowsCount(0);
            } else {
                const hasRows = Array.isArray(csvRows) && csvRows.length > 0;
                const matchedRows = hasRows ? findMatchingRows(input, csvRows) : [];
                setIncludedRowsCount(matchedRows.length);

                const s = getSettings();
                const response = await fetch('/api/deep', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: input, rows: matchedRows, model: s.model, temperature: s.temperature }),
                });

                if (!response.ok) {
                    // Don't alert, show inline error instead
                    setErrorMessage('Analysis failed. Falling back to mock.');

                    // Use a fallback mock response
                    const fallbackMock = {
                        mode: 'mock-fallback' as const,
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
                mode: 'mock-fallback' as const,
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
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
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



    const indicesStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '15px',
        margin: '20px 0'
    };

    const indexItemStyle: React.CSSProperties = {
        backgroundColor: '#3a3a3a',
        padding: '15px',
        borderRadius: '4px',
        textAlign: 'center'
    };

    const sourcesStyle: React.CSSProperties = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '15px'
    };

    const sourceChipStyle: React.CSSProperties = {
        backgroundColor: '#4CAF50',
        color: '#000',
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: 'bold'
    };

    return (
        <div style={containerStyle}>
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
                <div style={{ ...sectionStyle, maxWidth: '600px' }}>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>Analysis Result</h3>
                        <button
                            onClick={() => {
                                const sessionId = saveSession(result);
                                alert(`Session saved! ID: ${sessionId}`);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#6366f1',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Save Session
                        </button>
                    </div>

                    {includedRowsCount > 0 && (
                        <p style={{ color: '#4CAF50', fontSize: '14px', marginBottom: '10px' }}>
                            Included rows: {includedRowsCount}
                        </p>
                    )}

                    <p style={{ marginBottom: '20px' }}>{result.summary}</p>

                    {result?.explain && (
                        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
                                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Why this verdict?</div>
                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {result.explain.factors.map((f, i) => (
                                        <li key={i} style={{ fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                            <span style={{
                                                color: f.impact === '+' ? '#4CAF50' : f.impact === '-' ? '#f44336' : '#9e9e9e',
                                                fontWeight: 'bold',
                                                minWidth: '16px'
                                            }}>
                                                {f.impact}
                                            </span>
                                            <span style={{ opacity: 0.9 }}>{f.label}</span>
                                            <span style={{ opacity: 0.6, fontSize: '12px' }}>— {f.note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {'confidence' in result && result.confidence !== undefined && (
                        <div style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.8 }}>Confidence: {Math.round(result.confidence)}%</div>
                    )}

                    {mode === 'deep' && result.indices && (
                        <>
                            <h4>Market Indices</h4>
                            <div style={indicesStyle}>
                                <div style={indexItemStyle}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                                        {result.indices.demand || 0}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Demand</div>
                                </div>
                                <div style={indexItemStyle}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                                        {result.indices.momentum || 0}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Momentum</div>
                                </div>
                                <div style={indexItemStyle}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF5722' }}>
                                        {result.indices.saturation || 0}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Saturation</div>
                                </div>
                                <div style={indexItemStyle}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                                        {result.indices.freshness || 0}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Freshness</div>
                                </div>
                                <div style={indexItemStyle}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                                        {result.indices.styleFit || 0}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Style Fit</div>
                                </div>
                            </div>
                        </>
                    )}

                    {result.sources && (
                        <div>
                            <h4>Sources</h4>
                            <div style={sourcesStyle}>
                                {result.sources.map((source: string, index: number) => (
                                    <span key={index} style={sourceChipStyle}>
                                        {source}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Analyze;