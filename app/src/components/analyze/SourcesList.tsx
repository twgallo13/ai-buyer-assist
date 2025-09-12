import type { AnalysisResult, Citation } from '../../lib/types';

interface SourcesListProps {
    result: AnalysisResult;
}

/**
 * SourcesList Component
 * 
 * Displays sources and citations from the analysis result.
 * - External links (with URLs) open in a new tab
 * - Internal sources are displayed as chips
 */
const SourcesList: React.FC<SourcesListProps> = ({ result }) => {
    const hasCitations = result.citations && result.citations.length > 0;
    const hasSources = result.sources && result.sources.length > 0;

    const renderCitations = () => {
        if (!hasCitations) return null;

        return (
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: 'var(--space-2)'
                }}>
                    External Citations
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {result.citations!.map((citation: Citation, index: number) => (
                        <a
                            key={index}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: 'var(--space-2) var(--space-3)',
                                backgroundColor: 'var(--accent)',
                                color: 'white',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                textDecoration: 'none',
                                transition: 'opacity 0.2s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9' }}
                            onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
                        >
                            {citation.title || citation.source}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ marginLeft: 'var(--space-1)' }}
                            >
                                <path d="M7 17L17 7"></path>
                                <path d="M7 7h10v10"></path>
                            </svg>
                        </a>
                    ))}
                </div>
            </div>
        );
    };

    const renderSources = () => {
        if (!hasSources) return null;

        return (
            <div>
                <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: 'var(--space-2)'
                }}>
                    Data Sources
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {result.sources!.map((source, index) => (
                        <span
                            key={index}
                            style={{
                                display: 'inline-block',
                                padding: 'var(--space-1) var(--space-3)',
                                backgroundColor: 'var(--border)',
                                color: 'var(--text)',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}
                        >
                            {source}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="card" style={{
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)'
        }}>
            <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: 'var(--space-4)',
                color: 'var(--text)'
            }}>
                Sources & Citations
            </div>

            {hasCitations || hasSources ? (
                <>
                    {renderCitations()}
                    {renderSources()}
                </>
            ) : (
                <div style={{
                    color: 'var(--muted)',
                    fontSize: '0.875rem',
                    fontStyle: 'italic'
                }}>
                    No external citations for this query.
                </div>
            )}
        </div>
    );
};

export default SourcesList;