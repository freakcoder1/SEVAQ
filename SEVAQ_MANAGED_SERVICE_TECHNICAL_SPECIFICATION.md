# SEVAQ Managed Service Technical Specification

## Core Entities

### AssignmentRequest Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';

export enum AssignmentRequestStatus {
  REQUESTED = 'REQUESTED',
  ASSIGNING = 'ASSIGNING', 
  ASSIGNED = 'ASSIGNED',
  FAILED_TO_ASSIGN = 'FAILED_TO_ASSIGN'
}

@Entity('assignment_requests')
export class AssignmentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ 
    type: 'text', 
    default: AssignmentRequestStatus.REQUESTED 
  })
  status: AssignmentRequestStatus;

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'datetime', nullable: true })
  lastAttemptAt: Date;

  @Column({ type: 'datetime', nullable: true })
  assignedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  assignedWorkerId: string;

  @Column({ type: 'text', nullable: true })
  assignmentMetadata: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Enhanced Booking Entity

```typescript
// Update existing AssignmentState enum
export enum AssignmentState {
  REQUESTED = 'requested',      // NEW: Intent captured, no assignment yet
  ASSIGNING = 'assigning',      // NEW: Assignment in progress
  ASSIGNED = 'assigned',        // Existing: Worker assigned
  CONFIRMED = 'confirmed',      // Existing: Worker confirmed
  REASSIGNING = 'reassigning',  // Existing: Reassignment in progress
  CANCELLED = 'cancelled'       // Existing: Assignment cancelled
}

// Update Booking entity with new fields
@Entity('booking')
export class Booking {
  // ... existing fields

  @Column({ type: 'text', default: AssignmentState.REQUESTED })
  assignmentState: AssignmentState;

  @Column({ type: 'uuid', nullable: true })
  assignmentRequestId: string;

  @Column({ type: 'integer', default: 0 })
  assignmentRetryCount: number;

  @Column({ type: 'text', nullable: true })
  assignmentFailureReason: string;

  @Column({ type: 'datetime', nullable: true })
  assignmentStartedAt: Date;

  // ... rest of existing fields
}
```

## Service Layer

### AssignmentRequestsService

```typescript
@Injectable()
export class AssignmentRequestsService {
  constructor(
    @InjectRepository(AssignmentRequest)
    private assignmentRequestsRepository: Repository<AssignmentRequest>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async createAssignmentRequest(bookingId: string): Promise<AssignmentRequest> {
    const assignmentRequest = this.assignmentRequestsRepository.create({
      bookingId,
      status: AssignmentRequestStatus.REQUESTED
    });

    return this.assignmentRequestsRepository.save(assignmentRequest);
  }

  async updateStatus(
    requestId: string, 
    status: AssignmentRequestStatus,
    metadata?: any
  ): Promise<void> {
    await this.assignmentRequestsRepository.update(requestId, {
      status,
      lastAttemptAt: status === AssignmentRequestStatus.ASSIGNING ? new Date() : undefined,
      assignedAt: status === AssignmentRequestStatus.ASSIGNED ? new Date() : undefined,
      assignmentMetadata: metadata ? JSON.stringify(metadata) : undefined
    });
  }

  async markAsAssigned(
    requestId: string, 
    workerId: string,
    assignmentMetadata: any
  ): Promise<void> {
    await this.updateStatus(requestId, AssignmentRequestStatus.ASSIGNED, {
      ...assignmentMetadata,
      assignedWorkerId: workerId,
      assignedAt: new Date()
    });

    // Update booking state
    const request = await this.assignmentRequestsRepository.findOne({
      where: { id: requestId },
      relations: ['booking']
    });

    if (request) {
      await this.bookingsRepository.update(request.bookingId, {
        assignmentState: AssignmentState.ASSIGNED,
        assignedWorkerId: workerId,
        assignmentTimestamp: new Date(),
        assignmentMetadata: JSON.stringify(assignmentMetadata)
      });
    }
  }

  async markAsFailed(
    requestId: string, 
    reason: string
  ): Promise<void> {
    await this.updateStatus(requestId, AssignmentRequestStatus.FAILED_TO_ASSIGN, {
      failureReason: reason
    });

    // Update booking state
    const request = await this.assignmentRequestsRepository.findOne({
      where: { id: requestId },
      relations: ['booking']
    });

    if (request) {
      await this.bookingsRepository.update(request.bookingId, {
        assignmentState: AssignmentState.FAILED_TO_ASSIGN,
        assignmentFailureReason: reason,
        assignmentTimestamp: new Date()
      });
    }
  }

  async getStatus(requestId: string): Promise<{
    status: AssignmentRequestStatus;
    worker?: any;
    failureReason?: string;
    retryCount: number;
    lastAttemptAt?: Date;
  }> {
    const request = await this.assignmentRequestsRepository.findOne({
      where: { id: requestId },
      relations: ['booking', 'booking.worker']
    });

    if (!request) {
      throw new NotFoundException('Assignment request not found');
    }

    return {
      status: request.status,
      worker: request.booking?.worker,
      failureReason: request.failureReason,
      retryCount: request.retryCount,
      lastAttemptAt: request.lastAttemptAt
    };
  }
}
```

