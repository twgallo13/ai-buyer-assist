export type CsvRow = Record<string, unknown>;

let _rows: CsvRow[] = [];
let _ver = 0;

type Sub = (rows: CsvRow[]) => void;
const subs = new Set<Sub>();

export function setCsvRows(rows: CsvRow[]) {
    _rows = Array.isArray(rows) ? rows : [];
    _ver++;
    subs.forEach(s => s(_rows));
}

export function getCsvRows() {
    return _rows;
}

export function subscribeCsv(fn: Sub) {
    subs.add(fn);
    return () => { subs.delete(fn); };
}

export function getCsvVersion() {
    return _ver;
}