import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { SlotsService } from '../slots/slots.service';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { BookingStatus, AssignmentState, BookingType } from './entities/booking.entity';
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
    ) { }

    async findBestWorker(serviceId: string, userLat: number, userLng: number, startTime: Date, endTime: Date) {
        // Find all workers who offer this service
        const workers = await this.workersRepository.find({
            where: { services: { id: Number(serviceId) } },
            relations: ['user', 'services']
        });

        if (workers.length === 0) {
            throw new BadRequestException('No workers available for this service');
        }

        // Score each worker
        const scoredWorkers = await Promise.all(workers.map(async (worker) => {
            const user = worker.user;
            if (!user.latitude || !user.longitude) return null;

            // Calculate distance (Haversine formula)
            const distance = this.calculateDistance(userLat, userLng, user.latitude, user.longitude);

            // Check availability
            const availableSlot = await this.slotsService.findAvailableSlot(worker.id, startTime, endTime);
            if (!availableSlot) return null;

            // Calculate score (lower is better)
            const distanceScore = distance * 0.4; // 40% weight
            const ratingScore = (5 - worker.rating) * 10 * 0.3; // 30% weight (invert rating)
            const reviewScore = (100 - Math.min(worker.reviewCount, 100)) * 0.3; // 30% weight

            const totalScore = distanceScore + ratingScore + reviewScore;

            return {
                worker,
                distance,
                score: totalScore,
                slot: availableSlot
            };
        }));

        // Filter out unavailable workers and sort by score
        const availableWorkers = scoredWorkers.filter(w => w !== null).sort((a, b) => a.score - b.score);

        if (availableWorkers.length === 0) {
            throw new BadRequestException('No workers available at the requested time');
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

    async create(createBookingDto: any) {
        try {
            console.log('DEBUG: Entering create method with createBookingDto:', createBookingDto);
            let worker: Worker | null = null;
            
            // If serviceRequestId is provided, validate it exists and retrieve details
            if (createBookingDto.serviceRequestId) {
                console.log('DEBUG: serviceRequestId is provided:', createBookingDto.serviceRequestId);
                // Check if serviceRequestId is a UUID (publicId) or numeric id
                let serviceRequest;
                if (createBookingDto.serviceRequestId.length === 36 && createBookingDto.serviceRequestId.includes('-')) {
                    // It's a UUID (publicId)
                    serviceRequest = await this.serviceRequestsRepository.findOne({ 
                        where: { publicId: createBookingDto.serviceRequestId },
                        relations: ['user', 'service']
                    });
                } else {
                    // It's a string id (UUID)
                    serviceRequest = await this.serviceRequestsRepository.findOne({ 
                        where: { id: createBookingDto.serviceRequestId },
                        relations: ['user', 'service']
                    });
                }

                if (!serviceRequest) {
                    throw new BadRequestException('Service request not found');
                }

                // Validate service request is in ASSIGNED state before creating booking
                if (serviceRequest.assignmentStatus !== 'ASSIGNED') {
                    throw new BadRequestException('Service request must be in ASSIGNED state to create booking');
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
                createBookingDto.startTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), startHour, 0, 0, 0));
                createBookingDto.endTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), endHour, 0, 0, 0));
            } else {
                // Validate user exists
                const user = await this.usersRepository.findOne({ where: { id: createBookingDto.userId } });
                if (!user) {
                    throw new BadRequestException('User not found');
                }

                // Validate service exists
                const service = await this.servicesRepository.findOne({ where: { id: createBookingDto.serviceId } });
                if (!service) {
                    throw new BadRequestException('Service not found');
                }

                // Validate worker exists if workerId is provided
                if (createBookingDto.workerId) {
                    worker = await this.workersRepository.findOne({ 
                        where: { id: createBookingDto.workerId },
                        relations: ['user', 'services']
                    });
                    if (!worker) {
                        throw new BadRequestException('Worker not found');
                    }
                }

                // Validate time range
                if (createBookingDto.startTime >= createBookingDto.endTime) {
                    throw new BadRequestException('Start time must be before end time');
                }

                // Validate time is in future
                const now = new Date();
                if (createBookingDto.startTime <= now) {
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
                        relations: ['user', 'services']
                    });
                }
            }

            // Calculate total amount if not provided
            let totalAmount = createBookingDto.totalAmount;
            if (!totalAmount) {
                console.log('DEBUG: Calculating totalAmount, createBookingDto:', {
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
                    
                    const startTime = typeof createBookingDto.startTime === 'string' && createBookingDto.startTime.includes('T') 
                        ? new Date(createBookingDto.startTime)
                        : createBookingDto.startTime;
                    const endTime = typeof createBookingDto.endTime === 'string' && createBookingDto.endTime.includes('T') 
                        ? new Date(createBookingDto.endTime)
                        : createBookingDto.endTime;
                        
                    console.log('DEBUG: Parsed times:', {
                        startTime,
                        endTime,
                    });
                        
                    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                    totalAmount = basePrice * durationHours;
                    
                    console.log('DEBUG: Calculated durationHours:', durationHours);
                    console.log('DEBUG: Calculated totalAmount:', totalAmount);
                } else {
                    totalAmount = 0;
                    console.log('DEBUG: No service found, totalAmount set to 0');
                }
            }

            const bookingData = {
                ...createBookingDto,
                status: BookingStatus.REQUESTED,
                worker: workerToAssign, // Assign worker with full details if workerId is provided
                assignedWorkerId: createBookingDto.workerId, // Set assigned worker id for consistency
                type: createBookingDto.type || BookingType.ON_DEMAND,
                totalAmount: totalAmount, // Use calculated or provided amount
                assignmentState: createBookingDto.serviceRequestId || createBookingDto.workerId ? AssignmentState.ASSIGNED : AssignmentState.PENDING,
                // Parse startTime and endTime to Date objects if they're strings
                startTime: typeof createBookingDto.startTime === 'string' && createBookingDto.startTime.includes('T') 
                    ? new Date(createBookingDto.startTime)
                    : createBookingDto.startTime,
                endTime: typeof createBookingDto.endTime === 'string' && createBookingDto.endTime.includes('T') 
                    ? new Date(createBookingDto.endTime)
                    : createBookingDto.endTime,
                // Extract date from startTime if not provided
                date: createBookingDto.date || (typeof createBookingDto.startTime === 'string' && createBookingDto.startTime.includes('T') 
                    ? new Date(createBookingDto.startTime).toISOString().split('T')[0] 
                    : new Date().toISOString().split('T')[0]),
                // Ensure we have service relation
                service: await this.servicesRepository.findOne({ 
                  where: { id: createBookingDto.serviceId },
                }),
                // Ensure we have user relation  
                user: await this.usersRepository.findOne({ 
                  where: { id: createBookingDto.userId },
                }),
            };
            
            // Ensure serviceRequestId is numeric when creating the booking
            console.log('DEBUG: Creating booking with data:', bookingData);
            const booking = this.bookingsRepository.create(bookingData);

            const savedBooking = await this.bookingsRepository.save(booking);
            const bookingToReturn = Array.isArray(savedBooking) ? savedBooking[0] : savedBooking;
            
            // Load the saved booking with relations to ensure all data is returned
            const fullBooking = await this.bookingsRepository.findOne({ 
              where: { id: bookingToReturn.id },
              relations: ['user', 'worker', 'service', 'worker.user', 'worker.services']
            });
            
            return fullBooking || bookingToReturn;
        } catch (error) {
            // Log the error for debugging
            console.error('Booking creation error:', error.message, {
                userId: createBookingDto.userId,
                serviceId: createBookingDto.serviceId,
                startTime: createBookingDto.startTime,
                endTime: createBookingDto.endTime
            });
            
            // Re-throw the error with context
            throw error;
        }
    }

    async attemptAssignment(bookingId: number) {
        const booking = await this.bookingsRepository.findOne({
            where: { id: bookingId },
            relations: ['user', 'service']
        });
        if (!booking) {
            throw new BadRequestException('Booking not found');
        }

        if (booking.status !== BookingStatus.REQUESTED) {
            throw new BadRequestException('Assignment can only be attempted on REQUESTED bookings');
        }

        // Find the best worker for this booking
        const user = booking.user;
        console.log('🔍 User data:', {
            id: user?.id,
            latitude: user?.latitude,
            longitude: user?.longitude,
            hasUser: !!user
        });
        
        if (!user || !user.latitude || !user.longitude) {
            // Try to load user separately if relation didn't work
            const fullUser = await this.usersRepository.findOne({ where: { id: booking.userId } });
            console.log('🔍 Full user data:', {
                id: fullUser?.id,
                latitude: fullUser?.latitude,
                longitude: fullUser?.longitude,
                hasUser: !!fullUser
            });
            
            if (!fullUser || !fullUser.latitude || !fullUser.longitude) {
                throw new BadRequestException('User location not available for matching');
            }
            
            // Use the full user data
            return await this.attemptAssignmentWithUser(booking, fullUser);
        }
        
        return await this.attemptAssignmentWithUser(booking, user);
    }
    
    private async attemptAssignmentWithUser(booking: Booking, user: User) {
        try {
            const bestMatch = await this.findBestWorker(
                booking.service.id.toString(),
                user.latitude,
                user.longitude,
                booking.startTime,
                booking.endTime
            );

            // Book the slot and assign worker
            await this.slotsService.markAsBooked(bestMatch.slot.id);
            
            
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
            console.log(`Assignment failed for booking ${savedBooking.id}:`, error.message);
        }

        return savedBooking;
    }

    async findAll(userId?: string, workerId?: string) {
        const where: any = {};
        if (userId) where.user = { id: userId };
        if (workerId) where.worker = { id: workerId };
        return this.bookingsRepository.find({ where, relations: ['user', 'worker', 'service'] });
    }

    findOne(id: number) {
        return this.bookingsRepository.findOne({ where: { id }, relations: ['user', 'worker', 'service'] });
    }

    async update(id: number, updateBookingDto: any) {
        const currentBooking = await this.findOne(id);
        if (!currentBooking) {
            throw new BadRequestException('Booking not found');
        }

        // Handle Cancellation
        if (updateBookingDto.status === 'cancelled' && currentBooking.status !== 'cancelled') {
            const slot = await this.slotsService.findBookedSlot(currentBooking.worker.id, currentBooking.startTime, currentBooking.endTime);
            if (slot) {
                await this.slotsService.markAsAvailable(slot.id);
            }
        }

        // Handle Reschedule
        if (updateBookingDto.startTime && updateBookingDto.endTime) {
            if (new Date(updateBookingDto.startTime).getTime() !== new Date(currentBooking.startTime).getTime()) {
                // Release old slot
                const oldSlot = await this.slotsService.findBookedSlot(currentBooking.worker.id, currentBooking.startTime, currentBooking.endTime);
                if (oldSlot) {
                    await this.slotsService.markAsAvailable(oldSlot.id);
                }

                // Check and book new slot
                const newSlot = await this.slotsService.findAvailableSlot(currentBooking.worker.id, new Date(updateBookingDto.startTime), new Date(updateBookingDto.endTime));
                if (!newSlot) {
                    throw new BadRequestException('New slot not available');
                }
                await this.slotsService.markAsBooked(newSlot.id);
            }
        }

        return this.bookingsRepository.update(id, updateBookingDto);
    }

    async assignBooking(assignBookingDto: any) {
        const { bookingId, workerId } = assignBookingDto;
        
        if (!bookingId || !workerId) {
            throw new BadRequestException('Booking ID and Worker ID are required');
        }

        const booking = await this.findOne(bookingId);
        if (!booking) {
            throw new BadRequestException('Booking not found');
        }

        // Check if worker is available for the booking time
        const slot = await this.slotsService.findAvailableSlot(workerId, booking.startTime, booking.endTime);
        if (!slot) {
            throw new BadRequestException('Worker not available for the booking time');
        }

        // Mark slot as booked
        await this.slotsService.markAsBooked(slot.id);

        // Update booking with assigned worker
        return this.bookingsRepository.update(bookingId, { worker: { id: workerId } });
    }
}
