import { useEffect, useState } from 'react';

type Usage = {
    date: string;
    calls: number;
    blocked: number;
    cacheHits: number;
    cap: number;
    cacheSize: number;
};

export default function UsagePage() {
    const [u, setU] = useState<Usage | null>(null);
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch('/api/usage');
            const j = await r.json();
            setU(j);
        } finally { setLoading(false); }
    }
    async function reset() {
        await fetch('/api/usage/reset', { method: 'POST' });
        load();
    }

    useEffect(() => { load(); }, []);

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-xl font-semibold">Usage & Budget</h1>
            {loading && <div>Loading…</div>}
            {u && (
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="card"><div className="text-sm opacity-70">Date</div><div className="text-2xl">{u.date}</div></div>
                    <div className="card"><div className="text-sm opacity-70">Cap</div><div className="text-2xl">{u.cap}</div></div>
                    <div className="card"><div className="text-sm opacity-70">Calls today</div><div className="text-2xl">{u.calls}</div></div>
                    <div className="card"><div className="text-sm opacity-70">Blocked (cap)</div><div className="text-2xl">{u.blocked}</div></div>
                    <div className="card"><div className="text-sm opacity-70">Cache hits</div><div className="text-2xl">{u.cacheHits}</div></div>
                    <div className="card"><div className="text-sm opacity-70">Cache size</div><div className="text-2xl">{u.cacheSize}</div></div>
                </div>
            )}
            <div className="flex gap-2">
                <button className="card rounded-lg px-3 py-2" onClick={load}>Refresh</button>
                <button className="card rounded-lg px-3 py-2" onClick={reset}>Reset (dev)</button>
            </div>
            <p className="text-sm opacity-70">When the daily cap is reached, Deep results will gracefully degrade and show a banner.</p>
        </div>
    );
}