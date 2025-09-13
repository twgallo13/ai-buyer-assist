export type Kpis = {
    diversification?: number;   // 0–100
    dependency?: number;        // 0–100
    markdownPct?: number;       // 0–100
    availability?: number;      // 0–100
};

export async function getKpis(): Promise<Kpis> {
    // TODO: wire to real sources; for now return placeholders safely.
    return {
        diversification: undefined,
        dependency: undefined,
        markdownPct: undefined,
        availability: undefined
    };
}