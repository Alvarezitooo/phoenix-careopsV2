/**
 * 🔌 Circuit Breaker Pattern
 *
 * Protège le système contre les défaillances en cascade.
 * États : CLOSED (normal) → OPEN (fail) → HALF_OPEN (test recovery)
 */

export enum CircuitState {
  CLOSED = 'CLOSED',      // Tout va bien, requêtes passent
  OPEN = 'OPEN',          // Service down, requêtes bloquées
  HALF_OPEN = 'HALF_OPEN' // Test de récupération
}

export interface CircuitBreakerOptions {
  failureThreshold: number;    // Nombre d'échecs avant ouverture (défaut: 5)
  successThreshold: number;    // Nombre de succès pour fermer (défaut: 2)
  timeout: number;             // Durée en OPEN avant HALF_OPEN (ms, défaut: 60000)
  name?: string;               // Nom du circuit (pour logs)
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  totalCalls: number;
  totalFailures: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;

  // Stats
  private totalCalls: number = 0;
  private totalFailures: number = 0;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  private readonly name: string;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 2;
    this.timeout = options.timeout ?? 60000; // 1 minute
    this.name = options.name ?? 'default';
  }

  /**
   * Exécute une fonction protégée par le circuit breaker
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    this.totalCalls++;

    // Si circuit OPEN, vérifier si on peut tester la récupération
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime) {
        console.warn(
          `[CircuitBreaker:${this.name}] Circuit OPEN - Fallback activé`
        );

        if (fallback) {
          return fallback();
        }

        throw new Error(
          `Circuit breaker is OPEN for ${this.name}. Service temporarily unavailable.`
        );
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
    } catch (error) {
      this.onFailure();

      // Si fallback disponible, l'utiliser
      if (fallback) {
        console.warn(
          `[CircuitBreaker:${this.name}] Échec - Fallback activé`
        );
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Appelé en cas de succès
   */
  private onSuccess(): void {
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
  private onFailure(): void {
    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Échec pendant test de récupération → retour en OPEN
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
      console.error(
        `[CircuitBreaker:${this.name}] Transition: HALF_OPEN → OPEN (recovery failed)`
      );
    } else if (this.failureCount >= this.failureThreshold) {
      // Trop d'échecs en CLOSED → passer en OPEN
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
      console.error(
        `[CircuitBreaker:${this.name}] Transition: CLOSED → OPEN (threshold reached: ${this.failureCount}/${this.failureThreshold})`
      );
    }
  }

  /**
   * Récupère les statistiques du circuit breaker
   */
  getStats(): CircuitBreakerStats {
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
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  /**
   * Force l'état du circuit (utile pour les tests)
   */
  setState(state: CircuitState): void {
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
  private static instances = new Map<string, CircuitBreaker>();

  static get(
    name: string,
    options?: Partial<CircuitBreakerOptions>
  ): CircuitBreaker {
    if (!this.instances.has(name)) {
      this.instances.set(
        name,
        new CircuitBreaker({ ...options, name })
      );
    }
    return this.instances.get(name)!;
  }

  static reset(name: string): void {
    this.instances.get(name)?.reset();
  }

  static resetAll(): void {
    this.instances.forEach(cb => cb.reset());
  }

  static getStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    this.instances.forEach((cb, name) => {
      stats[name] = cb.getStats();
    });
    return stats;
  }
}
