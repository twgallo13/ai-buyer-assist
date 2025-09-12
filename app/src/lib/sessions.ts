import type { AnalysisResult } from './types';

const KEY = 'aba_sessions_v1';

export type SessionItem = AnalysisResult & { id: string };

function read(): SessionItem[] {
    try {
        return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
        return [];
    }
}

function write(arr: SessionItem[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(arr));
    } catch {
        // Ignore storage errors
    }
}

export function saveSession(r: AnalysisResult): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const arr = read();
    arr.unshift({ ...r, id });
    write(arr);
    return id;
}

export function listSessions(): SessionItem[] {
    return read();
}

export function getSession(id: string): SessionItem | null {
    return read().find(x => x.id === id) || null;
}

export function deleteSession(id: string): void {
    write(read().filter(x => x.id !== id));
}

export function clearSessions(): void {
    write([]);
}