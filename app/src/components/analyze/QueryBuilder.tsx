
type Option = { label: string, value: string };
type Props = {
    collections: Option[]; categories: Option[]; colors: Option[]; genders: Option[];
    onCompose: (q: string) => void;
    disabled?: boolean;
};

export default function QueryBuilder(p: Props) {
    const hasOptions = p.collections.length + p.categories.length + p.colors.length + p.genders.length > 0;
    if (!hasOptions) return null; // hide when no CSV-provided options
    return (
        <div className="card p-3">
            <div className="text-sm mb-2">Guided filters (optional)</div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '10px' }}>
                <select className="card p-2" onChange={e => p.onCompose(`collection:"${e.target.value}"`)}>
                    <option value="">Collection…</option>
                    {p.collections.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="card p-2" onChange={e => p.onCompose(`category:"${e.target.value}"`)}>
                    <option value="">Category…</option>{p.categories.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="card p-2" onChange={e => p.onCompose(`color:"${e.target.value}"`)}>
                    <option value="">Color…</option>{p.colors.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className="card p-2" onChange={e => p.onCompose(`gender:"${e.target.value}"`)}>
                    <option value="">Gender…</option>{p.genders.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
        </div>
    );
}