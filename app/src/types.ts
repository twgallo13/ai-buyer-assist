export type Row = {
    sku: string;
    productName?: string;
    collection?: string;
    category?: string;
    class?: string;
    velocityUnitsPerDay?: number;
    st28?: number;  // Historic Sell-through 28d
    st90?: number;  // Historic Sell-through 90d
    colorFamily?: string;
    colorTags?: string[];  // v1.9.5: Multi-color support - parsed from colorFamily
};

export type Indices = {
    demand?: number;
    momentum?: number;
    saturation?: number;
    freshness?: number;
    styleFit?: number;
};

export type Citation = { title: string; url: string; source: string };

export type DeepResult = {
    mode?: 'real' | 'mock-nokey' | 'mock-fallback';
    summary: string;
    indices?: Indices;
    sources?: string[];
    confidence?: number;
    citations?: Citation[];
};