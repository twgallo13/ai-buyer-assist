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

// v1.9.3 New Types for Settings CUD
export type PersonaId = 'sneakerhead' | 'lifestyle' | 'performance' | 'kids_youth_parent' | string;

export type BuyerExpectations = {
    targetPriceMax: number;
    focusGender: ('men' | 'women' | 'kids')[];
    sizeNotes?: string;
    riskTolerance: 'low' | 'medium' | 'high';
};

export type RegionWeights = Record<string, number>;

export type IndicesWeights = {
    demand: number;
    momentum: number;
    saturation: number;
    freshness: number;
    styleFit: number;
};

export type DecisionThresholds = {
    demandGo: number;
    momentumGo: number;
    freshnessGo: number;
    demandHold: number;
    momentumHold: number;
    freshnessHold: number;
};

export type Preset = {
    id: PersonaId;
    label: string;
    weights: IndicesWeights;
    thresholds: DecisionThresholds;
    expectations: BuyerExpectations;
};

// Legacy types for backward compatibility
export type Weights = IndicesWeights;
export type Thresholds = DecisionThresholds;