# SEVAQ Assignment Flow Implementation Plan

## Overview

This document provides a step-by-step implementation plan for the managed service assignment flow that eliminates premature assignment failures and provides a smooth user experience.

## Implementation Phases

### Phase 1: Backend Foundation (Days 1-3)

#### Day 1: Database & Entities
**Morning (2-3 hours):**
1. **Create AssignmentRequest Entity**
   ```typescript
   // src/assignment-requests/entities/assignment-request.entity.ts
   @Entity('assignment_requests')
   export class AssignmentRequest {
     // Implementation from technical specification
   }
   ```

2. **Update Booking Entity**
   ```typescript
   // Update existing booking.entity.ts
   // Add new assignment states and fields
   ```

3. **Create Database Migration**
   ```sql
   -- migrations/001_create_assignment_requests.sql
   CREATE TABLE assignment_requests (...);
   ALTER TABLE booking ADD COLUMN ...;
   ```

**Afternoon (3-4 hours):**
4. **Implement AssignmentRequestsService**
   ```typescript
   // src/assignment-requests/assignment-requests.service.ts
   @Injectable()
   export class AssignmentRequestsService {
     // All methods from technical specification
   }
   ```

5. **Create AssignmentRequestsModule**
   ```typescript
   // src/assignment-requests/assignment-requests.module.ts
   @Module({
     imports: [TypeOrmModule.forFeature([AssignmentRequest, Booking])],
     providers: [AssignmentRequestsService],
     controllers: [AssignmentRequestsController],
   })
   export class AssignmentRequestsModule {}
   ```

#### Day 2: Worker & Job System
**Morning (2-3 hours):**
1. **Install Queue Dependencies**
   ```bash
   npm install @nestjs/bull bull
   npm install -D @types/bull
   ```

2. **Configure Queue Module**
   ```typescript
   // src/app.module.ts
   BullModule.forRoot({
     redis: {
       host: process.env.REDIS_HOST || 'localhost',
       port: parseInt(process.env.REDIS_PORT) || 6379,
     },
   }),
   ```

3. **Create AssignmentWorker**
   ```typescript
   // src/assignment-requests/assignment.worker.ts
   @Processor('assignment')
   export class AssignmentWorker {
     // Implementation from technical specification
   }
   ```

**Afternoon (3-4 hours):**
4. **Create AssignmentRequestsController**
   ```typescript
   // src/assignment-requests/assignment-requests.controller.ts
   @Controller('assignment-requests')
   export class AssignmentRequestsController {
     // All endpoints from technical specification
   }
   ```

5. **Update AssignmentsController**
   ```typescript
   // Add new endpoints while maintaining backward compatibility
   @Post('request')
   async createAssignmentRequest(@Body() request: CreateAssignmentRequestDto)
   ```

#### Day 3: Integration & Testing
**Morning (2-3 hours):**
1. **Add DTOs and Validation**
   ```typescript
   // src/assignment-requests/dto/
   export class CreateAssignmentRequestDto {
     @IsUUID()
     bookingId: string;
   }
   ```

2. **Implement Error Handling**
   ```typescript
   // src/common/assignment-exception.filter.ts
   @Catch(BadRequestException)
   export class AssignmentExceptionFilter implements ExceptionFilter {
     // Business error vs system error handling
   }
   ```

**Afternoon (3-4 hours):**
3. **Write Unit Tests**
   ```typescript
   // test/assignment-requests/assignment-requests.service.spec.ts
   describe('AssignmentRequestsService', () => {
     // Test all service methods
   });
   ```

4. **Integration Testing**
   ```typescript
   // test/assignment-requests/assignment-requests.e2e-spec.ts
   describe('Assignment Requests E2E', () => {
     // Test complete flow
   });
   ```

### Phase 2: Frontend Implementation (Days 4-6)

