import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AssignmentWorker } from './assignment.worker';

@Injectable()
@Processor('assignment')
export class AssignmentProcessor {
  private readonly logger = new Logger(AssignmentProcessor.name);

  constructor(private assignmentWorker: AssignmentWorker) {}

  @Process()
  async handleAssignment(job: Job<{ serviceRequestId: string }>) {
    const { serviceRequestId } = job.data;

    this.logger.log(
      `Processing assignment job for service request ${serviceRequestId}`,
    );

    try {
      await this.assignmentWorker.processAssignment(serviceRequestId);
      this.logger.log(
        `Successfully processed assignment for service request ${serviceRequestId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process assignment for service request ${serviceRequestId}: ${error.message}`,
      );
      throw error; // Re-throw to mark job as failed
    }
  }
}
