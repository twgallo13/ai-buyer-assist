import { useState, useEffect } from 'react';
import { getSettings, getCurrentWeights, getCurrentThresholds } from '../lib/settings';
import { computeQuickIndices, verdictFrom } from '../lib/verdict';
import { getCsvRows, subscribeCsv, getCsvValidation } from '../lib/csv-store';

export default function BatchPage() {
    const [csvRows, setCsvRows] = useState<any[]>(getCsvRows());
    const [out, setOut] = useState<any[]>([]);
    const [running, setRunning] = useState(false);

    const validation = getCsvValidation();
    const csvIsValid = validation?.ok !== false;

    // Subscribe to CSV changes
    useEffect(() => {
        const unsubscribe = subscribeCsv((newRows) => {
            setCsvRows(newRows);
        });
        return unsubscribe;
    }, []);

    async function runQuick() {
        setRunning(true);
        const s = getSettings();
        const weights = getCurrentWeights();
        const thresholds = getCurrentThresholds();
        const res = csvRows.map((r: any) => {
            const idx = computeQuickIndices([r], weights, s.scenario);
            const v = verdictFrom(idx, thresholds);
            return { sku: r.SKU || r.sku, collection: r.collection || r.Collection, verdict: v, ...idx, mode: 'quick' };
        });
        setOut(res); setRunning(false);
    }

    async function runDeep(concurrency = 3) {
        setRunning(true);
        const s = getSettings();
        const queue = csvRows.slice(0);
        const results: any[] = [];
        async function worker() {
            while (queue.length) {
                const r = queue.shift();
                if (!r) break;
                const resp = await fetch('/api/deep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: r.SKU || r.sku, rows: [r], model: s.model, temperature: s.temperature }) });
                const json = await resp.json().catch(() => null);
                results.push({ sku: r.SKU || r.sku, collection: r.collection || r.Collection, ...json });
            }
        }
        await Promise.all(Array.from({ length: concurrency }, worker));
        setOut(results); setRunning(false);
    }

    function exportCsv() {
        const timestamp = new Date().toISOString().slice(0, 10);

        // Use same format as server export
        const headers = 'timestamp,query,mode,verdict,demand,momentum,saturation,freshness,styleFit,confidence,sources';
        const rows = out.map(r => {
            const csvEscape = (str: any) => {
                if (typeof str !== 'string') str = String(str || '');
                if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            };

            return [
                new Date().toISOString(),
                csvEscape(r.sku || ''),
                r.sources?.includes('gemini') ? 'deep' : 'quick',
                csvEscape(r.verdict || 'Hold'),
                r.indices?.demand ?? r.demand ?? 50,
                r.indices?.momentum ?? r.momentum ?? 50,
                r.indices?.saturation ?? r.saturation ?? 50,
                r.indices?.freshness ?? r.freshness ?? 50,
                r.indices?.styleFit ?? r.styleFit ?? 50,
                r.confidence ?? 50,
                csvEscape((r.sources || []).join(';'))
            ].join(',');
        });

        const csvContent = headers + '\n' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-buyer-batch-${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 space-y-3">
            <h2 className="text-xl font-semibold">Batch</h2>

            {!csvIsValid && (
                <div className="bg-red-600 text-white p-3 rounded">
                    <strong>CSV Missing Required Headers:</strong> Batch processing requires valid CSV data with required headers.
                </div>
            )}

            <div className="flex gap-2">
                <button disabled={running || !csvIsValid} onClick={() => runQuick()} className="rounded bg-white/10 px-3 py-2 disabled:opacity-50">Run Quick</button>
                <button disabled={running || !csvIsValid} onClick={() => runDeep(3)} className="rounded bg-white/10 px-3 py-2 disabled:opacity-50">Run Deep</button>
                <button disabled={!out.length} onClick={exportCsv} className="rounded bg-white/10 px-3 py-2">Export CSV</button>
            </div>
            <div className="text-sm opacity-75">Rows loaded: {csvRows.length} • Results: {out.length}</div>
            <div className="overflow-auto border border-white/10 rounded">
                <table className="w-full text-sm">
                    <thead><tr>
                        <th className="p-2 text-left">SKU</th><th className="p-2 text-left">Collection</th><th className="p-2">Verdict/Mode</th><th className="p-2">Demand</th><th className="p-2">Momentum</th><th className="p-2">Saturation</th><th className="p-2">Freshness</th><th className="p-2">StyleFit</th><th className="p-2 text-left">Summary</th>
                    </tr></thead>
                    <tbody>
                        {out.map((r, i) => (
                            <tr key={i} className="odd:bg-white/5">
                                <td className="p-2">{r.sku}</td>
                                <td className="p-2">{r.collection}</td>
                                <td className="p-2">{r.verdict || ''} {(r.sources?.includes('gemini') ? '(deep)' : '(quick)')}</td>
                                <td className="p-2">{r.indices?.demand ?? r.demand}</td>
                                <td className="p-2">{r.indices?.momentum ?? r.momentum}</td>
                                <td className="p-2">{r.indices?.saturation ?? r.saturation}</td>
                                <td className="p-2">{r.indices?.freshness ?? r.freshness}</td>
                                <td className="p-2">{r.indices?.styleFit ?? r.styleFit}</td>
                                <td className="p-2">{r.summary}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}