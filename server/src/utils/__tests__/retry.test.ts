/**
 * Tests unitaires pour Retry avec Backoff
 */
import { retryWithBackoff, retryWithStats, RetryPredicates } from '../retry.js';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Succès', () => {
    it('devrait retourner le résultat immédiatement en cas de succès', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('devrait retourner après 1 retry si succès', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(mockFn, {
        maxAttempts: 3,
        initialDelay: 100
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Échecs', () => {
    it('devrait throw après maxAttempts échecs', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(
        retryWithBackoff(mockFn, { maxAttempts: 3, initialDelay: 50 })
      ).rejects.toThrow('fail');

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('devrait respecter shouldRetry', async () => {
      const mockFn = jest.fn().mockRejectedValue({ code: 'NOT_RETRIABLE' });

      await expect(
        retryWithBackoff(mockFn, {
          maxAttempts: 3,
          shouldRetry: (error) => error?.code !== 'NOT_RETRIABLE'
        })
      ).rejects.toMatchObject({ code: 'NOT_RETRIABLE' });

      expect(mockFn).toHaveBeenCalledTimes(1); // Pas de retry
    });
  });

  describe('Backoff exponentiel', () => {
    it('devrait augmenter le délai exponentiellement', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));
      const delays: number[] = [];

      const startTime = Date.now();
      try {
        await retryWithBackoff(mockFn, {
          maxAttempts: 3,
          initialDelay: 100,
          backoffFactor: 2
        });
      } catch {
        // Expected
      }
      const totalTime = Date.now() - startTime;

      // Délais attendus: 100ms + 200ms = 300ms minimum
      expect(totalTime).toBeGreaterThanOrEqual(280); // Tolérance
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('devrait plafonner au maxDelay', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      const startTime = Date.now();
      try {
        await retryWithBackoff(mockFn, {
          maxAttempts: 4,
          initialDelay: 100,
          maxDelay: 150, // Cap à 150ms
          backoffFactor: 3 // 100 → 300 (capped à 150) → 450 (capped à 150)
        });
      } catch {
        // Expected
      }
      const totalTime = Date.now() - startTime;

      // Délais: 100 + 150 + 150 = 400ms max
      expect(totalTime).toBeLessThan(550);
    });
  });
});

describe('retryWithStats', () => {
  it('devrait retourner stats en cas de succès', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const result = await retryWithStats(mockFn, {
      maxAttempts: 3,
      initialDelay: 50
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(2);
    expect(result.totalDuration).toBeGreaterThan(0);
  });

  it('devrait retourner stats en cas d\'échec', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

    const result = await retryWithStats(mockFn, {
      maxAttempts: 2,
      initialDelay: 50
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('fail');
    expect(result.attempts).toBe(2);
  });
});

describe('RetryPredicates', () => {
  describe('networkErrors', () => {
    it('devrait retry sur ECONNREFUSED', () => {
      const error = { code: 'ECONNREFUSED' };
      expect(RetryPredicates.networkErrors(error)).toBe(true);
    });

    it('devrait retry sur ETIMEDOUT', () => {
      const error = { code: 'ETIMEDOUT' };
      expect(RetryPredicates.networkErrors(error)).toBe(true);
    });

    it('ne devrait pas retry sur autre code', () => {
      const error = { code: 'UNKNOWN' };
      expect(RetryPredicates.networkErrors(error)).toBe(false);
    });
  });

  describe('serverErrors', () => {
    it('devrait retry sur status 500', () => {
      const error = { response: { status: 500 } };
      expect(RetryPredicates.serverErrors(error)).toBe(true);
    });

    it('devrait retry sur status 503', () => {
      const error = { status: 503 };
      expect(RetryPredicates.serverErrors(error)).toBe(true);
    });

    it('ne devrait pas retry sur status 400', () => {
      const error = { status: 400 };
      expect(RetryPredicates.serverErrors(error)).toBe(false);
    });

    it('ne devrait pas retry sur status 404', () => {
      const error = { response: { status: 404 } };
      expect(RetryPredicates.serverErrors(error)).toBe(false);
    });
  });

  describe('timeoutOnly', () => {
    it('devrait retry sur ETIMEDOUT', () => {
      const error = { code: 'ETIMEDOUT' };
      expect(RetryPredicates.timeoutOnly(error)).toBe(true);
    });

    it('devrait retry sur TimeoutError', () => {
      const error = { name: 'TimeoutError' };
      expect(RetryPredicates.timeoutOnly(error)).toBe(true);
    });

    it('ne devrait pas retry sur autre erreur', () => {
      const error = { code: 'ECONNREFUSED' };
      expect(RetryPredicates.timeoutOnly(error)).toBe(false);
    });
  });

  describe('standard', () => {
    it('devrait combiner network + server errors', () => {
      expect(RetryPredicates.standard({ code: 'ECONNREFUSED' })).toBe(true);
      expect(RetryPredicates.standard({ status: 500 })).toBe(true);
      expect(RetryPredicates.standard({ status: 400 })).toBe(false);
    });
  });
});
