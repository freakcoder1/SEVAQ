import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

/**
 * Async Worker Pool Service
 * 
 * Background job processing queue with concurrency control
 * Offloads expensive operations from API request threads
 * Provides graceful shutdown with job completion
 */
@Injectable()
export class AsyncWorkerPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(AsyncWorkerPoolService.name);

  private readonly queue: Array<{
    id: string;
    fn: () => Promise<void>;
    priority: number;
  }> = [];

  private activeWorkers = 0;
  private isShuttingDown = false;
  private isProcessing = false;

  private readonly DEFAULT_CONCURRENCY = 4;
  private readonly concurrency: number;

  constructor() {
    this.concurrency = this.DEFAULT_CONCURRENCY;
  }

  /**
   * Submit job to worker pool
   */
  submitJob(fn: () => Promise<void>, priority = 0): string {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down, not accepting new jobs');
    }

    const jobId = crypto.randomUUID();

    this.queue.push({
      id: jobId,
      fn,
      priority,
    });

    // Sort queue by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);

    this.logger.debug(`Submitted job ${jobId.substring(0, 8)}, queue length: ${this.queue.length}`);

    setImmediate(() => this.processQueue());

    return jobId;
  }

  /**
   * Process jobs from queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeWorkers < this.concurrency && !this.isShuttingDown) {
      const job = this.queue.shift();

      if (!job) {
        break;
      }

      this.activeWorkers++;

      setImmediate(async () => {
        try {
          this.logger.debug(`Running job ${job.id.substring(0, 8)}`);
          await job.fn();
          this.logger.debug(`Completed job ${job.id.substring(0, 8)}`);
        } catch (error) {
          this.logger.error(`Job ${job.id.substring(0, 8)} failed: ${error.message}`, error.stack);
        } finally {
          this.activeWorkers--;
          setImmediate(() => this.processQueue());
        }
      });
    }

    this.isProcessing = false;
  }

  /**
   * Get current worker pool statistics
   */
  getStats() {
    return {
      queuedJobs: this.queue.length,
      activeWorkers: this.activeWorkers,
      concurrency: this.concurrency,
      isShuttingDown: this.isShuttingDown,
    };
  }

  /**
   * Wait for all currently active jobs to complete
   */
  async waitForIdle(timeoutMs = 30000): Promise<void> {
    const start = Date.now();

    while (this.activeWorkers > 0 || this.queue.length > 0) {
      if (Date.now() - start > timeoutMs) {
        this.logger.warn(`Timeout waiting for worker pool idle, ${this.activeWorkers} active, ${this.queue.length} queued`);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Graceful shutdown handler
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log(`Initiating graceful shutdown for worker pool (${this.activeWorkers} active, ${this.queue.length} queued)`);

    this.isShuttingDown = true;
    await this.waitForIdle();

    this.logger.log('Worker pool shutdown complete');
  }

  /**
   * Clear all queued jobs
   */
  clearQueue(): void {
    const clearedCount = this.queue.length;
    this.queue.length = 0;

    if (clearedCount > 0) {
      this.logger.log(`Cleared ${clearedCount} jobs from queue`);
    }
  }
}
