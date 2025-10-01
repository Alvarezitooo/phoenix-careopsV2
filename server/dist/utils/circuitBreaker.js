/**
 * 🔌 Circuit Breaker Pattern
 *
 * Protège le système contre les défaillances en cascade.
 * États : CLOSED (normal) → OPEN (fail) → HALF_OPEN (test recovery)
 */
export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN"; // Test de récupération
})(CircuitState || (CircuitState = {}));
export class CircuitBreaker {
    state = CircuitState.CLOSED;
    failureCount = 0;
    successCount = 0;
    lastFailureTime;
    nextAttemptTime;
    // Stats
    totalCalls = 0;
    totalFailures = 0;
    failureThreshold;
    successThreshold;
    timeout;
    name;
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold ?? 5;
        this.successThreshold = options.successThreshold ?? 2;
        this.timeout = options.timeout ?? 60000; // 1 minute
        this.name = options.name ?? 'default';
    }
    /**
     * Exécute une fonction protégée par le circuit breaker
     */
    async execute(fn, fallback) {
        this.totalCalls++;
        // Si circuit OPEN, vérifier si on peut tester la récupération
        if (this.state === CircuitState.OPEN) {
            if (this.nextAttemptTime && Date.now() < this.nextAttemptTime) {
                console.warn(`[CircuitBreaker:${this.name}] Circuit OPEN - Fallback activé`);
                if (fallback) {
                    return fallback();
                }
                throw new Error(`Circuit breaker is OPEN for ${this.name}. Service temporarily unavailable.`);
            }
            // Passer en HALF_OPEN pour tester
            this.state = CircuitState.HALF_OPEN;
            this.successCount = 0;
            console.log(`[CircuitBreaker:${this.name}] Transition: OPEN → HALF_OPEN`);
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            // Si fallback disponible, l'utiliser
            if (fallback) {
                console.warn(`[CircuitBreaker:${this.name}] Échec - Fallback activé`);
                return fallback();
            }
            throw error;
        }
    }
    /**
     * Appelé en cas de succès
     */
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.successCount = 0;
                console.log(`[CircuitBreaker:${this.name}] Transition: HALF_OPEN → CLOSED (recovered)`);
            }
        }
    }
    /**
     * Appelé en cas d'échec
     */
    onFailure() {
        this.failureCount++;
        this.totalFailures++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            // Échec pendant test de récupération → retour en OPEN
            this.state = CircuitState.OPEN;
            this.nextAttemptTime = Date.now() + this.timeout;
            console.error(`[CircuitBreaker:${this.name}] Transition: HALF_OPEN → OPEN (recovery failed)`);
        }
        else if (this.failureCount >= this.failureThreshold) {
            // Trop d'échecs en CLOSED → passer en OPEN
            this.state = CircuitState.OPEN;
            this.nextAttemptTime = Date.now() + this.timeout;
            console.error(`[CircuitBreaker:${this.name}] Transition: CLOSED → OPEN (threshold reached: ${this.failureCount}/${this.failureThreshold})`);
        }
    }
    /**
     * Récupère les statistiques du circuit breaker
     */
    getStats() {
        return {
            state: this.state,
            failures: this.failureCount,
            successes: this.successCount,
            lastFailureTime: this.lastFailureTime,
            totalCalls: this.totalCalls,
            totalFailures: this.totalFailures,
        };
    }
    /**
     * Réinitialise le circuit breaker (utile pour les tests)
     */
    reset() {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = undefined;
        this.nextAttemptTime = undefined;
    }
    /**
     * Force l'état du circuit (utile pour les tests)
     */
    setState(state) {
        this.state = state;
        if (state === CircuitState.OPEN) {
            this.nextAttemptTime = Date.now() + this.timeout;
        }
    }
}
/**
 * Factory pour créer des circuit breakers nommés
 */
export class CircuitBreakerFactory {
    static instances = new Map();
    static get(name, options) {
        if (!this.instances.has(name)) {
            this.instances.set(name, new CircuitBreaker({ ...options, name }));
        }
        return this.instances.get(name);
    }
    static reset(name) {
        this.instances.get(name)?.reset();
    }
    static resetAll() {
        this.instances.forEach(cb => cb.reset());
    }
    static getStats() {
        const stats = {};
        this.instances.forEach((cb, name) => {
            stats[name] = cb.getStats();
        });
        return stats;
    }
}
//# sourceMappingURL=circuitBreaker.js.map