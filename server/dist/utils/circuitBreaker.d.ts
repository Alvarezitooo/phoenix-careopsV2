/**
 * 🔌 Circuit Breaker Pattern
 *
 * Protège le système contre les défaillances en cascade.
 * États : CLOSED (normal) → OPEN (fail) → HALF_OPEN (test recovery)
 */
export declare enum CircuitState {
    CLOSED = "CLOSED",// Tout va bien, requêtes passent
    OPEN = "OPEN",// Service down, requêtes bloquées
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    name?: string;
}
export interface CircuitBreakerStats {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime?: number;
    totalCalls: number;
    totalFailures: number;
}
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime?;
    private nextAttemptTime?;
    private totalCalls;
    private totalFailures;
    private readonly failureThreshold;
    private readonly successThreshold;
    private readonly timeout;
    private readonly name;
    constructor(options?: Partial<CircuitBreakerOptions>);
    /**
     * Exécute une fonction protégée par le circuit breaker
     */
    execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T>;
    /**
     * Appelé en cas de succès
     */
    private onSuccess;
    /**
     * Appelé en cas d'échec
     */
    private onFailure;
    /**
     * Récupère les statistiques du circuit breaker
     */
    getStats(): CircuitBreakerStats;
    /**
     * Réinitialise le circuit breaker (utile pour les tests)
     */
    reset(): void;
    /**
     * Force l'état du circuit (utile pour les tests)
     */
    setState(state: CircuitState): void;
}
/**
 * Factory pour créer des circuit breakers nommés
 */
export declare class CircuitBreakerFactory {
    private static instances;
    static get(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker;
    static reset(name: string): void;
    static resetAll(): void;
    static getStats(): Record<string, CircuitBreakerStats>;
}
//# sourceMappingURL=circuitBreaker.d.ts.map