#### Day 4: Models & Services
**Morning (2-3 hours):**
1. **Create Dart Models**
   ```dart
   // lib/models/assignment_request.dart
   enum AssignmentStatus { requested, assigning, assigned, failedToAssign }
   
   class AssignmentRequest {
     // Implementation from technical specification
   }
   ```

2. **Update ApiService**
   ```dart
   // lib/services/api_service.dart
   extension AssignmentApi on ApiService {
     Future<AssignmentStatusResponse> getAssignmentStatus(String requestId)
     Future<AssignmentRequestResponse> createAssignmentRequest(...)
   }
   ```

**Afternoon (3-4 hours):**
3. **Create Assignment Provider**
   ```dart
   // lib/providers/assignment_provider.dart
   class AssignmentProvider with ChangeNotifier {
     // State management for assignment flow
   }
   ```

4. **Update Existing Providers**
   ```dart
   // Update booking_provider.dart to handle new states
   ```

#### Day 5: UI Components
**Morning (2-3 hours):**
1. **Create FindingProfessionalScreen**
   ```dart
   // lib/screens/finding_professional_screen.dart
   class FindingProfessionalScreen extends StatefulWidget {
     // Implementation from technical specification
   }
   ```

2. **Create Assignment Status Widgets**
   ```dart
   // lib/widgets/assignment_status_widget.dart
   class AssignmentStatusWidget extends StatelessWidget {
     // Loading states, progress indicators, etc.
   }
   ```

**Afternoon (3-4 hours):**
3. **Update BookingConfirmationScreen**
   ```dart
   // Handle both immediate and async assignment scenarios
   ```

4. **Create Retry/Waitlist Components**
   ```dart
   // lib/widgets/retry_assignment_widget.dart
   // lib/widgets/waitlist_widget.dart
   ```

#### Day 6: Integration & Polish
**Morning (2-3 hours):**
1. **Update Navigation Flow**
   ```dart
   // lib/routes/app_routes.dart
   // Add new screen routes
   ```

2. **Update Main Booking Flow**
   ```dart
   // Update existing booking screens to use new flow
   ```

**Afternoon (3-4 hours):**
3. **Add Error Handling**
   ```dart
   // lib/widgets/error_handling_widget.dart
   // Distinguish business vs system errors
   ```

4. **Performance Optimization**
   ```dart
   // Optimize polling, caching, state updates
   ```

### Phase 3: Testing & Deployment (Days 7-8)

#### Day 7: Comprehensive Testing
**Morning (2-3 hours):**
1. **End-to-End Testing**
   ```dart
   // test_driver/assignment_flow_test.dart
   // Test complete user journey
   ```

2. **Performance Testing**
   ```dart
   // Test assignment processing time, polling impact
   ```

**Afternoon (3-4 hours):**
3. **Integration Testing**
   ```bash
   # Test backend-frontend integration
   npm run test:e2e
   flutter test
   ```

4. **Load Testing**
   ```bash
   # Test system under load
   # Monitor queue performance, database performance
   ```

#### Day 8: Deployment & Monitoring
**Morning (2-3 hours):**
1. **Feature Flag Implementation**
   ```typescript
   // src/common/feature-flags.decorator.ts
   // Add feature flag for gradual rollout
   ```

2. **Monitoring Setup**
   ```typescript
   // Add metrics, logging, health checks
   ```

**Afternoon (3-4 hours):**
3. **Deployment Scripts**
   ```bash
   # Create deployment scripts for new components
   # Update CI/CD pipeline
   ```

4. **Documentation**
   ```markdown
   # Update API documentation
   # Create deployment guides
   # Update troubleshooting docs
   ```

## Detailed Implementation Steps

### Step 1: Database Setup (2 hours)

1. **Create Migration File**
   ```sql
   -- migrations/001_create_assignment_requests.sql
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
   ```

2. **Run Migration**
   ```bash
   npm run typeorm:migration:run
   ```

### Step 2: Backend Services (4 hours)

