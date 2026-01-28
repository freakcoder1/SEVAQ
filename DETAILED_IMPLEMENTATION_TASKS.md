# SEVAQ Architecture Improvement - Detailed Implementation Tasks

## Phase 1: Backend Database & Entity Changes

### 1.1 Database Migration Scripts
- [ ] Create migration to add `publicId` column (UUID) to all entities
- [ ] Create migration to update ServiceRequest with additional fields
- [ ] Create migration to add foreign key from Booking to ServiceRequest
- [ ] Create migration to update Payment entity to link to Booking

### 1.2 Entity Definition Updates
- [ ] Update `src/users/entities/user.entity.ts` to include publicId
- [ ] Update `src/workers/entities/worker.entity.ts` to include publicId
- [ ] Update `src/services/entities/service.entity.ts` to include publicId
- [ ] Update `src/bookings/entities/booking.entity.ts` to include publicId and serviceRequestId
- [ ] Update `src/payments/entities/payment.entity.ts` to include publicId and use integer bookingId
- [ ] Refactor `src/service-requests/entities/service-request.entity.ts` as primary assignment anchor

### 1.3 Service Layer Changes
- [ ] Create `src/service-requests/service-requests.service.ts` with full lifecycle management
- [ ] Refactor `src/assignments/assignments.service.ts` to work with ServiceRequest
- [ ] Update `src/bookings/bookings.service.ts` to require serviceRequestId
- [ ] Modify `src/payments/payments.service.ts` to accept booking publicId

## Phase 2: Backend API Changes

### 2.1 API Endpoint Updates
- [ ] Update `GET /bookings` to return publicId instead of id
- [ ] Update `POST /bookings` to require serviceRequestId
- [ ] Update `GET /assignments/:id` to use publicId
- [ ] Update `POST /payments/verify` to use publicId

### 2.2 New API Endpoints
- [ ] Create `POST /service-requests` - Create new service request
- [ ] Create `GET /service-requests/:id` - Get service request status
- [ ] Create `POST /service-requests/:id/assign` - Trigger assignment
- [ ] Create `GET /service-requests/:id/assignment-status` - Check assignment status

## Phase 3: Frontend Data Models & API Service

### 3.1 Data Model Updates
- [ ] Update `lib/models/user.dart` to include publicId
- [ ] Update `lib/models/worker.dart` to include publicId
- [ ] Update `lib/models/service.dart` to include publicId
- [ ] Update `lib/models/booking.dart` to include publicId and serviceRequestId
- [ ] Create `lib/models/service_request.dart` - New service request model

### 3.2 API Service Changes
- [ ] Update `lib/services/api_service.dart` with public/integer ID conversion
- [ ] Add `ServiceRequestApi` extension with new endpoints
- [ ] Modify existing API methods to use publicId
- [ ] Update error handling for new API responses

## Phase 4: Frontend State Management & UI

### 4.1 State Management
- [ ] Create `lib/providers/service_request_provider.dart`
- [ ] Update `lib/providers/booking_provider.dart` to require serviceRequest
- [ ] Update `lib/providers/assignment_provider.dart` to work with ServiceRequest
- [ ] Modify `lib/providers/payment_provider.dart` to occur after assignment

### 4.2 UI Flow Changes
- [ ] Restructure `lib/screens/service_clarification_screen.dart` to create ServiceRequest instead of Booking
- [ ] Update `lib/screens/assigning_professional_screen.dart` to use ServiceRequest
- [ ] Modify `lib/screens/booking_confirmation_screen.dart` to occur after assignment
- [ ] Update `lib/screens/payment_confirmation_screen.dart` to link to Booking

## Phase 5: Testing & Validation

### 5.1 Backend Tests
- [ ] Create unit tests for ServiceRequest service
- [ ] Create integration tests for the new flow
- [ ] Test public/integer ID conversion
- [ ] Test error handling scenarios

### 5.2 Frontend Tests
- [ ] Create widget tests for new ServiceRequest screens
- [ ] Create integration tests for the entire flow
- [ ] Test payment integration after assignment

### 5.3 User Acceptance Testing
- [ ] Test the new user flow: ServiceRequest → Assignment → Booking → Payment
- [ ] Validate worker assignment logic
- [ ] Verify payment processing
- [ ] Test edge cases and error handling
