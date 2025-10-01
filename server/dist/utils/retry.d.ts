/**
 * 🔄 Retry avec Backoff Exponentiel
 *
 * Retente automatiquement les opérations échouées avec délai croissant.
 */
export interface RetryOptions {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
    shouldRetry?: (error: any) => boolean;
}
export interface RetryResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: number;
    totalDuration: number;
}
/**
 * Retente une fonction avec backoff exponentiel
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
/**
 * Retente avec informations détaillées (pour monitoring)
 */
export declare function retryWithStats<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<RetryResult<T>>;
/**
 * Prédicats communs pour shouldRetry
 */
export declare const RetryPredicates: {
    /**
     * Retry sur erreurs réseau (ECONNREFUSED, ETIMEDOUT, etc.)
     */
    networkErrors: (error: any) => boolean;
    /**
     * Retry sur codes HTTP 5xx (erreurs serveur)
     */
    serverErrors: (error: any) => boolean;
    /**
     * Retry sur timeout uniquement
     */
    timeoutOnly: (error: any) => boolean;
    /**
     * Combinaison : network + server errors
     */
    standard: (error: any) => boolean;
};
/**
 * Decorator pour ajouter retry à une méthode de classe
 */
export declare function Retry(options?: Partial<RetryOptions>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=retry.d.ts.map