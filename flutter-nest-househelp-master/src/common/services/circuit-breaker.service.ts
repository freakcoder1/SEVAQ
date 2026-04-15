import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit Breaker Service
 * 
 * Implements circuit breaker pattern to prevent cascading failures
 * when external services are unavailable.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failure threshold exceeded, requests blocked immediately
 * - HALF_OPEN: Recovery period, allow test requests
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  private readonly circuitStates = new Map<string, {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime: number;
    successCount: number;
  }>();

  private readonly DEFAULT_CONFIG = {
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenSuccessThreshold: 2,
  };

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    circuitName: string,
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    config?: Partial<typeof this.DEFAULT_CONFIG>
  ): Promise<T> {
    const state = this.getCircuitState(circuitName);
    const effectiveConfig = { ...this.DEFAULT_CONFIG, ...config };

    if (state.state === 'OPEN') {
      const timeSinceFailure = Date.now() - state.lastFailureTime;

      if (timeSinceFailure > effectiveConfig.resetTimeout) {
        this.logger.log(`Circuit ${circuitName} entering HALF_OPEN state`);
        state.state = 'HALF_OPEN';
        state.successCount = 0;
      } else {
        this.logger.debug(`Circuit ${circuitName} is OPEN, using fallback`);
        return fallback();
      }
    }

    try {
      const result = await operation();

      if (state.state === 'HALF_OPEN') {
        state.successCount++;
        if (state.successCount >= effectiveConfig.halfOpenSuccessThreshold) {
          this.logger.log(`Circuit ${circuitName} closing after successful recovery`);
          state.state = 'CLOSED';
          state.failureCount = 0;
          state.successCount = 0;
        }
      }

      state.failureCount = 0;
      return result;

    } catch (error) {
      state.failureCount++;
      state.lastFailureTime = Date.now();

      if (state.state === 'HALF_OPEN') {
        this.logger.warn(`Circuit ${circuitName} failed during recovery, reopening`);
        state.state = 'OPEN';
      } else if (state.failureCount >= effectiveConfig.failureThreshold) {
        this.logger.error(`Circuit ${circuitName} OPEN after ${state.failureCount} consecutive failures`);
        state.state = 'OPEN';
      }

      this.logger.debug(`Circuit ${circuitName} failure count: ${state.failureCount}`);
      return fallback();
    }
  }

  /**
   * Get or create circuit state
   */
  private getCircuitState(name: string) {
    if (!this.circuitStates.has(name)) {
      this.circuitStates.set(name, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
      });
    }
    return this.circuitStates.get(name)!;
  }

  /**
   * Get current circuit status for monitoring
   */
  getCircuitStatus(circuitName: string) {
    return this.circuitStates.get(circuitName);
  }

  /**
   * Manually reset circuit
   */
  resetCircuit(circuitName: string) {
    this.circuitStates.delete(circuitName);
    this.logger.log(`Circuit ${circuitName} manually reset`);
  }

  /**
   * Get all circuit statuses for monitoring
   */
  getAllStatuses() {
    const statuses: Record<string, any> = {};
    
    for (const [name, state] of this.circuitStates.entries()) {
      statuses[name] = {
        state: state.state,
        failureCount: state.failureCount,
        lastFailureTime: state.lastFailureTime,
        lastFailureAgo: state.lastFailureTime ? Date.now() - state.lastFailureTime : null,
        successCount: state.successCount
      };
    }

    return {
      totalCircuits: this.circuitStates.size,
      circuits: statuses,
      summary: {
        closed: Array.from(this.circuitStates.values()).filter(s => s.state === 'CLOSED').length,
        open: Array.from(this.circuitStates.values()).filter(s => s.state === 'OPEN').length,
        halfOpen: Array.from(this.circuitStates.values()).filter(s => s.state === 'HALF_OPEN').length
      }
    };
  }
}
