import React, { useState, useCallback, useEffect } from 'react';
import type { AnalysisResult } from '../lib/types';
import { saveSession } from '../lib/sessions';
import { getSettings } from '../lib/settings';
import DecisionSnapshot from '../components/analyze/DecisionSnapshot';
import ExplainCard from '../components/analyze/ExplainCard';
import SourcesList from '../components/analyze/SourcesList';
import { SkeletonHeadlines } from '../components/ui/Skeleton';

interface TrendHeadline {
    title: string;
    source: string;
    url: string;
}

const Analyze: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Right rail state
    const [headlines, setHeadlines] = useState<TrendHeadline[]>([]);
    const [loadingHeadlines, setLoadingHeadlines] = useState(false);

    // Load headlines on mount and when query changes
    useEffect(() => {
        fetchHeadlines(query || 'sneakers');
    }, [query]);

    const fetchHeadlines = async (searchQuery: string) => {
        setLoadingHeadlines(true);
        try {
            const response = await fetch(`/api/trends?query=${encodeURIComponent(searchQuery)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.headlines) {
                    setHeadlines(data.headlines.slice(0, 6));
                }
            }
        } catch (error) {
            console.warn('Failed to fetch headlines:', error);
            // Fallback headlines
            setHeadlines([
                { title: 'Nike Air Jordan 1 sees surge in resale demand', source: 'sneakerfreaker.com', url: 'https://sneakerfreaker.com' },
                { title: 'Adidas Ultraboost momentum building for Q4', source: 'hypebeast.com', url: 'https://hypebeast.com' },
                { title: 'New Balance collaborations driving freshness scores', source: 'complex.com', url: 'https://complex.com' },
                { title: 'Retro basketball styles maintaining strong demand', source: 'footwearnews.com', url: 'https://footwearnews.com' }
            ]);
        } finally {
            setLoadingHeadlines(false);
        }
    };

    const handleRun = useCallback(async (runMode: 'quick' | 'deep') => {
        if (!query.trim()) {
            setErrorMessage('Please enter a query');
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setResult(null);

        try {
            const currentSettings = getSettings();
            const endpoint = runMode === 'deep' ? '/api/deep' : '/api/quick';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query.trim(),
                    reasoningLevel: currentSettings.reasoningLevel,
                    region: currentSettings.regionPreset,
                    model: currentSettings.model,
                    temperature: currentSettings.temperature
                })
            });

            const data = await response.json();

            if (data.budgetExceeded || data.capped) {
                setResult(data.fallback || {
                    verdict: 'Hold',
                    demand: 50,
                    momentum: 50,
                    saturation: 50,
                    freshness: 50,
                    styleFit: 50,
                    confidence: 30,
                    summary: 'Daily AI budget cap reached. Showing conservative fallback.',
                    sources: ['cap'],
                    indices: { demand: 50, momentum: 50, saturation: 50, freshness: 50, styleFit: 50 }
                });
            } else if (data.summary || data.indices) {
                setResult(data);

                // Save session for sharing
                if (data.runId) {
                    saveSession({
                        ...data,
                        id: data.runId
                    });
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            setErrorMessage('Analysis failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    const currentSettings = getSettings();

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="max-w-7xl mx-auto p-4">
                {/* 12-column responsive grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column - Main Content (span 8 on desktop) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Hero Search Card */}
                        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                                AI Buyer Assistant
                            </h1>

                            <div className="space-y-4">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Enter product, brand, or trend query..."
                                    className="w-full h-24 p-3 rounded border resize-none"
                                    style={{
                                        backgroundColor: 'var(--bg)',
                                        color: 'var(--text)',
                                        borderColor: 'var(--border)'
                                    }}
                                />

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => handleRun('quick')}
                                        disabled={isLoading}
                                        className="px-6 py-2 rounded font-medium"
                                        style={{
                                            backgroundColor: 'var(--muted)',
                                            color: 'var(--card)',
                                            opacity: isLoading ? 0.5 : 1
                                        }}
                                    >
                                        {isLoading ? 'Running...' : 'Run Quick'}
                                    </button>

                                    <button
                                        onClick={() => handleRun('deep')}
                                        disabled={isLoading}
                                        className="px-6 py-2 rounded font-medium"
                                        style={{
                                            backgroundColor: 'var(--accent)',
                                            color: 'white',
                                            opacity: isLoading ? 0.5 : 1
                                        }}
                                    >
                                        {isLoading ? 'Running...' : 'Run Deep'}
                                    </button>
                                </div>

                                {/* Settings Pills */}
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--card)' }}>
                                        Model: {currentSettings.model}
                                    </span>
                                    <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--card)' }}>
                                        Temp: {currentSettings.temperature}
                                    </span>
                                    <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--card)' }}>
                                        Region: {currentSettings.regionPreset}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                                {errorMessage}
                            </div>
                        )}

                        {/* Results Stack */}
                        {result && (
                            <div className="space-y-4">
                                {/* Decision Snapshot */}
                                <DecisionSnapshot result={result} isLoading={isLoading} />

                                {/* Explain Card */}
                                <ExplainCard result={result} />

                                {/* Sources & Citations */}
                                <SourcesList result={result} />
                            </div>
                        )}
                    </div>

                    {/* Right Rail (span 4 on desktop) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* AI Headlines */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                            <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
                                AI Headlines
                            </h3>

                            {loadingHeadlines ? (
                                <SkeletonHeadlines count={4} />
                            ) : (
                                <div className="space-y-3">
                                    {headlines.map((headline, index) => (
                                        <div key={index} className="space-y-1">
                                            <a
                                                href={headline.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium hover:underline"
                                                style={{ color: 'var(--text)' }}
                                            >
                                                {headline.title}
                                            </a>
                                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                                {headline.source}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                            <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
                                Tips
                            </h3>
                            <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                                <li>• Try specific brand + model queries</li>
                                <li>• Include color or material details</li>
                                <li>• Use "vs" to compare products</li>
                                <li>• Deep mode provides reasoning</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analyze;