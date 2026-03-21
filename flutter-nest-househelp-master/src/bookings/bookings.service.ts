import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { SlotsService } from '../slots/slots.service';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import {
  BookingStatus,
  AssignmentState,
  BookingType,
} from './entities/booking.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ServiceRequest)
    private serviceRequestsRepository: Repository<ServiceRequest>,
    private slotsService: SlotsService,
  ) {}

  async findBestWorker(
    serviceId: string,
    userLat: number,
    userLng: number,
    startTime: Date,
    endTime: Date,
  ) {
    // Optimized query: Fetch workers with their users and services in a single JOIN query
    // This avoids N+1 query problem by loading all necessary data at once
    const workers = await this.workersRepository
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.user', 'user')
      .leftJoinAndSelect('worker.services', 'services')
      .where('services.id = :serviceId', { serviceId: Number(serviceId) })
      .andWhere('user.latitude IS NOT NULL')
      .andWhere('user.longitude IS NOT NULL')
      .getMany();

    if (workers.length === 0) {
      throw new BadRequestException('No workers available for this service');
    }

    // Batch check slot availability for all workers in a single query
    const workerIds = workers.map((w) => w.id);
    const availableSlots = await this.slotsService.findAvailableSlotsForWorkers(
      workerIds,
      startTime,
      endTime,
    );

    // Create a map for quick lookup
    const slotMap = new Map(availableSlots.map((s) => [s.workerId, s]));

    // Score each worker
    const scoredWorkers = workers.map((worker) => {
      const user = worker.user;
      if (!user.latitude || !user.longitude) return null;

      // Check availability from pre-fetched slots
      const availableSlot = slotMap.get(worker.id);
      if (!availableSlot) return null;

      // Calculate distance (Haversine formula)
      const distance = this.calculateDistance(
        userLat,
        userLng,
        user.latitude,
        user.longitude,
      );

      // Calculate score (lower is better)
      const distanceScore = distance * 0.4; // 40% weight
      const ratingScore = (5 - worker.rating) * 10 * 0.3; // 30% weight (invert rating)
      const reviewScore = (100 - Math.min(worker.reviewCount, 100)) * 0.3; // 30% weight

      const totalScore = distanceScore + ratingScore + reviewScore;

      return {
        worker,
        distance,
        score: totalScore,
        slot: availableSlot,
      };
    });

    // Filter out unavailable workers and sort by score
    const availableWorkers = scoredWorkers
      .filter((w) => w !== null)
      .sort((a, b) => a.score - b.score);

    if (availableWorkers.length === 0) {
      throw new BadRequestException(
        'No workers available at the requested time',
      );
    }

    return availableWorkers[0]; // Return best match
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async create(createBookingDto: any) {
    try {
      console.log(
        'DEBUG: Entering create method with createBookingDto:',
        createBookingDto,
      );
      let worker: Worker | null = null;

      // If serviceRequestId is provided, validate it exists and retrieve details
      if (createBookingDto.serviceRequestId) {
        console.log(
          'DEBUG: serviceRequestId is provided:',
          createBookingDto.serviceRequestId,
        );
        // Check if serviceRequestId is a UUID (publicId) or numeric id
        let serviceRequest;
        if (
          createBookingDto.serviceRequestId.length === 36 &&
          createBookingDto.serviceRequestId.includes('-')
        ) {
          // It's a UUID (publicId)
          serviceRequest = await this.serviceRequestsRepository.findOne({
            where: { publicId: createBookingDto.serviceRequestId },
            relations: ['user', 'service'],
          });
        } else {
          // It's a string id (UUID)
          serviceRequest = await this.serviceRequestsRepository.findOne({
            where: { id: createBookingDto.serviceRequestId },
            relations: ['user', 'service'],
          });
        }

        if (!serviceRequest) {
          throw new BadRequestException('Service request not found');
        }

        // Validate service request is not in FAILED_TO_ASSIGN state before creating booking
        console.log('DEBUG: Service request assignmentStatus:', serviceRequest.assignmentStatus);
        if (serviceRequest.assignmentStatus === 'FAILED_TO_ASSIGN') {
          console.log('DEBUG: Service request is in FAILED_TO_ASSIGN state, throwing error');
          throw new BadRequestException(
            'Service request failed to assign a worker. Please try again.',
          );
        }

        // Populate booking with service request details
        createBookingDto.serviceRequestId = serviceRequest.id; // Use UUID
        createBookingDto.userId = serviceRequest.userId;
        createBookingDto.serviceId = serviceRequest.serviceId;
        createBookingDto.workerId = serviceRequest.assignedWorkerId;
        createBookingDto.date = serviceRequest.date;

        // Parse time window to get start and end times
        let startHour: number;
        let endHour: number;

        switch (serviceRequest.timeWindow.toLowerCase()) {
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

        // Set default times based on time window
        const date = new Date(serviceRequest.date);
        createBookingDto.startTime = new Date(
          Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            startHour,
            0,
            0,
            0,
          ),
        );
        createBookingDto.endTime = new Date(
          Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            endHour,
            0,
            0,
            0,
          ),
        );
      } else {
        // Validate user exists (using publicId since userId is UUID)
        const user = await this.usersRepository.findOne({
          where: { publicId: createBookingDto.userId },
        });
        if (!user) {
          throw new BadRequestException('User not found');
        }

        // Validate service exists
        const service = await this.servicesRepository.findOne({
          where: { id: createBookingDto.serviceId },
        });
        if (!service) {
          throw new BadRequestException('Service not found');
        }

        // Validate worker exists if workerId is provided
        if (createBookingDto.workerId) {
          worker = await this.workersRepository.findOne({
            where: { id: createBookingDto.workerId },
            relations: ['user', 'services'],
          });
          if (!worker) {
            throw new BadRequestException('Worker not found');
          }
        }

        // Validate time range (handle both Date objects and time strings)
        const parseTimeToCompare = (time: string | Date): number => {
          if (typeof time === 'string') {
            if (time.includes('T')) {
              // ISO datetime string
              return new Date(time).getTime();
            }
            // Time string HH:mm:ss - compare as hours only
            const parts = time.split(':');
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1] || '0', 10);
            return hours * 60 + minutes;
          }
          return time.getTime();
        };

        if (
          parseTimeToCompare(createBookingDto.startTime) >=
          parseTimeToCompare(createBookingDto.endTime)
        ) {
          throw new BadRequestException('Start time must be before end time');
        }

        // Validate time is in future (only for datetime, not time-only)
        const now = new Date();
        if (
          typeof createBookingDto.startTime === 'string' &&
          createBookingDto.startTime.includes('T') &&
          new Date(createBookingDto.startTime) <= now
        ) {
          throw new BadRequestException('Start time must be in the future');
        }
      }

      // Create service request (intent only) - never fail due to worker availability
      let workerToAssign: Worker | null = null;
      if (createBookingDto.workerId) {
        if (worker) {
          // Reuse the worker object fetched during validation
          workerToAssign = worker;
        } else {
          // If worker wasn't fetched during validation (e.g., serviceRequestId was provided), fetch it now
          workerToAssign = await this.workersRepository.findOne({
            where: { id: createBookingDto.workerId },
            relations: ['user', 'services'],
          });
        }
      }

      // Calculate amount if not provided
      let amount = createBookingDto.amount;
      if (!amount) {
        console.log('DEBUG: Calculating amount, createBookingDto:', {
          serviceId: createBookingDto.serviceId,
          startTime: createBookingDto.startTime,
          startTimeType: typeof createBookingDto.startTime,
          endTime: createBookingDto.endTime,
          endTimeType: typeof createBookingDto.endTime,
        });

        const service = await this.servicesRepository.findOne({
          where: { id: createBookingDto.serviceId },
        });

        console.log('DEBUG: Found service:', service);

        if (service) {
          const basePrice = parseFloat(service.basePrice.toString());
          console.log('DEBUG: Parsed basePrice:', basePrice);

          // Parse time string to calculate duration
          const parseTimeToHours = (timeStr: string | Date): number => {
            try {
              console.log('DEBUG: parseTimeToHours input:', timeStr, typeof timeStr);
              if (typeof timeStr === 'string') {
                if (timeStr.includes('T')) {
                  // ISO datetime string
                  const date = new Date(timeStr);
                  console.log('DEBUG: Parsed as ISO datetime:', date);
                  return date.getHours() + date.getMinutes() / 60;
                }
                // Time format is HH:mm:ss or HH:mm
                const parts = timeStr.split(':');
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1] || '0', 10);
                console.log('DEBUG: Parsed as time string:', hours, minutes);
                return hours + minutes / 60;
              }
              console.log('DEBUG: Parsed as Date object:', timeStr);
              return timeStr.getHours() + timeStr.getMinutes() / 60;
            } catch (err) {
              console.error('DEBUG: Error in parseTimeToHours:', err.message);
              throw err;
            }
          };

          const startHours = parseTimeToHours(createBookingDto.startTime);
          const endHours = parseTimeToHours(createBookingDto.endTime);
          console.log('DEBUG: After parseTimeToHours, startHours:', startHours, 'endHours:', endHours);
          const durationHours = Math.max(0, endHours - startHours);
          console.log('DEBUG: Duration calculated:', durationHours);

          console.log('DEBUG: Parsed times (hours):', {
            startHours,
            endHours,
            durationHours,
          });

          amount = basePrice * durationHours;

          console.log('DEBUG: Calculated durationHours:', durationHours);
          console.log('DEBUG: Calculated amount:', amount);
        } else {
          amount = 0;
          console.log('DEBUG: No service found, amount set to 0');
        }
      }

      console.log('DEBUG: Amount calculation completed, amount:', amount);

      // Parse time string to ensure it's in HH:mm:ss format for PostgreSQL
      const parseTimeForStorage = (time: string | Date): string => {
        if (typeof time === 'string') {
          if (time.includes('T')) {
            // ISO datetime string - extract time portion
            return new Date(time).toTimeString().split(' ')[0];
          }
          // Already a time string (HH:mm:ss)
          return time;
        }
        return time.toTimeString().split(' ')[0];
      };

      const bookingData = {
        ...createBookingDto,
        status: BookingStatus.REQUESTED,
        worker: workerToAssign,
        assignedWorkerId: createBookingDto.workerId,
        type: createBookingDto.type || BookingType.ON_DEMAND,
        amount: amount,
        totalAmount: amount, // Set totalAmount to the same as amount
        assignmentState:
          createBookingDto.serviceRequestId || createBookingDto.workerId
            ? AssignmentState.ASSIGNED
            : AssignmentState.PENDING,
        // Parse to time string for PostgreSQL time type
        startTime: parseTimeForStorage(createBookingDto.startTime),
        endTime: parseTimeForStorage(createBookingDto.endTime),
        // Extract date from startTime if not provided
        date:
          createBookingDto.date ||
          (typeof createBookingDto.startTime === 'string' &&
          createBookingDto.startTime.includes('T')
            ? new Date(createBookingDto.startTime).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]),
        // Ensure we have service relation
        service: await this.servicesRepository.findOne({
          where: { id: createBookingDto.serviceId },
        }),
        // Ensure we have user relation (look up by publicId since userId is UUID)
        user: await this.usersRepository.findOne({
          where: { publicId: createBookingDto.userId },
        }),
      };

      // Ensure serviceRequestId is numeric when creating the booking
      console.log('DEBUG: Creating booking with data:', bookingData);
      const booking = this.bookingsRepository.create(bookingData);

      const savedBooking = await this.bookingsRepository.save(booking);
      const bookingToReturn = Array.isArray(savedBooking)
        ? savedBooking[0]
        : savedBooking;

      // Load the saved booking with relations to ensure all data is returned
      const fullBooking = await this.bookingsRepository.findOne({
        where: { id: bookingToReturn.id },
        relations: [
          'user',
          'worker',
          'service',
          'worker.user',
          'worker.services',
        ],
      });

      return fullBooking || bookingToReturn;
    } catch (error) {
      // Log the error for debugging
      console.error('Booking creation error:', error.message, {
        userId: createBookingDto.userId,
        serviceId: createBookingDto.serviceId,
        startTime: createBookingDto.startTime,
        endTime: createBookingDto.endTime,
      });

      // Re-throw the error with context
      throw error;
    }
  }

  async attemptAssignment(bookingId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId as any },
      relations: ['user', 'service'],
    });
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.status !== BookingStatus.REQUESTED) {
      throw new BadRequestException(
        'Assignment can only be attempted on REQUESTED bookings',
      );
    }

    // Find the best worker for this booking
    const user = booking.user;
    console.log('🔍 User data:', {
      id: user?.id,
      latitude: user?.latitude,
      longitude: user?.longitude,
      hasUser: !!user,
    });

    if (!user || !user.latitude || !user.longitude) {
      // Try to load user separately if relation didn't work
      const fullUser = await this.usersRepository.findOne({
        where: { publicId: booking.userId } as any,
      });
      console.log('🔍 Full user data:', {
        id: fullUser?.id,
        latitude: fullUser?.latitude,
        longitude: fullUser?.longitude,
        hasUser: !!fullUser,
      });

      if (!fullUser || !fullUser.latitude || !fullUser.longitude) {
        throw new BadRequestException(
          'User location not available for matching',
        );
      }

      // Use the full user data
      return await this.attemptAssignmentWithUser(booking, fullUser);
    }

    return await this.attemptAssignmentWithUser(booking, user);
  }

  private async attemptAssignmentWithUser(booking: Booking, user: User) {
    try {
      // Parse time strings to Date objects for slot availability check
      const parseTimeToDate = (
        time: string | Date,
        bookingDate: Date,
      ): Date => {
        if (typeof time === 'string' && !time.includes('T')) {
          // Time string HH:mm:ss - combine with booking date
          const parts = time.split(':');
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1] || '0', 10);
          const date = new Date(bookingDate);
          date.setHours(hours, minutes, 0, 0);
          return date;
        }
        return time instanceof Date ? time : new Date(time);
      };

      const startTimeDate = parseTimeToDate(
        booking.startTime,
        booking.date ? new Date(booking.date) : new Date(),
      );
      const endTimeDate = parseTimeToDate(
        booking.endTime,
        booking.date ? new Date(booking.date) : new Date(),
      );

      const bestMatch = await this.findBestWorker(
        booking.service.id.toString(),
        user.latitude,
        user.longitude,
        startTimeDate,
        endTimeDate,
      );

      // Book the slot and assign worker
      await this.slotsService.markAsBooked((bestMatch.slot as any).id);

      // Update booking with assigned worker
      booking.worker = bestMatch.worker;
      booking.status = BookingStatus.PENDING; // Ready for confirmation
      booking.assignmentState = AssignmentState.ASSIGNED;
      booking.assignedWorkerId = bestMatch.worker.id;
      booking.assignmentTimestamp = new Date();
      booking.assignmentReason = 'Best match found';
      return await this.bookingsRepository.save(booking);
    } catch (error) {
      // Assignment failed - booking remains in REQUESTED state
      // This is not an error, just no workers available
      return booking;
    }
  }

  async createWithAssignment(createBookingDto: any) {
    // Create service request first
    const savedBooking = await this.create(createBookingDto);

    // Attempt assignment asynchronously
    try {
      await this.attemptAssignment(savedBooking.id);
    } catch (error) {
      // Assignment failed, but booking was created successfully
      console.log(
        `[Booking ${savedBooking.id}] Assignment attempt failed (booking still created):`,
        error.message,
      );
    }

    return savedBooking;
  }

  async findAll(userId?: string) {
    const query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .orderBy('booking.createdAt', 'DESC');

    if (userId) {
      query.where('booking.userId = :userId', { userId });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: [
        'user',
        'worker',
        'service',
        'worker.user',
        'worker.services',
      ],
    });

    if (!booking) {
      throw new BadRequestException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async update(id: string, updateBookingDto: any) {
    const booking = await this.findOne(id);

    // If updating the worker, ensure the worker exists
    if (updateBookingDto.workerId) {
      const worker = await this.workersRepository.findOne({
        where: { id: updateBookingDto.workerId },
      });
      if (!worker) {
        throw new BadRequestException('Worker not found');
      }
    }

    // If updating service, ensure the service exists
    if (updateBookingDto.serviceId) {
      const service = await this.servicesRepository.findOne({
        where: { id: updateBookingDto.serviceId },
      });
      if (!service) {
        throw new BadRequestException('Service not found');
      }
    }

    // Update the booking
    Object.assign(booking, updateBookingDto);
    return this.bookingsRepository.save(booking);
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);

    // Only allow cancellation of REQUESTED or PENDING bookings
    if (
      booking.status !== BookingStatus.REQUESTED &&
      booking.status !== BookingStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only REQUESTED or PENDING bookings can be cancelled',
      );
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepository.save(booking);
  }

  async reschedule(
    id: string,
    newStartTime: string | Date,
    newEndTime: string | Date,
  ) {
    const booking = await this.findOne(id);

    // Only allow rescheduling of REQUESTED or PENDING bookings
    if (
      booking.status !== BookingStatus.REQUESTED &&
      booking.status !== BookingStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only REQUESTED or PENDING bookings can be rescheduled',
      );
    }

    booking.startTime = newStartTime as any;
    booking.endTime = newEndTime as any;

    return this.bookingsRepository.save(booking);
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.findOne(id);
    booking.status = status;
    return this.bookingsRepository.save(booking);
  }

  async assignWorker(id: string, workerId: number) {
    const booking = await this.findOne(id);

    // Validate worker exists
    const worker = await this.workersRepository.findOne({
      where: { id: workerId },
      relations: ['user'],
    });

    if (!worker) {
      throw new BadRequestException('Worker not found');
    }

    booking.worker = worker;
    booking.assignedWorkerId = workerId;
    booking.assignmentState = AssignmentState.ASSIGNED;
    booking.assignmentTimestamp = new Date();
    booking.assignmentReason = 'Manual assignment by admin';

    return this.bookingsRepository.save(booking);
  }

  // Missing methods for controller compatibility
  async findAllPaginated(
    userId?: string,
    workerId?: string,
    skip?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<[Booking[], number]> {
    const query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('booking.service', 'service');

    if (userId) {
      query.andWhere('booking.userId = :userId', { userId });
    }

    if (workerId) {
      query.andWhere('booking.assignedWorkerId = :workerId', { workerId });
    }

    if (skip) {
      query.skip(skip);
    }

    if (limit) {
      query.take(limit);
    }

    if (sortBy) {
      query.orderBy(`booking.${sortBy}`, sortOrder || 'DESC');
    } else {
      query.orderBy('booking.createdAt', 'DESC');
    }

    return query.getManyAndCount();
  }

  async assignBooking(assignBookingDto: { bookingId: string; workerId: string }) {
    return this.assignWorker(assignBookingDto.bookingId, parseInt(assignBookingDto.workerId, 10));
  }

  async getBookingsByWorker(workerId: number) {
    return this.bookingsRepository.find({
      where: { assignedWorkerId: workerId },
      relations: ['user', 'service'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUpcomingBookings(userId: string) {
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [
          BookingStatus.REQUESTED,
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
        ],
      })
      .orderBy('booking.startTime', 'ASC')
      .getMany();
  }

  async getPastBookings(userId: string) {
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
          BookingStatus.NO_SHOW,
        ],
      })
      .orderBy('booking.startTime', 'DESC')
      .getMany();
  }
}