### Async Assignment Worker

```typescript
@Injectable()
export class AssignmentWorker {
  constructor(
    private assignmentRequestsService: AssignmentRequestsService,
    private assignmentsService: AssignmentsService,
    private waitlistService: WaitlistService,
  ) {}

  @Process('assignment')
  async processAssignment(job: Job<AssignmentJobData>) {
    const { requestId } = job.data;
    
    try {
      const request = await this.assignmentRequestsService.findById(requestId);
      
      // Update status to ASSIGNING
      await this.assignmentRequestsService.updateStatus(
        requestId, 
        AssignmentRequestStatus.ASSIGNING
      );
      
      // Attempt assignment with retry logic
      const result = await this.assignmentsService.attemptAssignment({
        bookingId: request.bookingId,
        serviceId: request.booking.serviceId,
        userLat: request.booking.user.latitude,
        userLng: request.booking.user.longitude,
        startTime: request.booking.startTime,
        endTime: request.booking.endTime
      });

      if (result.success) {
        await this.assignmentRequestsService.markAsAssigned(
          requestId, 
          result.worker.id,
          {
            distance: result.worker.distance,
            workerRating: result.worker.rating,
            workerExperience: result.worker.yearsOfExperience,
            matchingScore: result.worker.score
          }
        );
      } else {
        await this.handleAssignmentFailure(requestId, result.reason);
      }
    } catch (error) {
      await this.handleAssignmentFailure(requestId, error.message);
    }
  }

  private async handleAssignmentFailure(requestId: string, reason: string) {
    const request = await this.assignmentRequestsService.findById(requestId);
    
    if (request.retryCount < 3) {
      // Retry after delay
      await this.assignmentRequestsService.incrementRetry(requestId);
      await this.assignmentRequestsService.updateStatus(
        requestId, 
        AssignmentRequestStatus.REQUESTED
      );
      
      // Queue retry with exponential backoff
      const delay = Math.pow(2, request.retryCount) * 1000; // 1s, 2s, 4s
      await this.queueAssignment(requestId, { delay });
    } else {
      // Move to waitlist
      await this.assignmentRequestsService.markAsFailed(requestId, reason);
      
      await this.waitlistService.addToWaitlist({
        bookingId: request.bookingId,
        reason: reason,
        estimatedWaitTime: this.calculateWaitTime(request.booking.serviceId)
      });
    }
  }

  private calculateWaitTime(serviceId: string): number {
    // Logic to calculate estimated wait time based on service demand
    return 30; // minutes
  }
}
```

## API Controllers

### AssignmentRequestsController

```typescript
@Controller('assignment-requests')
export class AssignmentRequestsController {
  constructor(
    private assignmentRequestsService: AssignmentRequestsService,
    private assignmentWorker: AssignmentWorker,
  ) {}

  @Post('create')
  async createAssignmentRequest(@Body() createRequest: {
    bookingId: string;
  }) {
    // Create assignment request
    const request = await this.assignmentRequestsService.createAssignmentRequest(
      createRequest.bookingId
    );

    // Queue assignment job
    await this.assignmentWorker.queueAssignment(request.id);

    return {
      success: true,
      requestId: request.id,
      message: 'Assignment request created successfully'
    };
  }

  @Get(':requestId/status')
  async getAssignmentStatus(@Param('requestId') requestId: string) {
    return this.assignmentRequestsService.getStatus(requestId);
  }

  @Post(':requestId/retry')
  async retryAssignment(@Param('requestId') requestId: string) {
    // Reset retry count and requeue
    await this.assignmentRequestsService.resetRetry(requestId);
    await this.assignmentWorker.queueAssignment(requestId);
    
    return { success: true, message: 'Assignment retry queued' };
  }
}
```

### Enhanced AssignmentsController

```typescript
@Controller('assignments')
export class AssignmentsController {
  constructor(
    private assignmentsService: AssignmentsService,
    private assignmentRequestsService: AssignmentRequestsService,
  ) {}

  // NEW: Two-phase assignment endpoints
  @Post('request')
  async createAssignmentRequest(@Body() request: {
    bookingId: string;
    serviceId: string;
    userLat: number;
    userLng: number;
    startTime: Date;
    endTime: Date;
    userId: string;
  }) {
    // 1. Create booking with REQUESTED state
    const booking = await this.assignmentsService.createBookingWithAssignment({
      userId: request.userId,
      serviceId: request.serviceId,
      startTime: request.startTime,
      endTime: request.endTime,
      amount: 500.0, // Default amount for testing
      status: 'PENDING',
      type: 'SCHEDULED',
      assignmentState: AssignmentState.REQUESTED
    });

    // 2. Create assignment request
    const assignmentRequest = await this.assignmentRequestsService.createAssignmentRequest(
      booking.id
    );

    // 3. Queue assignment job
    await this.assignmentWorker.queueAssignment(assignmentRequest.id);

    return {
      success: true,
      bookingId: booking.id,
      requestId: assignmentRequest.id,
      message: 'Assignment request created successfully'
    };
  }

  @Get('status/:requestId')
  async getAssignmentStatus(@Param('requestId') requestId: string) {
    return this.assignmentRequestsService.getStatus(requestId);
  }

  // Keep existing endpoints for backward compatibility
  @Post('assign')
  async assignProfessional(@Body() assignmentRequest: {
    bookingId: string;
    serviceId: string;
    userLat: number;
    userLng: number;
    startTime: Date;
    endTime: Date;
  }) {
    return this.assignmentsService.assignProfessional(assignmentRequest);
  }
}
```

