import { getCsvRows } from './csv-store';

export type QueryParts = {
    collection?: string;
    category?: string;
    colorFamily?: string;
    genderTarget?: string;
    text?: string;
};

export function buildQuery(q: QueryParts): string {
    const parts: string[] = [];
    if (q.collection) parts.push(`collection:"${q.collection}"`);
    if (q.category) parts.push(`category:"${q.category}"`);
    if (q.colorFamily) parts.push(`colorFamily:"${q.colorFamily}"`);
    if (q.genderTarget) parts.push(`genderTarget:"${q.genderTarget}"`);
    if (q.text) parts.push(q.text.trim());
    return parts.join(' AND ');
}

export function uniqueValues(field: string, limit = 50): string[] {
    const rows = getCsvRows();
    const vals = new Set<string>();
    for (const r of rows) {
        const v = String(r[field] ?? r[field.replace(/ /g, '')] ?? '').trim();
        if (v) vals.add(v);
        if (vals.size >= limit) break;
    }
    return Array.from(vals).sort();
}