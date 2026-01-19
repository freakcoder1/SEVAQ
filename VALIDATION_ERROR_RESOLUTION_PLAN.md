# Validation Error Resolution Implementation Plan

## Overview

This document outlines the specific implementation steps to resolve the remaining validation errors in the backend service request creation process. The plan focuses on creating robust validation layers that provide clear error messages while maintaining system stability.

## Implementation Steps

### Step 1: Create Validation DTOs

**File: `flutter-nest-househelp-master/src/bookings/dto/create-booking.dto.ts`**

```typescript
import { IsUUID, IsDate, IsOptional, IsString, IsEnum, Min, Max, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingStatus, BookingType } from '../entities/booking.entity';

export class CreateBookingDto {
  @IsUUID()
  @ApiProperty({
    description: 'Service ID for the booking',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  serviceId: string;

  @IsUUID()
  @ApiProperty({
    description: 'User ID making the booking',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  userId: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Start time for the service',
    example: '2024-01-15T10:00:00.000Z'
  })
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'End time for the service',
    example: '2024-01-15T12:00:00.000Z'
  })
  endTime: Date;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Additional notes for the booking',
    example: 'Please arrive 15 minutes early'
  })
  notes?: string;

  @IsOptional()
  @IsEnum(BookingType)
  @ApiPropertyOptional({
    description: 'Type of booking',
    enum: BookingType,
    default: BookingType.ON_DEMAND
  })
  type?: BookingType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Additional metadata for the booking',
    example: '{"special_requirements": "pet_friendly"}'
  })
  metadata?: string;
}
```

### Step 2: Create Update Booking DTO

**File: `flutter-nest-househelp-master/src/bookings/dto/update-booking.dto.ts`**

```typescript
import { IsUUID, IsDate, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingStatus, AssignmentState } from '../entities/booking.entity';

export class UpdateBookingDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'Worker ID for assignment',
    example: '550e8400-e29b-41d4-a716-446655440002'
  })
  workerId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({
    description: 'Updated start time',
    example: '2024-01-15T10:30:00.000Z'
  })
  startTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({
    description: 'Updated end time',
    example: '2024-01-15T12:30:00.000Z'
  })
  endTime?: Date;

  @IsOptional()
  @IsEnum(BookingStatus)
  @ApiPropertyOptional({
    description: 'Updated booking status',
    enum: BookingStatus
  })
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(AssignmentState)
  @ApiPropertyOptional({
    description: 'Updated assignment state',
    enum: AssignmentState
  })
  assignmentState?: AssignmentState;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Updated notes',
    example: 'Customer requested later start time'
  })
  notes?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Whether responsibility has been transferred',
    default: false
  })
  responsibilityTransferred?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Whether system monitoring is active',
    default: false
  })
  systemMonitoring?: boolean;
}
```

### Step 3: Update Bookings Controller

**File: `flutter-nest-househelp-master/src/bookings/bookings.controller.ts`**

```typescript
import { Controller, Get, Post, Body, Param, Patch, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create a new booking' })
    @ApiBody({ type: CreateBookingDto })
    @ApiResponse({ status: 201, description: 'Booking created successfully', type: Booking })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @ApiResponse({ status: 404, description: 'User or service not found' })
    create(@Body() createBookingDto: CreateBookingDto) {
        return this.bookingsService.create(createBookingDto);
    }

    @Post(':id/attempt-assignment')
    @ApiOperation({ summary: 'Attempt to assign a worker to a booking' })
    @ApiParam({ name: 'id', description: 'Booking ID' })
    @ApiResponse({ status: 200, description: 'Assignment attempted', type: Booking })
    @ApiResponse({ status: 400, description: 'Booking not found or already assigned' })
    attemptAssignment(@Param('id') id: string) {
        return this.bookingsService.attemptAssignment(id);
    }

    @Post(':id/create-with-assignment')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create booking and attempt assignment' })
    @ApiParam({ name: 'id', description: 'Booking ID' })
    @ApiBody({ type: CreateBookingDto })
    @ApiResponse({ status: 201, description: 'Booking created and assignment attempted', type: Booking })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    createWithAssignment(@Param('id') id: string, @Body() createBookingDto: CreateBookingDto) {
        return this.bookingsService.createWithAssignment(createBookingDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all bookings' })
    @ApiResponse({ status: 200, description: 'Bookings retrieved successfully', type: [Booking] })
    findAll(@Query('userId') userId?: string, @Query('workerId') workerId?: string) {
        return this.bookingsService.findAll(userId, workerId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get booking by ID' })
    @ApiParam({ name: 'id', description: 'Booking ID' })
    @ApiResponse({ status: 200, description: 'Booking found', type: Booking })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    @Patch(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Update a booking' })
    @ApiParam({ name: 'id', description: 'Booking ID' })
    @ApiBody({ type: UpdateBookingDto })
    @ApiResponse({ status: 200, description: 'Booking updated successfully' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
        return this.bookingsService.update(id, updateBookingDto);
    }

    @Post('assign')
    @ApiOperation({ summary: 'Assign a worker to a booking' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                bookingId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
                workerId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Worker assigned successfully' })
    @ApiResponse({ status: 400, description: 'Validation failed or worker not available' })
    @ApiResponse({ status: 404, description: 'Booking or worker not found' })
    assignBooking(@Body() assignBookingDto: { bookingId: string; workerId: string }) {
        return this.bookingsService.assignBooking(assignBookingDto);
    }
}
```

