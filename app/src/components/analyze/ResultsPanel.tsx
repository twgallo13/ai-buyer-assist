import React from 'react';

type Explain = { factors?: Array<{ label: string; impact: '+' | '-' | '~'; note: string }> };
type Result = {
    verdict?: 'Go' | 'Hold' | 'Skip';
    confidence?: number;
    explain?: Explain;
    sources?: Array<{ title: string, url?: string, source?: string }>;
    mode?: 'real' | 'mock';
};
type Props = { result?: Result; error?: string };

export default function ResultsPanel({ result, error }: Props) {
    if (error) return <div className="card p-3">❌ {error}</div>;
    if (!result) return null;
    const isReal = result.mode === 'real' || (result.sources || []).some(s => s.source === 'gemini' || s.title?.toLowerCase().includes('gemini'));
    return (
        <div className="space-y-3">
            <div className="card p-3">
                <div className="flex items-center gap-2">
                    <div className="pill">{result.verdict || '—'}</div>
                    {typeof result.confidence === 'number' && <div className="muted text-sm">{result.confidence}% confidence</div>}
                    {!isReal && <div className="muted text-xs ml-auto">Mock/fallback — no API key detected</div>}
                </div>
            </div>
            {result.explain?.factors?.length ? (
                <div className="card p-3">
                    <div className="font-semibold mb-2">Why this verdict?</div>
                    <ul className="space-y-1">
                        {result.explain.factors.map((f, i) => (
                            <li key={i} className="text-sm"><strong>{f.impact}</strong> {f.label} — {f.note}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
            {!!result.sources?.length && (
                <div className="card p-3">
                    <div className="font-semibold mb-2">Sources & Citations</div>
                    <ul className="space-y-1">
                        {result.sources.map((s, i) => (
                            <li key={i} className="text-sm">
                                {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}
                                {s.source ? <span className="muted"> · {s.source}</span> : null}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}