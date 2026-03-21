import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { Booking } from '../bookings/entities/booking.entity';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  variants: ExperimentVariant[];
  trafficAllocation: number; // percentage of traffic to include in experiment
  metric: string; // primary metric to optimize
  winnerVariantId?: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  assignmentStrategy: AssignmentStrategy;
  trafficPercentage: number;
  metadata: any;
}

export enum AssignmentStrategy {
  NEAREST_FIRST = 'nearest_first',
  HIGHEST_RATED_FIRST = 'highest_rated_first',
  BALANCED_LOAD = 'balanced_load',
  RANDOM = 'random',
  CUSTOM_ALGORITHM = 'custom_algorithm',
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metricValue: number;
  sampleSize: number;
  confidence: number;
  isWinner: boolean;
}

@Injectable()
export class AbTestingService {
  private readonly logger = new Logger(AbTestingService.name);
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, string> = new Map(); // userId -> variantId

  constructor(
    @InjectRepository(Booking)
    private assignmentRepository: Repository<Booking>,
    @InjectRepository(Worker)
    private workerRepository: Repository<Worker>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {
    this.initializeExperiments();
  }

  private initializeExperiments(): void {
    // Initialize default experiments
    const defaultExperiment: Experiment = {
      id: 'assignment-strategy-test',
      name: 'Assignment Strategy Optimization',
      description: 'Testing different worker assignment algorithms',
      status: 'running',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      trafficAllocation: 50, // 50% of assignments
      metric: 'assignment_success_rate',
      variants: [
        {
          id: 'nearest-first',
          name: 'Nearest First',
          assignmentStrategy: AssignmentStrategy.NEAREST_FIRST,
          trafficPercentage: 25,
          metadata: { description: 'Assign to nearest available worker' },
        },
        {
          id: 'highest-rated',
          name: 'Highest Rated First',
          assignmentStrategy: AssignmentStrategy.HIGHEST_RATED_FIRST,
          trafficPercentage: 25,
          metadata: { description: 'Assign to highest rated available worker' },
        },
      ],
    };

    this.experiments.set(defaultExperiment.id, defaultExperiment);
  }

  async getAssignmentStrategy(
    booking: Booking,
    userId: string,
  ): Promise<AssignmentStrategy> {
    const experiment = this.getActiveExperiment('assignment-strategy-test');

    if (
      !experiment ||
      !this.shouldIncludeInExperiment(userId, experiment.trafficAllocation)
    ) {
      return AssignmentStrategy.BALANCED_LOAD; // Default strategy
    }

    const variantId = this.getVariantForUser(userId, experiment);
    const variant = experiment.variants.find((v) => v.id === variantId);

    if (variant) {
      this.logger.log(
        `User ${userId} assigned to variant ${variant.name} with strategy ${variant.assignmentStrategy}`,
      );
      return variant.assignmentStrategy;
    }

    return AssignmentStrategy.BALANCED_LOAD;
  }

  private getActiveExperiment(experimentId: string): Experiment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const now = new Date();
    if (
      experiment.status === 'running' &&
      now >= experiment.startDate &&
      now <= experiment.endDate
    ) {
      return experiment;
    }

    return null;
  }

  private shouldIncludeInExperiment(
    userId: string,
    trafficAllocation: number,
  ): boolean {
    // Simple hash-based allocation
    const hash = this.hashUserId(userId);
    return hash % 100 < trafficAllocation;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getVariantForUser(userId: string, experiment: Experiment): string {
    const existingVariant = this.userAssignments.get(userId);
    if (existingVariant) {
      return existingVariant;
    }

    // Assign user to a variant based on traffic allocation
    const hash = this.hashUserId(userId);
    const randomValue = hash % 100;

    let cumulativePercentage = 0;
    for (const variant of experiment.variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (randomValue < cumulativePercentage) {
        this.userAssignments.set(userId, variant.id);
        return variant.id;
      }
    }

    // Fallback to first variant
    const firstVariant = experiment.variants[0];
    this.userAssignments.set(userId, firstVariant.id);
    return firstVariant.id;
  }

  async recordExperimentResult(
    experimentId: string,
    variantId: string,
    bookingId: string,
    success: boolean,
    assignmentTime: number,
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // Store experiment result in database or analytics system
    this.logger.log(
      `Experiment ${experimentId}: Variant ${variantId}, Booking ${bookingId}, Success: ${success}, Time: ${assignmentTime}`,
    );

    // Could integrate with analytics database here
    await this.storeExperimentResult(
      experimentId,
      variantId,
      bookingId,
      success,
      assignmentTime,
    );
  }

  private async storeExperimentResult(
    experimentId: string,
    variantId: string,
    bookingId: string,
    success: boolean,
    assignmentTime: number,
  ): Promise<void> {
    // Implementation would store results in a dedicated analytics table
    // For now, just logging
  }

  async getExperimentResults(
    experimentId: string,
  ): Promise<ExperimentResult[]> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return [];

    // Calculate results for each variant
    const results: ExperimentResult[] = [];

    for (const variant of experiment.variants) {
      const result = await this.calculateVariantResult(
        experimentId,
        variant.id,
      );
      results.push(result);
    }

    // Determine winner based on primary metric
    const winner = this.determineWinner(results, experiment.metric);
    if (winner) {
      experiment.winnerVariantId = winner.variantId;
    }

    return results;
  }

  private async calculateVariantResult(
    experimentId: string,
    variantId: string,
  ): Promise<ExperimentResult> {
    // Query database for assignments related to this variant
    // This would require storing experiment assignment metadata
    const sampleSize = Math.floor(Math.random() * 100) + 50; // Mock data
    const successRate = Math.random() * 0.3 + 0.7; // 70-100%
    const confidence = Math.random() * 0.2 + 0.8; // 80-100%

    return {
      experimentId,
      variantId,
      metricValue: successRate,
      sampleSize,
      confidence,
      isWinner: false,
    };
  }

  private determineWinner(
    results: ExperimentResult[],
    metric: string,
  ): ExperimentResult | null {
    if (results.length === 0) return null;

    // Sort by metric value (higher is better for success rate)
    results.sort((a, b) => b.metricValue - a.metricValue);

    const winner = results[0];

    // Check if winner has sufficient confidence
    if (winner.confidence > 0.95) {
      winner.isWinner = true;
      return winner;
    }

    return null;
  }

  createExperiment(experiment: Omit<Experiment, 'id'>): Experiment {
    const newExperiment: Experiment = {
      ...experiment,
      id: this.generateId(),
    };

    this.experiments.set(newExperiment.id, newExperiment);
    this.logger.log(`Created experiment: ${newExperiment.name}`);
    return newExperiment;
  }

  updateExperiment(
    experimentId: string,
    updates: Partial<Experiment>,
  ): Experiment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const updatedExperiment = { ...experiment, ...updates };
    this.experiments.set(experimentId, updatedExperiment);
    this.logger.log(`Updated experiment: ${updatedExperiment.name}`);
    return updatedExperiment;
  }

  deleteExperiment(experimentId: string): boolean {
    const deleted = this.experiments.delete(experimentId);
    if (deleted) {
      this.logger.log(`Deleted experiment: ${experimentId}`);
    }
    return deleted;
  }

  getExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  getExperiment(experimentId: string): Experiment | null {
    return this.experiments.get(experimentId) || null;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
