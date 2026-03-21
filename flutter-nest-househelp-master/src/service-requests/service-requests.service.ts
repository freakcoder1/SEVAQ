import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ServiceRequest } from './entities/service-request.entity';
import { AssignmentWorker } from './assignment.worker';
import { Worker } from '../workers/entities/worker.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestsRepository: Repository<ServiceRequest>,
    @InjectQueue('assignment') private assignmentQueue: Queue,
    private assignmentWorker: AssignmentWorker,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    userIdOrPublicId: string, // Can be either numeric ID or UUID (publicId)
    createDto: {
      serviceId?: number;
      serviceProfileId?: number;
      date: string;
      timeWindow: string;
      priceSnapshot: number;
      location?: { lat: number; lng: number; address?: string };
      source?: string;
    },
  ): Promise<ServiceRequest> {
    // Convert userId (which might be UUID/publicId) to numeric ID
    let numericUserId: number;
    
    // Check if userIdOrPublicId is a UUID (contains dashes and is 36 chars)
    if (userIdOrPublicId.includes('-') && userIdOrPublicId.length === 36) {
      // It's a UUID (publicId), look up the user to get numeric ID
      const user = await this.usersRepository.findOne({
        where: { publicId: userIdOrPublicId },
      });
      if (!user) {
        throw new BadRequestException('User not found with the provided ID');
      }
      // The User entity has both numeric id and publicId - convert string id to number
      numericUserId = parseInt(user.id as unknown as string, 10);
      if (isNaN(numericUserId)) {
        this.logger.warn(`User id is not numeric: ${user.id}, treating as string`);
        // If parse fails, try to use the id directly (might work if DB returns string)
        numericUserId = Number(user.id);
      }
      this.logger.debug(`Converted publicId ${userIdOrPublicId} to numeric userId ${numericUserId}`);
    } else {
      // It's already a numeric ID
      numericUserId = parseInt(userIdOrPublicId, 10);
      if (isNaN(numericUserId)) {
        throw new BadRequestException('Invalid user ID format');
      }
    }

    const serviceRequestData: any = {
      publicId: uuidv4(),
      userId: numericUserId,
      serviceId: createDto.serviceId,
      serviceProfileId: createDto.serviceProfileId,
      date: new Date(createDto.date),
      timeWindow: createDto.timeWindow,
      priceSnapshot: createDto.priceSnapshot,
      assignmentStatus: 'REQUESTED',
      failureReason: null,
      assignedWorkerId: null,
      assignedSlotId: null,
      source: createDto.source,
      metadata: createDto.location
        ? { location: createDto.location }
        : undefined,
    };
    const serviceRequest =
      this.serviceRequestsRepository.create(serviceRequestData);
    const savedRequest =
      await this.serviceRequestsRepository.save(serviceRequest);
    const singleRequest = Array.isArray(savedRequest)
      ? savedRequest[0]
      : savedRequest;

    // Trigger assignment processing synchronously
    try {
      await this.assignmentWorker.processAssignment(singleRequest.id);
      this.logger.log(
        `Assignment processing completed for service request ${singleRequest.publicId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process assignment for service request ${singleRequest.publicId}: ${error.message}`,
      );
    }

    return singleRequest;
  }

  async findById(id: string): Promise<ServiceRequest | null> {
    this.logger.log(`Finding service request with id: ${id}`);
    try {
      const result = await this.serviceRequestsRepository.findOne({
        where: { id },
      });
      this.logger.log(`Found service request: ${result ? 'yes' : 'no'}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error finding service request ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async markAsAssigned(
    requestId: string,
    workerId: number,
    slotId: number,
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
      assignedWorkerId: null,
      assignedSlotId: null,
    });
  }

  async getStatus(publicId: string): Promise<{
    assignmentStatus: string;
    assignedWorker?: any;
    failureReason?: string | null;
  }> {
    const request = await this.serviceRequestsRepository.findOne({
      where: { publicId },
    });
    if (!request) {
      throw new Error('Service request not found');
    }

    if (request.assignmentStatus === 'ASSIGNED' && request.assignedWorkerId) {
      // Fetch complete worker details with user and services
      const worker = await this.workersRepository.findOne({
        where: { id: request.assignedWorkerId },
        relations: ['user', 'services'],
      });

      if (worker) {
        return {
          assignmentStatus: request.assignmentStatus,
          assignedWorker: {
            id: worker.id,
            user: worker.user,
            bio: worker.bio,
            rating: worker.rating,
            reviewCount: worker.reviewCount,
            services: worker.services,
          },
        };
      }
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
