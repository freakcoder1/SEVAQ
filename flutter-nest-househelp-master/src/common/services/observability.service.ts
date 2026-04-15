import { Injectable, Logger } from '@nestjs/common';

/**
 * Observability Service
 * 
 * Centralized metrics collection, tracing and performance monitoring
 * Tracks operation latencies, error rates, and system health indicators
 */
@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  private readonly operationTimings = new Map<string, {
    count: number;
    totalTime: number;
    minTime: number;
    maxTime: number;
  }>();

  private readonly errorCounters = new Map<string, number>();
  private readonly requestCounters = new Map<string, number>();

  /**
   * Track operation execution time
   */
  async trackOperation<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
    const startTime = process.hrtime.bigint();

    try {
      const result = await fn();
      this.recordSuccess(operationName, startTime);
      return result;
    } catch (error) {
      this.recordError(operationName, error);
      throw error;
    }
  }

  /**
   * Record successful operation timing
   */
  private recordSuccess(operationName: string, startTime: bigint): void {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1000000;

    const existing = this.operationTimings.get(operationName);

    if (!existing) {
      this.operationTimings.set(operationName, {
        count: 1,
        totalTime: durationMs,
        minTime: durationMs,
        maxTime: durationMs,
      });
    } else {
      existing.count++;
      existing.totalTime += durationMs;
      existing.minTime = Math.min(existing.minTime, durationMs);
      existing.maxTime = Math.max(existing.maxTime, durationMs);
    }

    this.incrementCounter(this.requestCounters, operationName);
  }

  /**
   * Record operation error
   */
  private recordError(operationName: string, error: Error): void {
    this.incrementCounter(this.errorCounters, operationName);
    this.logger.error(`Operation failed: ${operationName}`, error.stack);
  }

  /**
   * Increment counter safely
   */
  private incrementCounter(map: Map<string, number>, key: string): void {
    const current = map.get(key) || 0;
    map.set(key, current + 1);
  }

  /**
   * Get operation performance statistics
   */
  getOperationStats(operationName: string) {
    const stats = this.operationTimings.get(operationName);

    if (!stats) {
      return null;
    }

    return {
      count: stats.count,
      averageTime: stats.totalTime / stats.count,
      minTime: stats.minTime,
      maxTime: stats.maxTime,
      totalTime: stats.totalTime,
    };
  }

  /**
   * Get all operation statistics
   */
  getAllOperationStats() {
    const result: Record<string, any> = {};

    for (const [name] of this.operationTimings.entries()) {
      result[name] = this.getOperationStats(name);
    }

    return result;
  }

  /**
   * Get error counts
   */
  getErrorCounts() {
    return Object.fromEntries(this.errorCounters.entries());
  }

  /**
   * Get request counts
   */
  getRequestCounts() {
    return Object.fromEntries(this.requestCounters.entries());
  }

  /**
   * Get complete system health summary
   */
  getHealthSummary() {
    return {
      operations: this.getAllOperationStats(),
      errors: this.getErrorCounts(),
      requests: this.getRequestCounts(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.operationTimings.clear();
    this.errorCounters.clear();
    this.requestCounters.clear();
    this.logger.log('All observability metrics reset');
  }

  /**
   * Log performance warning for slow operations
   */
  checkPerformanceThresholds(): void {
    const WARNING_THRESHOLD_MS = 1000;

    for (const [name, stats] of this.operationTimings.entries()) {
      const avgTime = stats.totalTime / stats.count;

      if (avgTime > WARNING_THRESHOLD_MS) {
        this.logger.warn(`Slow operation detected: ${name} average ${avgTime.toFixed(2)}ms (${stats.count} samples)`);
      }
    }
  }
}
