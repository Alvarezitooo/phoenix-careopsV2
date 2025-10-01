/**
 * 🔄 Retry avec Backoff Exponentiel
 *
 * Retente automatiquement les opérations échouées avec délai croissant.
 */

export interface RetryOptions {
  maxAttempts: number;      // Nombre max de tentatives (défaut: 3)
  initialDelay: number;     // Délai initial en ms (défaut: 1000)
  maxDelay: number;         // Délai max en ms (défaut: 30000)
  backoffFactor: number;    // Facteur multiplicateur (défaut: 2)
  shouldRetry?: (error: any) => boolean; // Fonction pour décider si retry
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
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();

      if (attempt > 1) {
        console.log(
          `[Retry] Succès après ${attempt} tentatives`
        );
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Vérifier si on doit retry
      if (!shouldRetry(error)) {
        console.warn(
          `[Retry] Erreur non retriable:`,
          error instanceof Error ? error.message : error
        );
        throw error;
      }

      // Si dernier attempt, throw
      if (attempt === maxAttempts) {
        console.error(
          `[Retry] Échec après ${maxAttempts} tentatives:`,
          lastError.message
        );
        throw lastError;
      }

      // Log et attente avant retry
      console.warn(
        `[Retry] Tentative ${attempt}/${maxAttempts} échouée - Retry dans ${delay}ms:`,
        lastError.message
      );

      await sleep(delay);

      // Backoff exponentiel avec cap
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Retente avec informations détaillées (pour monitoring)
 */
export async function retryWithStats<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let attempts = 0;

  try {
    const result = await retryWithBackoff(
      async () => {
        attempts++;
        return fn();
      },
      options
    );

    return {
      success: true,
      result,
      attempts,
      totalDuration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      attempts,
      totalDuration: Date.now() - startTime,
    };
  }
}

/**
 * Helper : Sleep promisifié
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Prédicats communs pour shouldRetry
 */
export const RetryPredicates = {
  /**
   * Retry sur erreurs réseau (ECONNREFUSED, ETIMEDOUT, etc.)
   */
  networkErrors: (error: any): boolean => {
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
  serverErrors: (error: any): boolean => {
    const status = error?.response?.status || error?.status;
    return status >= 500 && status < 600;
  },

  /**
   * Retry sur timeout uniquement
   */
  timeoutOnly: (error: any): boolean => {
    return error?.code === 'ETIMEDOUT' || error?.name === 'TimeoutError';
  },

  /**
   * Combinaison : network + server errors
   */
  standard: (error: any): boolean => {
    return (
      RetryPredicates.networkErrors(error) ||
      RetryPredicates.serverErrors(error)
    );
  },
};

/**
 * Decorator pour ajouter retry à une méthode de classe
 */
export function Retry(options: Partial<RetryOptions> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retryWithBackoff(
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}
