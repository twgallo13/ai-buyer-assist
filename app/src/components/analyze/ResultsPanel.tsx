
type Explain = { factors?: Array<{ label: string; impact: '+' | '-' | '~'; note: string }> };
type Result = {
    verdict?: 'Go' | 'Hold' | 'Skip';
    confidence?: number;
    explain?: Explain;
    sources?: Array<{ title: string, url?: string, source?: string }>;
    images?: Array<{ url: string; alt?: string; source?: string }>;
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
            {!!result.images?.length && (
                <div className="card p-3">
                    <div className="font-semibold mb-2">Product Images</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {result.images.slice(0, 3).map((img, i) => (
                            <div key={i} className="relative group">
                                <a 
                                    href={img.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block aspect-square overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    <img 
                                        src={img.url} 
                                        alt={img.alt || `Product image ${i + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                    />
                                </a>
                                {img.source && (
                                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        {img.source}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
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