import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ServiceRequest } from './entities/service-request.entity';
import { AssignmentWorker } from './assignment.worker';
import { Worker } from '../workers/entities/worker.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

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
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
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
      // User.id is now correctly typed as number (auto-increment)
      numericUserId = user.id;
      this.logger.debug(`Converted publicId ${userIdOrPublicId} to numeric userId ${numericUserId}`);
    } else {
      // It's already a numeric ID
      numericUserId = parseInt(userIdOrPublicId, 10);
      if (isNaN(numericUserId)) {
        throw new BadRequestException('Invalid user ID format');
      }
    }

    // Validate serviceId if provided - check it exists in the database
    if (createDto.serviceId) {
      const service = await this.servicesRepository.findOne({
        where: { id: createDto.serviceId },
      });
      if (!service) {
        // Get available services to help the client
        const availableServices = await this.servicesRepository.find({ take: 10 });
        const serviceIds = availableServices.map(s => `${s.id} (${s.name})`).join(', ');
        this.logger.warn(`Service ID ${createDto.serviceId} not found. Available services: ${serviceIds}`);
        throw new BadRequestException(
          `Service with ID ${createDto.serviceId} not found. Available service IDs: ${serviceIds}`
        );
      }
      this.logger.debug(`Validated serviceId ${createDto.serviceId} -> ${service.name}`);
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

    // ✅ FIX: Propagate location to user table for worker assignment
    if (createDto.location && createDto.location.lat && createDto.location.lng) {
      try {
        const userToUpdate = await this.usersRepository.findOne({
          where: { id: numericUserId },
        });
        if (userToUpdate) {
          userToUpdate.latitude = createDto.location.lat;
          userToUpdate.longitude = createDto.location.lng;
          await this.usersRepository.save(userToUpdate);
          this.logger.debug(`Updated user ${numericUserId} location: ${createDto.location.lat}, ${createDto.location.lng}`);
        }
      } catch (locErr: any) {
        this.logger.warn(`Failed to update user location: ${locErr.message || locErr}`);
      }
    }

    // Trigger assignment processing synchronously
    try {
      await this.assignmentWorker.processAssignment(singleRequest.id);
      this.logger.log(
        `Assignment processing completed for service request id: ${singleRequest.id}, publicId: ${singleRequest.publicId}`,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process assignment for service request ${singleRequest.publicId}: ${errorMessage}`,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error finding service request ${id}: ${errorMessage}`,
        errorStack,
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
    this.logger.log('Assignment processing triggered manually');
  }

  /**
    * Get user's active booking for home screen display
    * Returns the most recent in-progress or confirmed booking
    * Also checks for active subscriptions with assigned workers
    */
  async getUserActiveBooking(userIdOrPublicId: string): Promise<{
    operationTitle: string;
    assignedTo: string;
    eta: string;
    status: string;
  } | null> {
    // Convert userId (which might be UUID/publicId) to numeric ID
    let numericUserId: number;
    
    if (userIdOrPublicId.includes('-') && userIdOrPublicId.length === 36) {
      const user = await this.usersRepository.findOne({
        where: { publicId: userIdOrPublicId },
      });
      if (!user) {
        return null;
      }
      numericUserId = user.id;
    } else {
      numericUserId = parseInt(userIdOrPublicId, 10);
      if (isNaN(numericUserId)) {
        return null;
      }
    }

    try {
      // First, find the most recent active service request (ASSIGNED or IN_PROGRESS)
      const activeBooking = await this.serviceRequestsRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.worker', 'worker')
        .leftJoinAndSelect('worker.user', 'workerUser')
        .leftJoinAndSelect('request.service', 'service')
        .where('request.userId = :userId', { userId: numericUserId })
        .andWhere('request.assignmentStatus IN (:...statuses)', { 
          statuses: ['ASSIGNED', 'IN_PROGRESS'] 
        })
        .orderBy('request.createdAt', 'DESC')
        .limit(1)
        .getOne();

      if (activeBooking) {
        // Calculate ETA (simplified - in production would use actual time calculations)
        const etaMinutes = 24; // Default ETA
        
        return {
          operationTitle: activeBooking.service?.name || 'Service',
          assignedTo: activeBooking.worker?.user 
            ? `${activeBooking.worker.user.firstName || ''} ${activeBooking.worker.user.lastName || ''}`.trim() || 'Worker'
            : 'Worker',
          eta: `${etaMinutes} mins`,
          status: activeBooking.assignmentStatus,
        };
      }

      // If no active service request, check for active subscription with assigned worker
      const activeSubscription = await this.subscriptionsRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.assignedWorker', 'worker')
        .leftJoinAndSelect('worker.user', 'workerUser')
        .where('subscription.userId = :userId', { userId: userIdOrPublicId })
        .andWhere('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
        .andWhere('subscription.assignedWorkerId IS NOT NULL')
        .orderBy('subscription.createdAt', 'DESC')
        .limit(1)
        .getOne();

      if (activeSubscription && activeSubscription.assignedWorker) {
        // Calculate ETA based on preferred time window
        const now = new Date();
        const currentHour = now.getHours();
        let etaMinutes = 24;
        
        // Estimate ETA based on time window
        if (activeSubscription.preferredTimeWindow === 'MORNING' && currentHour < 12) {
          etaMinutes = 24;
        } else if (activeSubscription.preferredTimeWindow === 'AFTERNOON' && currentHour >= 12 && currentHour < 17) {
          etaMinutes = 24;
        } else if (activeSubscription.preferredTimeWindow === 'EVENING' && currentHour >= 17) {
          etaMinutes = 24;
        }

        // Get service type from customPlanData
        const serviceType = activeSubscription.customPlanData?.serviceType || 'Cleaning';
        const operationTitle = serviceType === 'CLEANING' ? 'House Cleaning' : 
                              serviceType === 'COOKING' ? 'Cooking Support' : 
                              serviceType.charAt(0).toUpperCase() + serviceType.slice(1).toLowerCase();

        return {
          operationTitle: operationTitle,
          assignedTo: activeSubscription.assignedWorker.user
            ? `${activeSubscription.assignedWorker.user.firstName || ''} ${activeSubscription.assignedWorker.user.lastName || ''}`.trim() || 'Worker'
            : 'Worker',
          eta: `${etaMinutes} mins`,
          status: 'IN_PROGRESS',
        };
      }

      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in getUserActiveBooking: ${errorMessage}`,
        errorStack,
      );
      // Return null instead of throwing to avoid 500 error
      return null;
    }
  }
}
