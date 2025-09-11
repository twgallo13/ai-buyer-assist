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
};

export type Indices = {
    demand?: number;
    momentum?: number;
    saturation?: number;
    freshness?: number;
    styleFit?: number;
};

export type DeepResult = {
    summary: string;
    indices?: Indices;
    sources?: string[];
};