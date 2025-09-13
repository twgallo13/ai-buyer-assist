// React components

type Props = {
    availability?: number | null;
    markdownRisk?: number | null;
    velocity?: number | null;
    diversification?: number | null;
    loading?: boolean;
};

function Tile({ label, value, loading }: { label: string; value: number | null | undefined; loading?: boolean }) {
    const display = loading ? '—' : (value == null ? 'N/A' : `${value}`);
    return (
        <div style={{
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            padding: '16px'
        }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{display}</div>
        </div>
    );
}

export default function KpiTiles(p: Props) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
        }}>
            <Tile label="Availability Index" value={p.availability} loading={p.loading} />
            <Tile label="Markdown Risk (%)" value={p.markdownRisk} loading={p.loading} />
            <Tile label="Velocity Index" value={p.velocity} loading={p.loading} />
            <Tile label="Diversification" value={p.diversification} loading={p.loading} />
        </div>
    );
}