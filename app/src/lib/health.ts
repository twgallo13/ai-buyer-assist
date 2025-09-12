export interface HealthStatus {
    ok: boolean;
    message?: string;
    apiKeyConfigured?: boolean;
}

export async function checkHealth(): Promise<HealthStatus> {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            const data = await response.json();
            return {
                ok: data.ok,
                apiKeyConfigured: data.apiKeyConfigured,
                message: data.message
            };
        } else {
            return {
                ok: false,
                message: 'Health check failed'
            };
        }
    } catch (error) {
        return {
            ok: false,
            message: 'Unable to connect to API'
        };
    }
}