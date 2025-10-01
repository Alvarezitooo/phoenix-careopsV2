/**
 * 🔄 Retry avec Backoff Exponentiel
 *
 * Retente automatiquement les opérations échouées avec délai croissant.
 */
/**
 * Retente une fonction avec backoff exponentiel
 */
export async function retryWithBackoff(fn, options = {}) {
    const { maxAttempts = 3, initialDelay = 1000, maxDelay = 30000, backoffFactor = 2, shouldRetry = () => true, } = options;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await fn();
            if (attempt > 1) {
                console.log(`[Retry] Succès après ${attempt} tentatives`);
            }
            return result;
        }
        catch (error) {
            lastError = error;
            // Vérifier si on doit retry
            if (!shouldRetry(error)) {
                console.warn(`[Retry] Erreur non retriable:`, error instanceof Error ? error.message : error);
                throw error;
            }
            // Si dernier attempt, throw
            if (attempt === maxAttempts) {
                console.error(`[Retry] Échec après ${maxAttempts} tentatives:`, lastError.message);
                throw lastError;
            }
            // Log et attente avant retry
            console.warn(`[Retry] Tentative ${attempt}/${maxAttempts} échouée - Retry dans ${delay}ms:`, lastError.message);
            await sleep(delay);
            // Backoff exponentiel avec cap
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }
    throw lastError;
}
/**
 * Retente avec informations détaillées (pour monitoring)
 */
export async function retryWithStats(fn, options = {}) {
    const startTime = Date.now();
    let attempts = 0;
    try {
        const result = await retryWithBackoff(async () => {
            attempts++;
            return fn();
        }, options);
        return {
            success: true,
            result,
            attempts,
            totalDuration: Date.now() - startTime,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error,
            attempts,
            totalDuration: Date.now() - startTime,
        };
    }
}
/**
 * Helper : Sleep promisifié
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Prédicats communs pour shouldRetry
 */
export const RetryPredicates = {
    /**
     * Retry sur erreurs réseau (ECONNREFUSED, ETIMEDOUT, etc.)
     */
    networkErrors: (error) => {
        const code = error?.code;
        return [
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ENETUNREACH',
            'EAI_AGAIN',
        ].includes(code);
    },
    /**
     * Retry sur codes HTTP 5xx (erreurs serveur)
     */
    serverErrors: (error) => {
        const status = error?.response?.status || error?.status;
        return status >= 500 && status < 600;
    },
    /**
     * Retry sur timeout uniquement
     */
    timeoutOnly: (error) => {
        return error?.code === 'ETIMEDOUT' || error?.name === 'TimeoutError';
    },
    /**
     * Combinaison : network + server errors
     */
    standard: (error) => {
        return (RetryPredicates.networkErrors(error) ||
            RetryPredicates.serverErrors(error));
    },
};
/**
 * Decorator pour ajouter retry à une méthode de classe
 */
export function Retry(options = {}) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            return retryWithBackoff(() => originalMethod.apply(this, args), options);
        };
        return descriptor;
    };
}
//# sourceMappingURL=retry.js.map