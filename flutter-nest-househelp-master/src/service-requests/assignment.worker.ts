import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { SlotsService } from '../slots/slots.service';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AssignmentWorker {
  private readonly logger = new Logger(AssignmentWorker.name);

  constructor(
    private slotsService: SlotsService,
    @InjectRepository(ServiceRequest)
    private serviceRequestsRepository: Repository<ServiceRequest>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async processAssignment(requestId: string): Promise<void> {
    try {
      const request = await this.serviceRequestsRepository.findOne({ where: { id: requestId } });

      // CRITICAL: Ensure idempotent markAsFailed
      if (!request || request.assignmentStatus !== 'REQUESTED') {
        this.logger.log(`Request ${requestId} already processed or not found, skipping`);
        return; // Already processed
      }

      this.logger.log(`Processing assignment for request ${requestId}`);

      const location = request.metadata?.location;

      // Use location from request or fallback to default coordinates
      const userLat = location?.lat ?? 28.5804579; // Default to test location
      const userLng = location?.lng ?? 77.4392951; // Default to test location

      // Parse time window to get start and end times
      const { startTime, endTime } = this.parseTimeWindow(request.date, request.timeWindow);

      // Find best worker using service request-specific logic
      // TODO: Implement logic to map service profile to service
      const serviceId = request.serviceId || 1; // Default to service 1 if not specified
      
      const bestWorker = await this.findBestWorker(
        serviceId,
        userLat,
        userLng,
        startTime,
        endTime
      );

      if (!bestWorker) {
        await this.serviceRequestsRepository.update(requestId, {
          assignmentStatus: 'FAILED_TO_ASSIGN',
          failureReason: 'No professional available',
          assignedWorkerId: null,
          assignedSlotId: null,
        });
        this.logger.log(`Failed to assign worker to request ${requestId}: No professional available`);
        return;
      }

      // Book the slot
      const bookingSuccess = await this.slotsService.bookSlot(bestWorker.slot.id);

      if (!bookingSuccess) {
        await this.serviceRequestsRepository.update(requestId, {
          assignmentStatus: 'FAILED_TO_ASSIGN',
          failureReason: 'Failed to book worker slot',
          assignedWorkerId: null,
          assignedSlotId: null,
        });
        this.logger.log(`Failed to book slot for request ${requestId}`);
        return;
      }

      // Mark as assigned
      await this.serviceRequestsRepository.update(requestId, {
        assignmentStatus: 'ASSIGNED',
        assignedWorkerId: bestWorker.worker.id,
        assignedSlotId: bestWorker.slot.id,
        failureReason: null,
      });

      this.logger.log(`Successfully assigned worker ${bestWorker.worker.id} to request ${requestId}`);
    } catch (error) {
      this.logger.error(`Error processing assignment for request ${requestId}: ${error.message}`);
      await this.serviceRequestsRepository.update(requestId, {
        assignmentStatus: 'FAILED_TO_ASSIGN',
        failureReason: error.message,
        assignedWorkerId: null,
        assignedSlotId: null,
      });
    }
  }

  private parseTimeWindow(date: Date, timeWindow: string): { startTime: Date; endTime: Date } {
    let startHour: number;
    let endHour: number;

    switch (timeWindow.toLowerCase()) {
      case 'morning':
        startHour = 8;
        endHour = 12;
        break;
      case 'afternoon':
        startHour = 12;
        endHour = 17;
        break;
      case 'evening':
        startHour = 17;
        endHour = 21;
        break;
      case 'early-morning':
        startHour = 2;
        endHour = 11;
        break;
      default:
        startHour = 8;
        endHour = 12;
    }

    const startTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), startHour, 0, 0, 0));
    const endTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), endHour, 0, 0, 0));

    return { startTime, endTime };
  }

  // Enhanced worker matching logic adapted from AssignmentsService.findBestWorker()
  private async findBestWorker(serviceId: number, userLat: number, userLng: number, startTime: Date, endTime: Date) {
    this.logger.log('🔍 Starting worker search for service:', serviceId);
    this.logger.log('📍 User location:', { lat: userLat, lng: userLng });
    this.logger.log('⏰ Requested time:', { start: startTime, end: endTime });

    // Find all workers who offer this service
    const workers = await this.workersRepository.find({
      where: {
        services: { id: serviceId },
        isActive: true,
        isAvailable: true
      },
      relations: ['user', 'services']
    });

    this.logger.log('👷 Found workers for service:', workers.length);

    if (workers.length === 0) {
      this.logger.log('❌ No workers found for service');
      return null;
    }

    // Score each worker
    const scoredWorkers = await Promise.all(workers.map(async (worker) => {
      const user = worker.user;
      if (!user) {
        this.logger.log(`⚠️ Worker ${worker.id} has no associated user`);
        return null;
      }

      // Enhanced location fallback logic
      let workerLat = worker.currentLat;
      let workerLng = worker.currentLng;

      // Fallback 1: Use worker's primary location
      if (!workerLat || !workerLng) {
        workerLat = worker.latitude;
        workerLng = worker.longitude;
        this.logger.log(`📍 Using primary location for worker ${worker.id}`);
      }

      // Fallback 2: Use user's location
      if (!workerLat || !workerLng) {
        workerLat = user.latitude;
        workerLng = user.longitude;
        this.logger.log(`📍 Using user location for worker ${worker.id}`);
      }

      // Final fallback: Skip workers without any location data
      if (!workerLat || !workerLng) {
        this.logger.log(`❌ Skipping worker ${worker.id} - no location data available`);
        return null;
      }

      // Calculate distance
      const distance = this.calculateDistance(userLat, userLng, workerLat, workerLng);
      this.logger.log(`📏 Worker ${worker.id} distance: ${distance.toFixed(2)}km`);

      // Flexible radius check (start with 15km)
      const maxRadius = 15;
      if (distance > maxRadius) {
        this.logger.log(`❌ Worker ${worker.id} too far (${distance.toFixed(2)}km > ${maxRadius}km)`);
        return null;
      }

      // Enhanced availability check with multiple fallback strategies
      let availableSlot = await this.slotsService.findAvailableSlotFlexible(worker.id, startTime, endTime);

      if (!availableSlot) {
        this.logger.log(`❌ Worker ${worker.id} not available for requested time, trying alternative strategies...`);

        // Strategy 1: Try exact time match
        availableSlot = await this.slotsService.findAvailableSlot(worker.id, startTime, endTime);
        if (availableSlot) {
          this.logger.log(`✅ Worker ${worker.id} found with exact time match`);
        }
      }

      if (!availableSlot) {
        // Strategy 2: Try to find any available slot for the worker on the same day
        const requestedDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
        const nextDay = new Date(requestedDate);
        nextDay.setDate(requestedDate.getDate() + 1);

        const sameDaySlots = await this.slotsService.getAvailableSlotsForWorker(worker.id, requestedDate, nextDay);

        if (sameDaySlots.length > 0) {
          this.logger.log(`✅ Worker ${worker.id} found with same-day alternative slot`);
          availableSlot = sameDaySlots[0]; // Use the earliest available slot
        }
      }

      if (!availableSlot) {
        this.logger.log(`❌ Worker ${worker.id} not available with any strategy`);
        return null;
      }

      // Calculate score with adjusted weights
      const distanceScore = distance * 0.3; // 30% weight
      const ratingScore = (5 - worker.rating) * 8 * 0.4; // 40% weight
      const reviewScore = (100 - Math.min(worker.reviewCount, 100)) * 0.3; // 30% weight

      const totalScore = distanceScore + ratingScore + reviewScore;

      this.logger.log(`✅ Worker ${worker.id} scored: ${totalScore.toFixed(2)} (distance: ${distance.toFixed(2)}km, rating: ${worker.rating})`);

      return {
        worker,
        distance,
        score: totalScore,
        slot: availableSlot
      };
    }));

    // Filter out unavailable workers and sort by score
    const availableWorkers = scoredWorkers.filter(w => w !== null).sort((a, b) => a.score - b.score);

    this.logger.log('🏆 Available workers after scoring:', availableWorkers.length);

    if (availableWorkers.length === 0) {
      this.logger.log('❌ No workers available after all filters');
      return null;
    }

    return availableWorkers[0]; // Return best match
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}