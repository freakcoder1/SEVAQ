import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

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
    private notificationsService: NotificationsService,
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
      let worker: Worker | null = null;

      // If serviceRequestId is provided, validate it exists and retrieve details
      if (createBookingDto.serviceRequestId) {
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
        if (serviceRequest.assignmentStatus === 'FAILED_TO_ASSIGN') {
          throw new BadRequestException(
            'Service request failed to assign a worker. Please try again.',
          );
        }

        // Populate booking with service request details
        createBookingDto.serviceRequestId = serviceRequest.id; // Use UUID
        createBookingDto.userId = serviceRequest.userId;
        createBookingDto.serviceId = serviceRequest.serviceId;
        createBookingDto.workerId = serviceRequest.assignedWorkerId;
        
        // DEBUG: Log service request date and price
        console.log('🔍 DEBUG: Service Request details:', {
          id: serviceRequest.id,
          date: serviceRequest.date,
          dateType: typeof serviceRequest.date,
          priceSnapshot: serviceRequest.priceSnapshot,
          priceSnapshotType: typeof serviceRequest.priceSnapshot
        });
        
        // Use priceSnapshot from service request for booking amount
        console.log('🔍 DEBUG create: serviceRequest.priceSnapshot =', serviceRequest.priceSnapshot);
        createBookingDto.amount = serviceRequest.priceSnapshot || createBookingDto.amount;
        
        // Extract just the date portion (YYYY-MM-DD) from the service request date
        if (serviceRequest.date) {
          const serviceReqDate = new Date(serviceRequest.date);
          // Keep as Date object for DTO validation
          createBookingDto.date = new Date(serviceReqDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
          console.log('🔍 DEBUG: Converted date for booking:', createBookingDto.date);
        } else {
          createBookingDto.date = serviceRequest.date;
        }

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
      console.log('🔍 DEBUG create: Initial amount from DTO =', amount);
      if (!amount) {
        const service = await this.servicesRepository.findOne({
          where: { id: createBookingDto.serviceId },
        });

        console.log('🔍 DEBUG create: Service found =', service ? service.id : 'null');
        console.log('🔍 DEBUG create: Service basePrice =', service?.basePrice);

        if (service) {
          const basePrice = parseFloat(service.basePrice.toString());

          // Parse time string to calculate duration
          const parseTimeToHours = (timeStr: string | Date): number => {
            if (typeof timeStr === 'string') {
              if (timeStr.includes('T')) {
                // ISO datetime string
                const date = new Date(timeStr);
                return date.getHours() + date.getMinutes() / 60;
              }
              // Time format is HH:mm:ss or HH:mm
              const parts = timeStr.split(':');
              const hours = parseInt(parts[0], 10);
              const minutes = parseInt(parts[1] || '0', 10);
              return hours + minutes / 60;
            }
            return timeStr.getHours() + timeStr.getMinutes() / 60;
          };

          const startHours = parseTimeToHours(createBookingDto.startTime);
          const endHours = parseTimeToHours(createBookingDto.endTime);
          const durationHours = Math.max(0, endHours - startHours);

          console.log('🔍 DEBUG create: startHours =', startHours, ', endHours =', endHours, ', durationHours =', durationHours);

          amount = basePrice * durationHours;
          console.log('🔍 DEBUG create: Calculated amount =', amount, '(basePrice', basePrice, '* duration', durationHours, ')');
        } else {
          amount = 0;
        }
      }

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
        // FIX: Date handling - require date from service request or explicit date
        // Don't default to today's date silently
        date: (() => {
          // Priority 1: Use explicit date if provided
          if (createBookingDto.date) {
            const dateStr = typeof createBookingDto.date === 'string' 
              ? createBookingDto.date 
              : new Date(createBookingDto.date).toISOString().split('T')[0];
            console.log('🔍 DEBUG: Date handling - using explicit date:', dateStr);
            return dateStr;
          }
          
          // Priority 2: Extract date from startTime if it's an ISO datetime string
          if (typeof createBookingDto.startTime === 'string' &&
              createBookingDto.startTime.includes('T')) {
            const dateStr = new Date(createBookingDto.startTime).toISOString().split('T')[0];
            console.log('🔍 DEBUG: Date handling - extracted from startTime:', dateStr);
            return dateStr;
          }
          
          // Priority 3: Look up date from service request if serviceRequestId is provided
          if (createBookingDto.serviceRequestId) {
            console.log('🔍 DEBUG: Date handling - serviceRequestId provided, date should be set earlier in the flow');
            // The date should have been set from service request earlier in this function (lines 192-199)
            // If we reach here, the service request might not have a valid date
          }
          
          // FIX: Throw error instead of defaulting to today's date
          // This ensures the bug is caught rather than silently showing wrong date
          const errorMsg = 'Date is required but could not be determined. Please provide a date or use a valid service request.';
          console.error('🔍 ERROR: Date handling -', errorMsg, 'createBookingDto:', JSON.stringify({
            date: createBookingDto.date,
            startTime: createBookingDto.startTime,
            serviceRequestId: createBookingDto.serviceRequestId
          }));
          throw new Error(errorMsg);
        })(),
        // Ensure we have service relation
        service: await this.servicesRepository.findOne({
          where: { id: createBookingDto.serviceId },
        }),
        // Ensure we have user relation (look up by publicId since userId is UUID)
        user: await this.usersRepository.findOne({
          where: { publicId: createBookingDto.userId },
        }),
      };

      const booking = this.bookingsRepository.create(bookingData);

      const savedBooking = await this.bookingsRepository.save(booking);
      const bookingToReturn = Array.isArray(savedBooking)
        ? savedBooking[0]
        : savedBooking;

      // DEBUG: Log assignment state after save
      console.log('🔍 DEBUG: Booking saved, workerId:', bookingToReturn.workerId, ', assignmentState:', bookingToReturn.assignmentState);

      // FIX: Ensure assignmentState is correctly set for bookings with worker assigned
      // If worker is assigned but assignmentState is not ASSIGNED, update it
      if (bookingToReturn.workerId && bookingToReturn.assignmentState !== AssignmentState.ASSIGNED) {
        console.log('🔍 FIX: Updating assignmentState from', bookingToReturn.assignmentState, 'to ASSIGNED');
        await this.bookingsRepository.update(bookingToReturn.id, {
          assignmentState: AssignmentState.ASSIGNED,
          status: BookingStatus.CONFIRMED,
        });
        bookingToReturn.assignmentState = AssignmentState.ASSIGNED;
        bookingToReturn.status = BookingStatus.CONFIRMED;
      }

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

    // Use the user data (either from relation or separately loaded)
    const userData = fullUser || user;

    // Location fallback logic:
    // 1. First try user.profile location
    // 2. Then try service request metadata location
    // 3. Then try booking location
    let userLat = userData?.latitude;
    let userLng = userData?.longitude;

    console.log('🔍 Initial user location:', { userLat, userLng });

    // Fallback to service request location if user location is null
    // Need to fetch service request separately since relation may not work
    if (!userLat || !userLng) {
      // Try to get serviceRequest from relation first
      if (booking.serviceRequestId) {
        // Check if serviceRequest relation exists (it may not be loaded)
        const bookingWithServiceRequest = await this.bookingsRepository.findOne({
          where: { id: bookingId as any },
          relations: ['serviceRequest'],
        });
        const serviceRequest = bookingWithServiceRequest?.serviceRequest;

        if (serviceRequest?.metadata?.location) {
          const srLocation = serviceRequest.metadata.location;
          userLat = srLocation.lat;
          userLng = srLocation.lng;
          console.log('🔍 Using service request location:', { userLat, userLng });
        }
      }
    }

    // Fallback to booking location if still null
    if ((!userLat || !userLng) && booking.location) {
      userLat = booking.location.latitude;
      userLng = booking.location.longitude;
      console.log('🔍 Using booking location:', { userLat, userLng });
    }

    if (!userLat || !userLng) {
      throw new BadRequestException(
        'User location not available for matching',
      );
    }

    // Return with user data that has location
    return await this.attemptAssignmentWithUser(booking, userData);
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

      // Book the slot atomically (prevents race conditions)
      const slotBooked = await this.slotsService.markAsBooked((bestMatch.slot as any).id);
      if (!slotBooked) {
        // Slot was already booked by another concurrent request
        this.logger.warn(
          `Slot ${(bestMatch.slot as any).id} was already booked (race condition). Booking remains in REQUESTED state.`,
        );
        return booking;
      }

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
    // DEBUG: Log incoming amount
    console.log('🔍 DEBUG createWithAssignment: createBookingDto.amount =', createBookingDto.amount);
    
    // Create service request first
    const savedBooking = await this.create(createBookingDto);
    
    // DEBUG: Log the created booking's amount
    console.log('🔍 DEBUG createWithAssignment: savedBooking.amount =', savedBooking.amount);
    console.log('🔍 DEBUG createWithAssignment: savedBooking.totalAmount =', savedBooking.totalAmount);

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
    // Resolve userId: if it's a publicId (UUID), convert to numeric id
    let resolvedUserId: number | undefined;
    if (userId) {
      const resolved = await this.resolveUserId(userId);
      if (!resolved) {
        return [];
      }
      resolvedUserId = resolved;
    }

    const query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .orderBy('booking.createdAt', 'DESC');

    if (resolvedUserId) {
      query.where('booking.userId = :userId', { userId: resolvedUserId });
    }

    const bookings = await query.getMany();
    
    // Serialize bookings to ensure amount field is properly returned
    return bookings.map(booking => this.serializeBooking(booking));
  }

  private serializeBooking(booking: any): any {
    if (!booking) return null;
    
    console.log('🔍 DEBUG serializeBooking: booking.totalAmount =', booking.totalAmount);
    console.log('🔍 DEBUG serializeBooking: booking.amount =', booking.amount);
    
    // FIX: Don't divide by 100 - frontend sends amount in rupees, not paise
    // Previously we were dividing by 100 which caused 1200 → 12 rupees
    return {
      id: booking.id,
      publicId: booking.publicId,
      userId: booking.userId,
      workerId: booking.workerId,
      serviceId: booking.serviceId,
      serviceRequestId: booking.serviceRequestId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.amount || booking.totalAmount || 0,
      amount: booking.amount || booking.totalAmount || 0,
      status: booking.status,
      isPaid: booking.isPaid,
      type: booking.type,
      notes: booking.notes,
      location: booking.location,
      createdAt: booking.createdAt,
      worker: booking.worker ? {
        id: booking.worker.id,
        publicId: booking.worker.publicId,
        rating: booking.worker.rating,
        reviewCount: booking.worker.reviewCount,
        bio: booking.worker.bio,
        user: booking.worker.user ? {
          id: booking.worker.user.id,
          publicId: booking.worker.user.publicId,
          firstName: booking.worker.user.firstName,
          lastName: booking.worker.user.lastName,
          email: booking.worker.user.email,
        } : null,
      } : null,
      service: booking.service ? {
        id: booking.service.id,
        publicId: booking.service.publicId,
        name: booking.service.name,
        description: booking.service.description,
        basePrice: booking.service.basePrice,
        category: booking.service.category,
      } : null,
      user: booking.user ? {
        id: booking.user.id,
        publicId: booking.user.publicId,
        firstName: booking.user.firstName,
        lastName: booking.user.lastName,
        email: booking.user.email,
      } : null,
    };
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

    const savedBooking = await this.bookingsRepository.save(booking);

    // Send push notification to worker
    try {
      await this.notificationsService.notifyWorkerNewBooking(worker, savedBooking);
    } catch (error) {
      // Log but don't fail the assignment if notification fails
      this.logger.error('Failed to send worker notification:', error);
    }

    return savedBooking;
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
    // Resolve userId: if it's a publicId (UUID), convert to numeric id
    let resolvedUserId: number | undefined;
    if (userId) {
      const resolved = await this.resolveUserId(userId);
      if (!resolved) {
        // Return empty results if user not found
        return [[], 0];
      }
      resolvedUserId = resolved;
    }

    const query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('booking.service', 'service');

    if (resolvedUserId) {
      query.andWhere('booking.userId = :userId', { userId: resolvedUserId });
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

    const [bookings, total] = await query.getManyAndCount();
    
    // Serialize bookings to ensure proper date/time formatting
    const serializedBookings = bookings.map(booking => this.serializeBooking(booking));
    
    return [serializedBookings, total];
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

  async getUpcomingBookings(userPublicId: string) {
    // Resolve userId: if it's a publicId (UUID), convert to numeric id
    const resolvedUserId = await this.resolveUserId(userPublicId);
    if (!resolvedUserId) {
      return [];
    }

    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .where('booking.userId = :userId', { userId: resolvedUserId })
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

  async getPastBookings(userPublicId: string) {
    // Resolve userId: if it's a publicId (UUID), convert to numeric id
    const resolvedUserId = await this.resolveUserId(userPublicId);
    if (!resolvedUserId) {
      return [];
    }

    return this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .where('booking.userId = :userId', { userId: resolvedUserId })
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

  /**
   * Resolve user ID from various formats (publicId/UUID or numeric id)
   * @param userId - Could be publicId (UUID) or numeric id
   * @returns Numeric user id for database queries
   */
  private async resolveUserId(userId: string): Promise<number | null> {
    // If it's already a number, return it directly
    const numericId = parseInt(userId, 10);
    if (!isNaN(numericId)) {
      return numericId;
    }

    // If it's a UUID (publicId), look up the user to get numeric id
    try {
      const user = await this.usersRepository.findOneBy({ publicId: userId } as any);
      return user?.id ?? null;
    } catch (error) {
      this.logger.error(`Error resolving userId: ${error.message}`);
      return null;
    }
  }
}