## Frontend Models

### Assignment Models

```dart
enum AssignmentStatus {
  requested,
  assigning,
  assigned,
  failedToAssign
}

class AssignmentRequest {
  final String id;
  final String bookingId;
  final AssignmentStatus status;
  final int retryCount;
  final String? failureReason;
  final DateTime? lastAttemptAt;
  final DateTime? assignedAt;
  final String? assignedWorkerId;
  final Map<String, dynamic>? assignmentMetadata;

  AssignmentRequest({
    required this.id,
    required this.bookingId,
    required this.status,
    required this.retryCount,
    this.failureReason,
    this.lastAttemptAt,
    this.assignedAt,
    this.assignedWorkerId,
    this.assignmentMetadata,
  });

  factory AssignmentRequest.fromJson(Map<String, dynamic> json) {
    return AssignmentRequest(
      id: json['id'],
      bookingId: json['bookingId'],
      status: AssignmentStatus.values.firstWhere(
        (e) => e.toString().split('.').last == json['status'].toLowerCase(),
        orElse: () => AssignmentStatus.requested,
      ),
      retryCount: json['retryCount'] ?? 0,
      failureReason: json['failureReason'],
      lastAttemptAt: json['lastAttemptAt'] != null 
        ? DateTime.parse(json['lastAttemptAt'])
        : null,
      assignedAt: json['assignedAt'] != null 
        ? DateTime.parse(json['assignedAt'])
        : null,
      assignedWorkerId: json['assignedWorkerId'],
      assignmentMetadata: json['assignmentMetadata'],
    );
  }
}

class AssignmentStatusResponse {
  final AssignmentStatus status;
  final Worker? worker;
  final String? failureReason;
  final int retryCount;
  final DateTime? lastAttemptAt;

  AssignmentStatusResponse({
    required this.status,
    this.worker,
    this.failureReason,
    required this.retryCount,
    this.lastAttemptAt,
  });

  factory AssignmentStatusResponse.fromJson(Map<String, dynamic> json) {
    return AssignmentStatusResponse(
      status: AssignmentStatus.values.firstWhere(
        (e) => e.toString().split('.').last == json['status'].toLowerCase(),
        orElse: () => AssignmentStatus.requested,
      ),
      worker: json['worker'] != null ? Worker.fromJson(json['worker']) : null,
      failureReason: json['failureReason'],
      retryCount: json['retryCount'] ?? 0,
      lastAttemptAt: json['lastAttemptAt'] != null 
        ? DateTime.parse(json['lastAttemptAt'])
        : null,
    );
  }
}
```

## Database Migrations

### Migration: Add Assignment Requests Table

```sql
CREATE TABLE assignment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'REQUESTED',
  retry_count INTEGER DEFAULT 0,
  failure_reason TEXT,
  last_attempt_at TIMESTAMP,
  assigned_at TIMESTAMP,
  assigned_worker_id UUID,
  assignment_metadata TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assignment_requests_booking_id ON assignment_requests(booking_id);
CREATE INDEX idx_assignment_requests_status ON assignment_requests(status);
CREATE INDEX idx_assignment_requests_assigned_worker_id ON assignment_requests(assigned_worker_id);
```

### Migration: Update Booking Table

```sql
ALTER TABLE booking ADD COLUMN assignment_state VARCHAR(50) DEFAULT 'REQUESTED';
ALTER TABLE booking ADD COLUMN assignment_request_id UUID REFERENCES assignment_requests(id);
ALTER TABLE booking ADD COLUMN assignment_retry_count INTEGER DEFAULT 0;
ALTER TABLE booking ADD COLUMN assignment_failure_reason TEXT;
ALTER TABLE booking ADD COLUMN assignment_started_at TIMESTAMP;

-- Update existing bookings to REQUESTED state
UPDATE booking SET assignment_state = 'REQUESTED' WHERE assignment_state IS NULL;
```

This technical specification provides the complete foundation for implementing the managed service architecture that eliminates premature assignment failures and provides a smooth user experience aligned with the reality of dynamic service availability.