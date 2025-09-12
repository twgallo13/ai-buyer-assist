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

export type Citation = { title: string; url: string; source: string };

export type RegionWeights = Record<string, number>;

export type Preset = {
    id: string;
    name?: string;
    label: string;
    description?: string;
    scenario?: string;
    weights: Record<keyof Indices, number>;
    thresholds: Record<string, number>;
    regionWeights?: RegionWeights;
    expectations?: Record<string, unknown>;
};

export type Query = {
    intent: 'sku' | 'brand' | 'collection' | 'style' | 'color' | 'question';
    terms: string[];
    filters: {
        collection?: string[];
        category?: string[];
        colorFamily?: string[];
        gender?: string[];
        brand?: string[];
        class?: string[];
    };
    horizonMonths: number;
};

export type AnalysisResult = {
    verdict: 'Go' | 'Hold' | 'Skip';
    demand: number;
    momentum: number;
    saturation: number;
    freshness: number;
    styleFit: number;
    confidence?: number;
    summary?: string;
    citations?: Citation[];
    sources?: string[];
    timestamp?: number;
    indices?: Indices;  // Keep for backward compatibility
    explain?: Explain;
    runId?: string;     // For sharing/export v1.9
};

export type SavedRun = {
    id: string;
    timestamp: number;
    query: string;
    mode: 'quick' | 'deep';
    result: AnalysisResult;
};