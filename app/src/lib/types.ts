export type Indices = {
    demand: number;
    momentum: number;
    saturation: number;
    freshness: number;
    styleFit: number;
};

export type Explain = {
    mode: 'quick' | 'deep';
    factors: Array<{ label: string; impact: '+' | '-' | '~'; note: string }>;
    weights?: Record<keyof Indices, number>;
    inputs?: Record<string, unknown>;  // e.g. velocity avg, st28/st90 deltas, filters used
};

export type AnalysisResult = {
    summary: string;
    indices: Indices;
    verdict?: 'Go' | 'Hold' | 'Skip';
    sources: string[];          // e.g. ['csv','quick'] or ['gemini']
    confidence?: number;        // 0..100 when deep
    explain?: Explain;
    timestamp?: string;         // ISO
};