export type CsvRow = Record<string, unknown>;

let _rows: CsvRow[] = [];
let _headers: string[] = [];
let _validation: import('./csv-validate').CsvValidation | null = null;
let _ver = 0;

type Sub = (rows: CsvRow[]) => void;
const subs = new Set<Sub>();

export function setCsv(rows: CsvRow[], headers: string[], validation: import('./csv-validate').CsvValidation){
  _rows = Array.isArray(rows) ? rows : [];
  _headers = Array.isArray(headers) ? headers : [];
  _validation = validation;
  _ver++; subs.forEach(s=>s(_rows));
}

export function setCsvRows(rows: CsvRow[]){ _rows = Array.isArray(rows) ? rows : []; _ver++; subs.forEach(s=>s(_rows)); }
export function getCsvRows(){ return _rows; }
export function getCsvHeaders(){ return _headers; }
export function getCsvValidation(){ return _validation; }
export function subscribeCsv(fn: Sub){ subs.add(fn); return ()=>{subs.delete(fn);}; }
export function getCsvVersion(){ return _ver; }