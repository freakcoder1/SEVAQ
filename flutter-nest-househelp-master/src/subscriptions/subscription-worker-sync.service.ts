import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Worker } from '../workers/entities/worker.entity';

@Injectable()
export class SubscriptionWorkerSyncService {
  private readonly logger = new Logger(SubscriptionWorkerSyncService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Sync worker assignment from booking to parent subscription
   */
  async syncWorkerToSubscription(subscriptionId: number, workerId: number): Promise<void> {
    if (!subscriptionId || !workerId) {
      return;
    }

    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        this.logger.warn(`Subscription not found for sync: ${subscriptionId}`);
        return;
      }

      // Only sync if worker is different or not set
      if (subscription.assignedWorkerId !== workerId) {
        await this.subscriptionRepository.update(subscriptionId, {
          assignedWorkerId: workerId,
          workerAssignmentFailed: false,
          availabilityDetectedAt: new Date(),
        });
        
        this.logger.debug(`Synced worker ${workerId} to subscription ${subscriptionId}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to sync worker to subscription ${subscriptionId}: ${error.message}`);
      // Don't throw - this is a background sync operation
    }
  }

  /**
   * Get worker assignment status for a subscription
   */
  async getWorkerAssignmentStatus(subscriptionId: number): Promise<{ assignedWorkerId: number | null; availabilityDetectedAt: Date | null }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      select: ['id', 'assignedWorkerId', 'availabilityDetectedAt'],
    });

    if (!subscription) {
      return { assignedWorkerId: null, availabilityDetectedAt: null };
    }

    return {
      assignedWorkerId: subscription.assignedWorkerId,
      availabilityDetectedAt: subscription.availabilityDetectedAt,
    };
  }
}
