import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { AssignmentWorker } from './assignment.worker';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestsRepository: Repository<ServiceRequest>,
    @InjectQueue('assignment') private assignmentQueue: Queue,
    private assignmentWorker: AssignmentWorker,
  ) {}

  async create(userId: string, createDto: {
    serviceId: string;
    date: string;
    timeWindow: string;
    priceSnapshot: number;
    location?: { lat: number; lng: number; address?: string };
  }): Promise<ServiceRequest> {
    const serviceRequest = this.serviceRequestsRepository.create({
      userId: userId,
      serviceId: createDto.serviceId,
      date: new Date(createDto.date),
      timeWindow: createDto.timeWindow,
      priceSnapshot: createDto.priceSnapshot,
      assignmentStatus: 'REQUESTED',
      failureReason: '',
      assignedWorkerId: '',
      assignedSlotId: '',
      metadata: createDto.location ? { location: createDto.location } : undefined,
    });
    const savedRequest = await this.serviceRequestsRepository.save(serviceRequest);

    // Trigger assignment processing synchronously
    try {
      await this.assignmentWorker.processAssignment(savedRequest.id);
      this.logger.log(`Assignment processing completed for service request ${savedRequest.id}`);
    } catch (error) {
      this.logger.error(`Failed to process assignment for service request ${savedRequest.id}: ${error.message}`);
    }

    return savedRequest;
  }

  async findById(id: string): Promise<ServiceRequest | null> {
    this.logger.log(`Finding service request with id: ${id}`);
    try {
      const result = await this.serviceRequestsRepository.findOne({ where: { id } });
      this.logger.log(`Found service request: ${result ? 'yes' : 'no'}`);
      return result;
    } catch (error) {
      this.logger.error(`Error finding service request ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAsAssigned(
    requestId: string,
    workerId: string,
    slotId: string,
  ): Promise<void> {
    await this.serviceRequestsRepository.update(requestId, {
      assignmentStatus: 'ASSIGNED',
      assignedWorkerId: workerId,
      assignedSlotId: slotId,
      failureReason: '',
    });
  }

  async markAsFailed(requestId: string, reason: string): Promise<void> {
    await this.serviceRequestsRepository.update(requestId, {
      assignmentStatus: 'FAILED_TO_ASSIGN',
      failureReason: reason,
      assignedWorkerId: '',
      assignedSlotId: '',
    });
  }

  async getStatus(requestId: string): Promise<{
    assignmentStatus: string;
    assignedWorker?: any;
    failureReason?: string;
  }> {
    const request = await this.findById(requestId);
    if (!request) {
      throw new Error('Service request not found');
    }

    if (request.assignmentStatus === 'ASSIGNED') {
      // Fetch worker details if needed
      return {
        assignmentStatus: request.assignmentStatus,
        assignedWorker: { id: request.assignedWorkerId },
      };
    }

    return {
      assignmentStatus: request.assignmentStatus,
      failureReason: request.failureReason,
    };
  }

  async findPendingRequests(): Promise<ServiceRequest[]> {
    return this.serviceRequestsRepository.find({
      where: { assignmentStatus: 'REQUESTED' },
      take: 10, // Process up to 10 pending requests at a time
    });
  }

  async triggerAssignmentProcessing(): Promise<void> {
    // This method can be used to manually trigger assignment processing
    // For now, it's a placeholder that can be expanded with actual logic
    console.log('Assignment processing triggered manually');
  }
}