1. **Create AssignmentRequest Entity**
   ```typescript
   // src/assignment-requests/entities/assignment-request.entity.ts
   import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
   import { Booking } from '../../bookings/entities/booking.entity';

   @Entity('assignment_requests')
   export class AssignmentRequest {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'uuid' })
     bookingId: string;

     @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'booking_id' })
     booking: Booking;

     @Column({ type: 'text', default: 'REQUESTED' })
     status: string;

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

2. **Implement Service**
   ```typescript
   // src/assignment-requests/assignment-requests.service.ts
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
         status: 'REQUESTED'
       });
       return this.assignmentRequestsRepository.save(assignmentRequest);
     }

     async updateStatus(requestId: string, status: string): Promise<void> {
       await this.assignmentRequestsRepository.update(requestId, {
         status,
         lastAttemptAt: status === 'ASSIGNING' ? new Date() : undefined,
         assignedAt: status === 'ASSIGNED' ? new Date() : undefined
       });
     }

     async markAsAssigned(requestId: string, workerId: string): Promise<void> {
       await this.updateStatus(requestId, 'ASSIGNED');
       
       const request = await this.assignmentRequestsRepository.findOne({
         where: { id: requestId },
         relations: ['booking']
       });

       if (request) {
         await this.bookingsRepository.update(request.bookingId, {
           assignmentState: 'ASSIGNED',
           assignedWorkerId: workerId,
           assignmentTimestamp: new Date()
         });
       }
     }
   }
   ```

### Step 3: Frontend Models (2 hours)

1. **Create Dart Models**
   ```dart
   // lib/models/assignment_request.dart
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
   ```

### Step 4: Testing Strategy

1. **Unit Tests**
   ```typescript
   // test/assignment-requests/assignment-requests.service.spec.ts
   describe('AssignmentRequestsService', () => {
     let service: AssignmentRequestsService;
     let repository: Repository<AssignmentRequest>;

     beforeEach(async () => {
       const module = await Test.createTestingModule({
         providers: [
           AssignmentRequestsService,
           {
             provide: getRepositoryToken(AssignmentRequest),
             useValue: mockRepository,
           },
         ],
       }).compile();

       service = module.get<AssignmentRequestsService>(AssignmentRequestsService);
       repository = module.get<Repository<AssignmentRequest>>(
         getRepositoryToken(AssignmentRequest),
       );
     });

     it('should create assignment request', async () => {
       const result = await service.createAssignmentRequest('booking-id');
       expect(result.bookingId).toBe('booking-id');
       expect(result.status).toBe('REQUESTED');
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   // test/assignment-requests/assignment-requests.e2e-spec.ts
   describe('Assignment Requests E2E', () => {
     it('should create assignment request and process assignment', async () => {
       // Test complete flow from request to assignment
     });
   });
   ```

## Success Criteria

### Functional Requirements
- [ ] Assignment requests can be created without availability constraints
- [ ] Assignment status can be polled in real-time
- [ ] Failed assignments can be retried automatically
- [ ] Users see clear status updates during assignment process
- [ ] System handles race conditions gracefully

### Performance Requirements
- [ ] Assignment processing completes within 30 seconds for 90% of requests
- [ ] Status polling has minimal impact on server performance
- [ ] Queue processing handles 100 concurrent assignments
- [ ] Database queries complete within 100ms

### User Experience Requirements
- [ ] Zero booking failures during user intent phase
- [ ] Clear messaging for all assignment states
- [ ] Smooth transitions between booking flow screens
- [ ] Intuitive retry and waitlist options

## Risk Mitigation

### Technical Risks
- **Queue overload**: Implement rate limiting and priority queues
- **Database performance**: Add proper indexing and query optimization
- **Memory leaks**: Monitor worker processes and implement health checks

### Business Risks
- **User confusion**: Clear messaging and intuitive UI design
- **Waitlist management**: Automated processing and notifications
- **Service quality**: Maintain assignment quality standards

