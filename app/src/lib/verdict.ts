import type { Scenario } from './settings';
import type { Weights, Thresholds } from './types';
import { getUniqueColorTags, groupColorTagsByPalette } from './color-palette';
import type { Indices, Explain } from './types';

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

export function explainQuick(rows: Row[], weights: Weights, scenario: Scenario): Explain {
    const r = rows.slice(0, 100);
    const vel = r.map(x => n(x.velocityUnitsPerDay));
    const st28 = r.map(x => n(x.st28));
    const st90 = r.map(x => n(x.st90));
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const v = avg(vel);
    const s28 = avg(st28);
    const s90 = avg(st90);
    const delta = s28 - s90;

    // v1.9.5: Color analysis
    const uniqueColors = getUniqueColorTags(r as Array<{colorTags?: string[]}>);
    const paletteGroups = groupColorTagsByPalette(uniqueColors);
    const dominantPalette = Object.entries(paletteGroups)
        .sort(([,a], [,b]) => b.length - a.length)[0];

    const factors: Explain['factors'] = [
        {
            label: 'Velocity',
            impact: v > 2 ? '+' : v < 1 ? '-' : '~',
            note: `Avg units/day ≈ ${v.toFixed(2)}`
        },
        {
            label: 'Sell-through (28d)',
            impact: s28 > 0.6 ? '+' : s28 < 0.3 ? '-' : '~',
            note: `ST28 ≈ ${(s28 * 100).toFixed(0)}%`
        },
        {
            label: 'Momentum (Δ28-90)',
            impact: delta > 0.05 ? '+' : delta < -0.03 ? '-' : '~',
            note: `Δ ≈ ${(delta * 100).toFixed(1)} pts`
        },
        {
            label: 'Scenario push',
            impact: scenario.marketingPush > 0.6 ? '+' : scenario.priceSensitivity > 0.7 ? '-' : '~',
            note: `Mkt:${scenario.marketingPush} Collab:${scenario.collabFrequency} PriceSens:${scenario.priceSensitivity}`
        },
    ];

    // Add color-based factor if we have color data
    if (uniqueColors.length > 0 && dominantPalette) {
        const [paletteName, paletteColors] = dominantPalette;
        const colorDiversity = uniqueColors.length;
        const isPaletteConcentrated = paletteColors.length / uniqueColors.length > 0.6;
        
        let colorImpact: '+' | '-' | '~' = '~';
        let colorNote = `${colorDiversity} colors, ${paletteName} dominant`;
        
        // Analyze color impact based on palette and diversity
        if (paletteName === 'neon' && isPaletteConcentrated) {
            colorImpact = '+';
            colorNote += ' — bright colors trending';
        } else if (paletteName === 'mono' && isPaletteConcentrated) {
            colorImpact = '+';
            colorNote += ' — neutral palette versatile';
        } else if (paletteName === 'primary' && isPaletteConcentrated) {
            colorImpact = '~';
            colorNote += ' — classic colors stable';
        } else if (colorDiversity > 10) {
            colorImpact = '-';
            colorNote += ' — high diversity may saturate';
        } else if (colorDiversity < 3) {
            colorImpact = '-';
            colorNote += ' — limited options may constrain';
        }

        factors.push({
            label: 'Color Strategy',
            impact: colorImpact,
            note: colorNote
        });
    }

    return {
        mode: 'quick',
        factors,
        weights,
        inputs: { velAvg: v, st28: s28, st90: s90, delta, colors: uniqueColors.length }
    };
}