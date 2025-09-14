// Unified API utilities for version management and consistent fetching

const FALLBACK_VERSION = 'v2.1.9m';
let cachedVersion: string | null = null;

/**
 * Unified version fetching with caching and consistent fallback
 * Calls GET /api/version with 2s timeout
 * Returns API version if ok; otherwise returns fallback v2.1.9m
 */
export const getApiVersion = async (): Promise<string> => {
    // Return cached version if available
    if (cachedVersion) {
        return cachedVersion;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch('/api/version', {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            const version = data.version || FALLBACK_VERSION;
            cachedVersion = version; // Cache the result
            return version;
        } else {
            cachedVersion = FALLBACK_VERSION;
            return FALLBACK_VERSION;
        }
    } catch (error) {
        // Network error, timeout, or API down
        cachedVersion = FALLBACK_VERSION;
        return FALLBACK_VERSION;
    }
};

/**
 * Clear cached version (useful for testing or forced refresh)
 */
export const clearVersionCache = (): void => {
    cachedVersion = null;
};

/**
 * Get current fallback version string
 */
export const getFallbackVersion = (): string => {
    return FALLBACK_VERSION;
};
