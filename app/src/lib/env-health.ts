export interface ApiHealth {
    ok: boolean;
    keyPresent: boolean;
    version: string;
}

export async function getApiHealth(): Promise<ApiHealth> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('/api/health', {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        return {
            ok: true,
            keyPresent: data.keyPresent ?? false,
            version: data.version ?? 'v2.1.1',
        };
    } catch (error) {
        console.warn('API health check failed:', error);
        return {
            ok: false,
            keyPresent: false,
            version: 'v2.1.1',
        };
    }
}

export async function getApiVersion(): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch('/api/version', {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.version ?? 'v2.1.1';
    } catch (error) {
        console.warn('Version fetch failed:', error);
        return 'v2.1.1';
    }
}