
import KpiTile from '../KpiTile';

type Explain = { factors?: Array<{ label: string; impact: '+' | '-' | '~'; note: string }> };
type Result = {
    verdict?: 'Go' | 'Hold' | 'Skip';
    confidence?: number;
    explain?: Explain;
    sources?: Array<{ title: string, url?: string, source?: string }>;
    images?: Array<{ url: string; alt?: string; source?: string }>;
    kpis?: {
        availability?: number;
        markdownRisk?: number;
        diversification?: number;
        velocity?: number;
        resalePremium?: number;
        trendAlignment?: number;
        competitorPresence?: number;
    };
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
            {!!result.kpis && (
                <div className="card p-3">
                    <div className="font-semibold mb-3">Key Performance Indicators</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {result.kpis.availability !== undefined && (
                            <KpiTile
                                label="Availability"
                                score={result.kpis.availability}
                                tone={result.kpis.availability >= 70 ? 'good' : result.kpis.availability >= 40 ? 'warn' : 'risk'}
                                help="Product availability across channels and regions"
                            />
                        )}
                        {result.kpis.markdownRisk !== undefined && (
                            <KpiTile
                                label="Markdown Risk"
                                score={result.kpis.markdownRisk}
                                tone={result.kpis.markdownRisk <= 40 ? 'good' : result.kpis.markdownRisk <= 70 ? 'warn' : 'risk'}
                                help="Risk of requiring price markdowns - lower scores are better"
                            />
                        )}
                        {result.kpis.diversification !== undefined && (
                            <KpiTile
                                label="Diversification"
                                score={result.kpis.diversification}
                                tone={result.kpis.diversification >= 70 ? 'good' : result.kpis.diversification >= 40 ? 'warn' : 'risk'}
                                help="Portfolio diversification benefits from this product category"
                            />
                        )}
                        {result.kpis.velocity !== undefined && (
                            <KpiTile
                                label="Velocity"
                                score={result.kpis.velocity}
                                tone={result.kpis.velocity >= 70 ? 'good' : result.kpis.velocity >= 40 ? 'warn' : 'risk'}
                                help="Sales velocity and inventory turnover rate"
                            />
                        )}
                        {result.kpis.resalePremium !== undefined && (
                            <KpiTile
                                label="Resale Premium"
                                score={result.kpis.resalePremium}
                                tone={result.kpis.resalePremium >= 70 ? 'good' : result.kpis.resalePremium >= 40 ? 'warn' : 'risk'}
                                help="Resale market premium potential - higher scores indicate better value retention"
                            />
                        )}
                        {result.kpis.trendAlignment !== undefined && (
                            <KpiTile
                                label="Trend Alignment"
                                score={result.kpis.trendAlignment}
                                tone={result.kpis.trendAlignment >= 70 ? 'good' : result.kpis.trendAlignment >= 40 ? 'warn' : 'risk'}
                                help="Alignment with current market trends and consumer preferences"
                            />
                        )}
                        {result.kpis.competitorPresence !== undefined && (
                            <KpiTile
                                label="Competitor Presence"
                                score={result.kpis.competitorPresence}
                                tone={result.kpis.competitorPresence <= 40 ? 'good' : result.kpis.competitorPresence <= 70 ? 'warn' : 'risk'}
                                help="Level of competitor activity in this category - lower scores indicate less competition"
                            />
                        )}
                    </div>
                </div>
            )}
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