import type { Thresholds, Weights, Scenario } from './settings';

export type Indices = { demand: number; momentum: number; saturation: number; freshness: number; styleFit: number; };

type Row = {
    velocityUnitsPerDay?: number; st28?: number; st90?: number;
    collection?: string; category?: string; class?: string; colorFamily?: string;
};

function n(v: any) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
function clamp100(x: number) { return Math.max(0, Math.min(100, Math.round(x))); }

export function computeQuickIndices(rows: Row[], weights: Weights, scenario: Scenario): Indices {
    // Simple heuristics: velocity and sell-through drive demand/momentum; saturation inversely from breadth; freshness mildly from recency proxy (st28 vs st90).
    const r = rows.slice(0, 100);
    const vel = r.map(x => n(x.velocityUnitsPerDay));
    const st28 = r.map(x => n(x.st28));
    const st90 = r.map(x => n(x.st90));

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const cap = (x: number) => clamp100(x);

    // Normalize to 0..100 with soft ranges
    const demand = cap(avg(vel) * 8 + avg(st28) * 60);
    const momentum = cap(avg(st28) * 70 + (avg(st28) - avg(st90)) * 100); // recent vs longer
    const saturation = cap(50 - (Math.min(vel.length, 80) / 80) * 40);     // more items implies more saturation
    const freshness = cap(50 + (avg(st28) - avg(st90)) * 120);
    const styleFit = cap(60); // placeholder baseline

    // Scenario nudges (±10 max total)
    const push = (scenario.marketingPush - 0.5) * 10 + (scenario.collabFrequency - 0.5) * 8 + (0.5 - scenario.priceSensitivity) * 4 + (scenario.macroSentiment - 0.5) * 6;

    const blend = (base: number, w: number) => cap(base + push * w * 0.5);
    const out: Indices = {
        demand: blend(demand, weights.demand),
        momentum: blend(momentum, weights.momentum),
        saturation,
        freshness: blend(freshness, weights.freshness),
        styleFit: blend(styleFit, weights.styleFit),
    };
    return out;
}

export function verdictFrom(indices: Indices, t: Thresholds): 'Go' | 'Hold' | 'Skip' {
    const go = (indices.demand >= t.demandGo) && (indices.momentum >= t.momentumGo) && (indices.freshness >= t.freshnessGo);
    if (go) return 'Go';
    const hold = (indices.demand >= t.demandHold) && (indices.momentum >= t.momentumHold) && (indices.freshness >= t.freshnessHold);
    return hold ? 'Hold' : 'Skip';
}