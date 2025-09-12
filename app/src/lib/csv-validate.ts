export type CsvIssue =
    | { type: 'missingHeader'; header: string }
    | { type: 'badType'; header: string; rowIndex: number; value: unknown; expected: 'number' | 'string' }
    | { type: 'emptyRequired'; header: string; rowIndex: number };

export type CsvValidation = {
    ok: boolean;
    requiredPresent: string[];
    optionalPresent: string[];
    issues: CsvIssue[];
};

const REQUIRED = ['SKU', 'Product Name', 'Collection', 'Category', 'Class', 'Velocity Units/Day'] as const;
const OPTIONAL = ['MSRP', 'Color Family', 'Material', 'Gender Target', 'Historic Sell-through 28d', 'Historic Sell-through 90d'] as const;

const n = (x: unknown) => (x === '' || x == null ? NaN : Number(x));

export function validateCsv(headers: string[], rows: Record<string, unknown>[]): CsvValidation {
    const issues: CsvIssue[] = [];

    // headers
    for (const h of REQUIRED) {
        if (!headers.includes(h)) issues.push({ type: 'missingHeader', header: h });
    }

    // basic type checks (lightweight)
    const numHeaders: Record<string, true> = {
        'Velocity Units/Day': true,
        'MSRP': true,
        'Historic Sell-through 28d': true,
        'Historic Sell-through 90d': true,
    };

    rows.forEach((r, idx) => {
        // required non-empty
        for (const h of REQUIRED) {
            const v = r[h];
            if (v === '' || v == null) issues.push({ type: 'emptyRequired', header: h, rowIndex: idx });
        }
        // numeric columns sanity
        for (const h of Object.keys(numHeaders)) {
            if (h in r) {
                const val = r[h];
                if (val !== '' && val != null && Number.isNaN(n(val))) {
                    issues.push({ type: 'badType', header: h, rowIndex: idx, value: val, expected: 'number' });
                }
            }
        }
    });

    const ok = !issues.some(i => i.type === 'missingHeader');
    return {
        ok,
        requiredPresent: REQUIRED.filter(h => headers.includes(h)),
        optionalPresent: OPTIONAL.filter(h => headers.includes(h)),
        issues,
    };
}

export const REQUIRED_HEADERS = Array.from(REQUIRED);
export const OPTIONAL_HEADERS = Array.from(OPTIONAL);