### Step 4: Enhance Bookings Service with Validation

**File: `flutter-nest-househelp-master/src/bookings/bookings.service.ts`**

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { SlotsService } from '../slots/slots.service';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { BookingStatus, AssignmentState } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

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
        private slotsService: SlotsService,
    ) { }

    async findBestWorker(serviceId: string, userLat: number, userLng: number, startTime: Date, endTime: Date) {
        // Find all workers who offer this service
        const workers = await this.workersRepository.find({
            where: { services: { id: serviceId } },
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

    async create(createBookingDto: CreateBookingDto) {
        try {
            // Validate user exists
            const user = await this.usersRepository.findOne({ where: { id: createBookingDto.userId } });
            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Validate service exists
            const service = await this.servicesRepository.findOne({ where: { id: createBookingDto.serviceId } });
            if (!service) {
                throw new NotFoundException('Service not found');
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

            // Create service request (intent only) - never fail due to worker availability
            const booking = this.bookingsRepository.create({
                ...createBookingDto,
                status: BookingStatus.REQUESTED,
                worker: null, // No worker assigned yet
                type: createBookingDto.type || BookingType.ON_DEMAND
            });

            const savedBooking = await this.bookingsRepository.save(booking);
            return Array.isArray(savedBooking) ? savedBooking[0] : savedBooking;
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

    async attemptAssignment(bookingId: string) {
        const booking = await this.bookingsRepository.findOne({
            where: { id: bookingId },
            relations: ['user', 'service']
        });
        if (!booking) {
            throw new NotFoundException('Booking not found');
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
                booking.service.id,
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
            console.log(`Assignment failed for booking ${booking.id}:`, error.message);
            return booking;
        }
    }

    async createWithAssignment(createBookingDto: CreateBookingDto) {
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

    findOne(id: string) {
        return this.bookingsRepository.findOne({ where: { id }, relations: ['user', 'worker', 'service'] });
    }

    async update(id: string, updateBookingDto: UpdateBookingDto) {
        const currentBooking = await this.findOne(id);
        if (!currentBooking) {
            throw new NotFoundException('Booking not found');
        }

        // Handle Cancellation
        if (updateBookingDto.status === 'cancelled' && currentBooking.status !== 'cancelled') {
            if (currentBooking.slotId) {
                await this.slotsService.markAsAvailable(currentBooking.slotId);
            }
        }

        // Handle Reschedule
        if (updateBookingDto.startTime && updateBookingDto.endTime) {
            if (new Date(updateBookingDto.startTime).getTime() !== new Date(currentBooking.startTime).getTime()) {
                // Release old slot
                if (currentBooking.slotId) {
                    await this.slotsService.markAsAvailable(currentBooking.slotId);
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

    async assignBooking(assignBookingDto: { bookingId: string; workerId: string }) {
        const { bookingId, workerId } = assignBookingDto;
        
        if (!bookingId || !workerId) {
            throw new BadRequestException('Booking ID and Worker ID are required');
        }

        const booking = await this.findOne(bookingId);
        if (!booking) {
            throw new NotFoundException('Booking not found');
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
```

### Step 5: Create Custom Validation Decorators

**File: `flutter-nest-househelp-master/src/common/decorators/valid-uuid.decorator.ts`**

```typescript
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsValidUUIDConstraint implements ValidatorConstraintInterface {
    validate(uuid: any) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof uuid === 'string' && uuidRegex.test(uuid);
    }

    defaultMessage() {
        return 'Invalid UUID format';
    }
}

export function IsValidUUID(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidUUIDConstraint,
        });
    };
}
```

### Step 6: Add Global Exception Filter

**File: `flutter-nest-househelp-master/src/common/filters/validation-exception.filter.ts`**

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ValidationExceptionFilter.name);

    catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        // Log validation errors
        this.logger.error(`Validation failed for ${request.method} ${request.url}`, {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            body: request.body,
            errors: exceptionResponse
        });

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: 'Validation failed',
            errors: typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse['message'] || 'Invalid input data'
        });
    }
}
```

### Step 7: Update App Module to Use Exception Filter

**File: `flutter-nest-househelp-master/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BookingsModule } from './bookings/bookings.module';
import { WorkersModule } from './workers/workers.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { SlotsModule } from './slots/slots.module';
import { AuthModule } from './auth/auth.module';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    BookingsModule,
    WorkersModule,
    ServicesModule,
    UsersModule,
    SlotsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_FILTER',
      useClass: ValidationExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## Testing Strategy

### Unit Tests

Create comprehensive unit tests for validation:

```typescript
// test/bookings/bookings.validation.spec.ts
describe('Bookings Validation', () => {
  let bookingsService: BookingsService;
  let usersRepository: Repository<User>;
  let servicesRepository: Repository<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingsService, SlotsService],
      imports: [TypeOrmModule.forFeature([Booking, User, Service, Worker])],
    }).compile();

    bookingsService = module.get<BookingsService>(BookingsService);
    usersRepository = module.get<Repository<User>>('UserRepository');
    servicesRepository = module.get<Repository<Service>>('ServiceRepository');
  });

  describe('create booking validation', () => {
    it('should throw error for invalid user ID', async () => {
      const dto = {
        serviceId: 'valid-service-id',
        userId: 'invalid-uuid',
        startTime: new Date(),
        endTime: new Date()
      };

      await expect(bookingsService.create(dto)).rejects.toThrow('Invalid UUID format');
    });

    it('should throw error for non-existent user', async () => {
      const dto = {
        serviceId: 'valid-service-id',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: new Date(),
        endTime: new Date()
      };

      await expect(bookingsService.create(dto)).rejects.toThrow('User not found');
    });

    it('should throw error for invalid time range', async () => {
      const dto = {
        serviceId: 'valid-service-id',
        userId: 'valid-user-id',
        startTime: new Date('2024-01-15T12:00:00.000Z'),
        endTime: new Date('2024-01-15T10:00:00.000Z')
      };

      await expect(bookingsService.create(dto)).rejects.toThrow('Start time must be before end time');
    });
  });
});
```

### Integration Tests

Test the complete booking creation flow:

```typescript
// test/bookings/bookings.e2e-spec.ts
describe('Bookings E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/POST bookings (create booking)', () => {
    return request(app.getHttpServer())
      .post('/bookings')
      .send({
        serviceId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        startTime: '2024-01-15T10:00:00.000Z',
        endTime: '2024-01-15T12:00:00.000Z'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('requested');
      });
  });

  it('/POST bookings (validation error)', () => {
    return request(app.getHttpServer())
      .post('/bookings')
      .send({
        serviceId: 'invalid-uuid',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        startTime: '2024-01-15T10:00:00.000Z',
        endTime: '2024-01-15T12:00:00.000Z'
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('Validation failed');
      });
  });
});
```

## Monitoring and Logging

### Enhanced Logging

Add structured logging for better debugging:

```typescript
// src/common/logger/booking-logger.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BookingLoggerService {
  private readonly logger = new Logger(BookingLoggerService.name);

  logBookingCreation(dto: CreateBookingDto, result: any) {
    this.logger.log('Booking created successfully', {
      userId: dto.userId,
      serviceId: dto.serviceId,
      startTime: dto.startTime,
      endTime: dto.endTime,
      bookingId: result.id,
      status: result.status
    });
  }

  logBookingError(dto: CreateBookingDto, error: any) {
    this.logger.error('Booking creation failed', {
      userId: dto.userId,
      serviceId: dto.serviceId,
      startTime: dto.startTime,
      endTime: dto.endTime,
      error: error.message,
      stack: error.stack
    });
  }
}
```

## Expected Outcomes

1. **Clear Error Messages**: Users will receive specific, actionable error messages
2. **Proper Logging**: All validation errors will be logged with context for debugging
3. **Graceful Degradation**: App will handle validation errors without crashing
4. **Improved User Experience**: Users will understand what went wrong and how to fix it
5. **Better Debugging**: Developers can easily identify and fix validation issues

## Rollout Plan

1. **Phase 1**: Implement DTO validation and basic error handling
2. **Phase 2**: Add comprehensive logging and monitoring
3. **Phase 3**: Create unit and integration tests
4. **Phase 4**: Deploy and monitor in staging environment
5. **Phase 5**: Deploy to production with rollback plan

This implementation ensures that the remaining validation errors are properly handled, logged, and resolved while maintaining the stability and functionality of the application.