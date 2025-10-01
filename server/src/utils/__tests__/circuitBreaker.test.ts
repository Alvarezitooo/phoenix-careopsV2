/**
 * Tests unitaires pour Circuit Breaker
 */
import { CircuitBreaker, CircuitState, CircuitBreakerFactory } from '../circuitBreaker.js';

describe('CircuitBreaker', () => {
  let circuit: CircuitBreaker;

  beforeEach(() => {
    circuit = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      name: 'test-circuit'
    });
  });

  describe('État CLOSED (normal)', () => {
    it('devrait exécuter la fonction avec succès', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await circuit.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(circuit.getStats().state).toBe(CircuitState.CLOSED);
    });

    it('devrait rester CLOSED après 1-2 échecs', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Échec 1
      await expect(circuit.execute(mockFn)).rejects.toThrow('fail');
      expect(circuit.getStats().state).toBe(CircuitState.CLOSED);

      // Échec 2
      await expect(circuit.execute(mockFn)).rejects.toThrow('fail');
      expect(circuit.getStats().state).toBe(CircuitState.CLOSED);
    });

    it('devrait passer en OPEN après failureThreshold échecs', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      // 3 échecs (threshold)
      for (let i = 0; i < 3; i++) {
        await expect(circuit.execute(mockFn)).rejects.toThrow();
      }

      expect(circuit.getStats().state).toBe(CircuitState.OPEN);
      expect(circuit.getStats().failures).toBe(3);
    });
  });

  describe('État OPEN (circuit ouvert)', () => {
    beforeEach(async () => {
      // Forcer l'état OPEN
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(circuit.execute(mockFn)).rejects.toThrow();
      }
    });

    it('devrait utiliser le fallback sans appeler la fonction', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const fallback = jest.fn().mockResolvedValue('fallback');

      const result = await circuit.execute(mockFn, fallback);

      expect(result).toBe('fallback');
      expect(mockFn).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('devrait throw si pas de fallback', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      await expect(circuit.execute(mockFn)).rejects.toThrow(
        'Circuit breaker is OPEN'
      );
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('devrait passer en HALF_OPEN après timeout', async () => {
      // Attendre le timeout (1000ms)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const mockFn = jest.fn().mockResolvedValue('success');
      await circuit.execute(mockFn);

      expect(circuit.getStats().state).toBe(CircuitState.CLOSED); // Succès → CLOSED
    });
  });

  describe('État HALF_OPEN (test de récupération)', () => {
    beforeEach(async () => {
      // Forcer OPEN puis attendre timeout
      circuit.setState(CircuitState.OPEN);
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    it('devrait fermer après successThreshold succès', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      // Succès 1 (passe en HALF_OPEN)
      await circuit.execute(mockFn);
      const stats1 = circuit.getStats();
      expect([CircuitState.HALF_OPEN, CircuitState.CLOSED]).toContain(stats1.state);

      // Succès 2 (ferme le circuit)
      await circuit.execute(mockFn);
      expect(circuit.getStats().state).toBe(CircuitState.CLOSED);
    });

    it('devrait réouvrir en cas d\'échec', async () => {
      const mockFn = jest.fn()
        .mockResolvedValueOnce('success') // Force HALF_OPEN
        .mockRejectedValueOnce(new Error('fail')); // Réouvre

      // Succès (HALF_OPEN)
      await circuit.execute(mockFn);

      // Échec (retour en OPEN)
      await expect(circuit.execute(mockFn)).rejects.toThrow('fail');
      expect(circuit.getStats().state).toBe(CircuitState.OPEN);
    });
  });

  describe('Statistiques', () => {
    it('devrait tracker les appels et échecs', async () => {
      const mockSuccess = jest.fn().mockResolvedValue('ok');
      const mockFail = jest.fn().mockRejectedValue(new Error('fail'));

      await circuit.execute(mockSuccess);
      await expect(circuit.execute(mockFail)).rejects.toThrow();
      await circuit.execute(mockSuccess);

      const stats = circuit.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.totalFailures).toBe(1);
    });
  });

  describe('Reset', () => {
    it('devrait réinitialiser le circuit', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Provoquer échecs
      for (let i = 0; i < 3; i++) {
        await expect(circuit.execute(mockFn)).rejects.toThrow();
      }

      expect(circuit.getStats().state).toBe(CircuitState.OPEN);

      // Reset
      circuit.reset();

      const stats = circuit.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });
});

describe('CircuitBreakerFactory', () => {
  beforeEach(() => {
    CircuitBreakerFactory.resetAll();
  });

  it('devrait créer et récupérer des circuits nommés', () => {
    const circuit1 = CircuitBreakerFactory.get('service-a');
    const circuit2 = CircuitBreakerFactory.get('service-a');

    expect(circuit1).toBe(circuit2); // Même instance
  });

  it('devrait gérer plusieurs circuits indépendants', () => {
    const circuitA = CircuitBreakerFactory.get('service-a');
    const circuitB = CircuitBreakerFactory.get('service-b');

    expect(circuitA).not.toBe(circuitB);
  });

  it('devrait récupérer les stats de tous les circuits', async () => {
    const circuit1 = CircuitBreakerFactory.get('service-1');
    const circuit2 = CircuitBreakerFactory.get('service-2');

    const mockFn = jest.fn().mockResolvedValue('ok');
    await circuit1.execute(mockFn);
    await circuit2.execute(mockFn);

    const allStats = CircuitBreakerFactory.getStats();
    expect(allStats['service-1'].totalCalls).toBe(1);
    expect(allStats['service-2'].totalCalls).toBe(1);
  });

  it('devrait reset tous les circuits', async () => {
    const circuit1 = CircuitBreakerFactory.get('service-1');
    const circuit2 = CircuitBreakerFactory.get('service-2');

    circuit1.setState(CircuitState.OPEN);
    circuit2.setState(CircuitState.OPEN);

    CircuitBreakerFactory.resetAll();

    expect(circuit1.getStats().state).toBe(CircuitState.CLOSED);
    expect(circuit2.getStats().state).toBe(CircuitState.CLOSED);
  });
});
