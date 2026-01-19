# Backend Assignment Endpoint Specification

## Overview
This document specifies the backend API endpoint required for the new "Confirm & proceed" flow. The missing endpoint is causing the 404 error when users try to navigate from Service Clarification to Schedule & Pricing.

## Required Endpoint

### POST /api/bookings/assign

**Purpose**: Creates an assignment without immediate payment, enabling the new assignment-before-payment workflow.

**Request Body**:
```json
{
  "user": "user_id",
  "worker": "worker_id", 
  "service": "service_id",
  "startTime": "2024-01-15T08:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "amount": 50000, // in paise
  "currency": "INR",
  "status": "pending_assignment"
}
```

**Response**:
```json
{
  "id": "assignment_id",
  "status": "pending_assignment",
  "assignmentId": "assignment_id",
  "estimatedWaitTime": 30, // seconds
  "worker": {
    "id": "worker_id",
    "user": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "bio": "Experienced professional",
    "rating": 4.8,
    "reviewCount": 150
  },
  "service": {
    "id": "service_id",
    "name": "Maid Service",
    "description": "Daily household assistance"
  },
  "startTime": "2024-01-15T08:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "amount": 50000,
  "currency": "INR"
}
```

## Implementation Requirements

### 1. Controller Method
```typescript
// In bookings.controller.ts
@Post('assign')
async createAssignment(@Body() assignmentData: CreateAssignmentDto) {
  return this.bookingsService.createAssignment(assignmentData);
}
```

### 2. Service Method
```typescript
// In bookings.service.ts
async createAssignment(assignmentData: CreateAssignmentDto): Promise<AssignmentResponse> {
  // 1. Validate user exists and is authenticated
  // 2. Validate worker exists and is available
  // 3. Validate service exists
  // 4. Check time slot availability
  // 5. Create assignment record with pending_assignment status
  // 6. Lock time slot for this assignment
  // 7. Return assignment details
}
```

### 3. DTO Definition
```typescript
// create-assignment.dto.ts
export class CreateAssignmentDto {
  @IsString()
  user: string;

  @IsString()
  worker: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsISO8601()
  startTime: string;

  @IsISO8601()
  endTime: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  status: 'pending_assignment';
}
```

### 4. Assignment Entity
```typescript
// assignment.entity.ts
@Entity()
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  workerId: string;

  @Column({ nullable: true })
  serviceId?: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column({ default: 'pending_assignment' })
  status: string;

  @Column({ nullable: true })
  assignmentId?: string;

  @Column({ nullable: true })
  estimatedWaitTime?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Business Logic Requirements

### 1. Worker Availability Check
- Verify worker is active and available
- Check if worker has conflicts in the requested time slot
- Ensure worker is within service radius of user location

### 2. Time Slot Validation
- Validate start time is in future
- Ensure end time is after start time
- Check for minimum service duration
- Verify time slot is within worker's availability schedule

### 3. Assignment Creation
- Create assignment record with pending status
- Lock the time slot to prevent double booking
- Generate assignment ID
- Calculate estimated wait time for professional assignment

### 4. Error Handling
- Return appropriate error messages for validation failures
- Handle database constraint violations
- Provide clear error messages for business rule violations

## Integration Points

### 1. With Existing Booking System
- Assignment should be convertible to booking upon payment
- Maintain compatibility with existing booking workflows
- Ensure assignment data can be used to create final booking

### 2. With Payment System
- Assignment amount should be used for payment calculation
- Payment verification should link to assignment ID
- Successful payment should convert assignment to confirmed booking

### 3. With Worker Management
- Update worker availability status during assignment
- Handle assignment cancellations and time slot releases
- Track assignment success/failure rates for worker performance

## Testing Requirements

### 1. Unit Tests
- Test assignment creation with valid data
- Test validation with invalid data
- Test worker availability checking
- Test time slot validation

### 2. Integration Tests
- Test complete assignment workflow
- Test assignment to booking conversion
- Test error scenarios and edge cases

### 3. API Tests
- Test endpoint with various request payloads
- Test error responses and status codes
- Test concurrent assignment requests

## Security Considerations

### 1. Authentication
- Ensure user is authenticated before creating assignment
- Validate user has permission to book services

### 2. Authorization
- Verify worker belongs to user's service area
- Check service availability for user's location

### 3. Data Validation
- Validate all input parameters
- Prevent SQL injection and other attacks
- Ensure data integrity and consistency

## Performance Considerations

### 1. Database Optimization
- Index assignment table appropriately
- Optimize worker availability queries
- Use efficient time slot checking algorithms

### 2. Caching
- Cache worker availability data
- Cache service area information
- Implement appropriate cache invalidation

### 3. Concurrency
- Handle concurrent assignment requests
- Implement proper locking mechanisms
- Prevent race conditions in time slot allocation

## Deployment Checklist

- [ ] Create assignment entity and migration
- [ ] Implement DTO validation
- [ ] Add controller endpoint
- [ ] Implement service logic
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Update API documentation
- [ ] Test with frontend integration
- [ ] Deploy to staging environment
- [ ] Perform load testing
- [ ] Deploy to production

## Timeline

**Priority**: HIGH - Blocking frontend navigation
**Estimated Implementation Time**: 2-3 hours
**Dependencies**: None (can be implemented independently)

This endpoint is critical for completing the new "Confirm & proceed" flow and enabling the assignment-before-payment workflow that builds user trust and improves conversion rates.