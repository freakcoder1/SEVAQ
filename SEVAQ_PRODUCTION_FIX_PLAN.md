# SEVAQ Production Fix Plan

## Overview
This document provides a prioritized, actionable plan to address all critical issues identified in the Production Audit Report. Each fix is broken down into specific, implementable tasks.

---

## Phase 1: Critical Security & Data Integrity (Week 1)

### 1.1 Fix JWT Token Handling (P0)

**File**: `frontend-flutter-house-help-master/lib/services/api_service.ts`

**Current Issue**:
```typescript
// Check token expiry (DISABLED FOR TESTING)
if (isTokenExpired(tokenData)) {
    debugPrint('ApiService: _getHeaders - Token has expired BUT NOT CLEARED');
    // DO NOT clear expired token for testing purposes
}
```

**Fix**:
```typescript
if (tokenData != null) {
    if (isTokenExpired(tokenData)) {
        debugPrint('ApiService: _getHeaders - Token has expired, clearing');
        await clearToken();
        await _storage.delete(key: 'user_id');
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('jwt_token');
        await prefs.remove('user_id');
        token = null;
        // Trigger re-authentication
        throw Exception('Session expired. Please login again.');
    }
}
```

---

### 1.2 Remove Mock Payment Fallback (P0)

**File**: `flutter-nest-househelp-master/src/payments/payments.service.ts`

**Current Issue**:
```typescript
} catch (error) {
    console.error('Error creating Razorpay order:', error);
    // Fallback to mock order for testing purposes
    return {
        id: 'mock_order_' + Date.now(),
        amount: amount * 100,
        currency,
        receipt: 'receipt_' + Date.now(),
        status: 'created'
    };
}
```

**Fix**:
```typescript
} catch (error) {
    console.error('Error creating Razorpay order:', error);
    // In production, fail the request - don't create mock orders
    if (process.env.NODE_ENV === 'production') {
        throw new Error(`Payment service unavailable: ${error.message}`);
    }
    // Only use mock in development
    return {
        id: 'mock_order_' + Date.now(),
        amount: amount * 100,
        currency,
        receipt: 'receipt_' + Date.now(),
        status: 'created'
    };
}
```

---

### 1.3 Fix Slot Booking Race Condition (P0)

**File**: `flutter-nest-househelp-master/src/slots/slots.service.ts`

**Current Issue**:
```typescript
async bookSlot(slotId: number): Promise<boolean> {
    const slot = await this.slotsRepository.findOne({ where: { id: slotId } });
    if (!slot || slot.isBooked) return false;
    await this.slotsRepository.update(slotId, { isBooked: true });
    return true;
}
```

**Fix**:
```typescript
async bookSlot(slotId: number): Promise<boolean> {
    // Use atomic update to prevent race conditions
    const result = await this.slotsRepository.update(
        { id: slotId, isBooked: false },
        { isBooked: true }
    );
    
    if (result.affected === 0) {
        this.logger.warn(`Slot ${slotId} is already booked or not found`);
        return false;
    }
    
    this.logger.log(`Successfully booked slot ${slotId}`);
    return true;
}
```

---

### 1.4 Add Rate Limiting (P0)

**File**: `flutter-nest-househelp-master/src/main.ts`

**Install**: `npm install express-rate-limit`

**Add**:
```typescript
import rateLimit from 'express-rate-limit';

async function bootstrap() {
    // ... existing code ...
    
    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    
    // Stricter limits for auth endpoints
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5, // 5 attempts per 15 minutes
        skipSuccessfulRequests: true,
    });
    
    app.use('/api/', limiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/signup', authLimiter);
    
    // ... rest of bootstrap ...
}
```

---

### 1.5 Fix Subscription Scheduler Timezone Bug (P0)

**File**: `flutter-nest-househelp-master/src/subscriptions/subscription-assignment.scheduler.ts`

**Current Issue**:
```typescript
private getStartTimeForTimeWindow(timeWindow: string): Date {
    const date = new Date(); // Uses server local time
    switch (timeWindow) {
        case 'MORNING':
            date.setHours(7, 0, 0, 0);
            break;
        // ...
    }
    return date;
}
```

**Fix**:
```typescript
private getStartTimeForTimeWindow(timeWindow: string, targetDate: Date): Date {
    const date = new Date(targetDate);
    // Use UTC and convert to IST (UTC+5:30) for Indian users
    switch (timeWindow) {
        case 'MORNING':
            date.setUTCHours(1, 30, 0, 0); // 7:00 AM IST
            break;
        case 'AFTERNOON':
            date.setUTCHours(6, 30, 0, 0); // 12:00 PM IST
            break;
        case 'EVENING':
            date.setUTCHours(10, 30, 0, 0); // 4:00 PM IST
            break;
        default:
            date.setUTCHours(2, 30, 0, 0); // 8:00 AM IST
    }
    return date;
}

// Update the calling code
private async assignWorkerForSubscription(subscription: Subscription) {
    const startDate = subscription.startDate instanceof Date
        ? subscription.startDate
        : new Date(subscription.startDate);
    
    const bookingData = {
        serviceId: subscription.serviceProfileId,
        date: firstBookingDate,
        startTime: this.getStartTimeForTimeWindow(subscription.preferredTimeWindow, firstBookingDate),
        endTime: this.getEndTimeForTimeWindow(subscription.preferredTimeWindow, firstBookingDate),
        // ...
    };
}
```

---

## Phase 2: Data Consistency & Performance (Week 2)

### 2.1 Make Payment-Booking Atomic (P1)

**File**: `flutter-nest-househelp-master/src/payments/payments.service.ts`

**Implement Saga Pattern**:
```typescript
async createBookingAfterPayment(bookingData: any, razorpayOrderId: string, razorpayPaymentId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        // Create booking
        const booking = await queryRunner.manager.save(Booking, bookingData);
        
        // Create payment record
        const payment = queryRunner.manager.create(Payment, {
            publicId: uuidv4(),
            transactionId: razorpayPaymentId,
            amount: bookingData.amount,
            paymentMethod: 'RAZORPAY',
            status: PaymentStatus.COMPLETED,
            booking: { id: booking.id },
        });
        await queryRunner.manager.save(payment);
        
        // Update booking with payment info
        await queryRunner.manager.update(Booking, booking.id, { isPaid: true });
        
        await queryRunner.commitTransaction();
        return booking;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        // Trigger compensation - refund payment
        await this.initiateRefund(razorpayPaymentId, 'Booking creation failed');
        throw error;
    } finally {
        await queryRunner.release();
    }
}
```

---

### 2.2 Fix N+1 Query Issues (P1)

**File**: `flutter-nest-househelp-master/src/bookings/bookings.service.ts`

**Current**:
```typescript
const scoredWorkers = await Promise.all(workers.map(async (worker) => {
    const availableSlot = await this.slotsService.findAvailableSlot(...);
}));
```

**Fix**:
```typescript
async findBestWorker(serviceId: string, userLat: number, userLng: number, startTime: Date, endTime: Date) {
    // Single query to get workers with their slots
    const workersWithSlots = await this.workersRepository
        .createQueryBuilder('worker')
        .innerJoinAndSelect('worker.services', 'service')
        .innerJoinAndSelect('worker.user', 'user')
        .leftJoinAndSelect('worker.slots', 'slot', 
            'slot.startTime = :startTime AND slot.endTime = :endTime AND slot.isBooked = false',
            { startTime, endTime }
        )
        .where('service.id = :serviceId', { serviceId: Number(serviceId) })
        .andWhere('user.latitude IS NOT NULL')
        .andWhere('user.longitude IS NOT NULL')
        .getMany();
    
    // Filter and score in memory
    const availableWorkers = workersWithSlots
        .filter(w => w.slots.length > 0)
        .map(worker => {
            const distance = this.calculateDistance(userLat, userLng, worker.user.latitude, worker.user.longitude);
            const score = this.calculateScore(distance, worker.rating, worker.reviewCount);
            return { worker, distance, score, slot: worker.slots[0] };
        })
        .sort((a, b) => a.score - b.score);
    
    return availableWorkers[0] || null;
}
```

---

### 2.3 Add Pagination (P1)

**File**: `flutter-nest-househelp-master/src/bookings/bookings.service.ts`

**Add**:
```typescript
async findAll(userId?: string, workerId?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (userId) where.user = { id: userId };
    if (workerId) where.worker = { id: workerId };
    
    const [bookings, total] = await this.bookingsRepository.findAndCount({
        where,
        relations: ['user', 'worker', 'service'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' }
    });
    
    return {
        data: bookings,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}
```

---

### 2.4 Add Database Indexes (P1)

**Create Migration**: `src/migrations/add-performance-indexes.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes implements MigrationInterface {
    name = 'AddPerformanceIndexes1234567890';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Booking indexes
        await queryRunner.query(`CREATE INDEX idx_booking_user_id ON booking(userId)`);
        await queryRunner.query(`CREATE INDEX idx_booking_status ON booking(status)`);
        await queryRunner.query(`CREATE INDEX idx_booking_created_at ON booking(createdAt)`);
        await queryRunner.query(`CREATE INDEX idx_booking_user_status ON booking(userId, status)`);
        
        // Slot indexes
        await queryRunner.query(`CREATE INDEX idx_slot_worker_time ON slot(workerId, startTime, endTime)`);
        await queryRunner.query(`CREATE INDEX idx_slot_available ON slot(isBooked, startTime)`);
        
        // Service request indexes
        await queryRunner.query(`CREATE INDEX idx_service_request_status ON service_requests(assignmentStatus)`);
        await queryRunner.query(`CREATE INDEX idx_service_request_user ON service_requests(userId, createdAt)`);
        
        // Payment indexes
        await queryRunner.query(`CREATE INDEX idx_payment_booking ON payment(bookingId)`);
        await queryRunner.query(`CREATE INDEX idx_payment_status ON payment(status)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_booking_user_id`);
        await queryRunner.query(`DROP INDEX idx_booking_status`);
        await queryRunner.query(`DROP INDEX idx_booking_created_at`);
        await queryRunner.query(`DROP INDEX idx_booking_user_status`);
        await queryRunner.query(`DROP INDEX idx_slot_worker_time`);
        await queryRunner.query(`DROP INDEX idx_slot_available`);
        await queryRunner.query(`DROP INDEX idx_service_request_status`);
        await queryRunner.query(`DROP INDEX idx_service_request_user`);
        await queryRunner.query(`DROP INDEX idx_payment_booking`);
        await queryRunner.query(`DROP INDEX idx_payment_status`);
    }
}
```

---

## Phase 3: Code Quality & Observability (Week 3)

### 3.1 Replace Console Logs with Structured Logging (P2)

**Install**: `npm install nest-winston winston`

**Create**: `src/logger/logger.config.ts`

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json()
            ),
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.json(),
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.json(),
        }),
    ],
});
```

**Update**: `src/main.ts`
```typescript
const app = await NestFactory.create(AppModule, {
    logger: loggerConfig,
});
```

---

### 3.2 Add Soft Delete to Entities (P2)

**Update**: `src/bookings/entities/booking.entity.ts`
```typescript
@Entity('booking')
@DeleteDateColumn()
deletedAt: Date;
```

**Update Service Methods**:
```typescript
async findAll(userId?: string) {
    return this.bookingsRepository.find({
        where: { user: { id: userId }, deletedAt: IsNull() },
        relations: ['user', 'worker', 'service'],
    });
}

async remove(id: number) {
    // Soft delete instead of hard delete
    return this.bookingsRepository.softDelete(id);
}
```

---

### 3.3 Add Comprehensive Health Checks (P2)

**Update**: `src/health/health.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
        private memory: MemoryHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
        ]);
    }
}
```

---

## Phase 4: Frontend Improvements (Week 4)

### 4.1 Fix Auth State Race Condition (P2)

**File**: `frontend-flutter-house-help-master/lib/providers/auth_provider.dart`

**Add**:
```dart
class AuthProvider with ChangeNotifier {
    bool _isRefreshing = false;
    
    bool get isAuthenticated {
        if (_isRefreshing) return false; // Don't allow navigation during refresh
        if (_cachedToken != null && _cachedUser != null) return true;
        if (_currentUser != null) return true;
        return false;
    }
    
    Future<void> _refreshUserFromApi() async {
        if (_isRefreshing) return;
        _isRefreshing = true;
        notifyListeners();
        
        try {
            // ... refresh logic ...
        } finally {
            _isRefreshing = false;
            notifyListeners();
        }
    }
}
```

---

### 4.2 Add Form Validation (P2)

**Create**: `frontend-flutter-house-help-master/lib/utils/validators.dart`

```dart
class Validators {
    static String? validatePhone(String? value) {
        if (value == null || value.isEmpty) {
            return 'Phone number is required';
        }
        final phoneRegex = RegExp(r'^[6-9]\d{9}$');
        if (!phoneRegex.hasMatch(value)) {
            return 'Enter a valid 10-digit Indian phone number';
        }
        return null;
    }
    
    static String? validateDate(DateTime? value) {
        if (value == null) {
            return 'Date is required';
        }
        if (value.isBefore(DateTime.now().subtract(Duration(days: 1)))) {
            return 'Date cannot be in the past';
        }
        return null;
    }
    
    static String? validateTimeWindow(String? value) {
        if (value == null || value.isEmpty) {
            return 'Please select a time window';
        }
        return null;
    }
}
```

---

### 4.3 Add Better Error Handling (P2)

**Update**: `frontend-flutter-house-help-master/lib/services/api_service.dart`

```dart
Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    try {
        final url = '$baseUrl/$endpoint';
        final response = await http
            .post(
                Uri.parse(url),
                headers: await _getHeaders(),
                body: jsonEncode(data),
            )
            .timeout(AppConfig.requestTimeout);
        return _processResponse(response);
    } on SocketException catch (e) {
        throw ApiException(
            message: 'No internet connection. Please check your network.',
            code: 'NETWORK_ERROR',
            originalError: e,
        );
    } on TimeoutException catch (e) {
        throw ApiException(
            message: 'Request timed out. Please try again.',
            code: 'TIMEOUT_ERROR',
            originalError: e,
        );
    } on FormatException catch (e) {
        throw ApiException(
            message: 'Invalid response from server. Please try again later.',
            code: 'FORMAT_ERROR',
            originalError: e,
        );
    } catch (e) {
        throw ApiException(
            message: 'An unexpected error occurred. Please try again.',
            code: 'UNKNOWN_ERROR',
            originalError: e,
        );
    }
}
```

---

## Phase 5: Testing & Documentation (Week 5)

### 5.1 Add Integration Tests

**Create**: `flutter-nest-househelp-master/test/booking-payment.e2e-spec.ts`

```typescript
describe('Booking-Payment Flow (e2e)', () => {
    it('should create booking after successful payment', async () => {
        // Create service request
        const serviceRequest = await createServiceRequest();
        
        // Create payment order
        const order = await createPaymentOrder(serviceRequest.id);
        
        // Verify payment
        const payment = await verifyPayment(order.id);
        
        // Assert booking created
        expect(payment.booking).toBeDefined();
        expect(payment.booking.status).toBe('CONFIRMED');
    });
    
    it('should not create duplicate bookings for same payment', async () => {
        // Test idempotency
    });
    
    it('should handle payment failure gracefully', async () => {
        // Test error handling
    });
});
```

### 5.2 Add Load Tests

**Create**: `flutter-nest-househelp-master/test/load/slot-booking.load.ts`

```typescript
import { check } from 'k6';
import http from 'k6/http';

export const options = {
    stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
    ],
};

export default function () {
    const response = http.post(`${__ENV.API_URL}/slots/book`, {
        slotId: 1,
    });
    
    check(response, {
        'status is 200': (r) => r.status === 200,
        'no race condition': (r) => {
            const body = JSON.parse(r.body);
            return body.success === true || body.error !== 'ALREADY_BOOKED';
        },
    });
}
```

---

## Implementation Checklist

### Week 1: Critical Fixes
- [ ] Fix JWT token expiry handling
- [ ] Remove mock payment fallback
- [ ] Fix slot booking race condition
- [ ] Add rate limiting
- [ ] Fix subscription scheduler timezone
- [ ] Deploy to staging
- [ ] Run security scan

### Week 2: Data & Performance
- [ ] Implement payment-booking atomicity
- [ ] Fix N+1 queries
- [ ] Add pagination to all list endpoints
- [ ] Run database migration for indexes
- [ ] Performance testing
- [ ] Load testing

### Week 3: Observability
- [ ] Replace all console.log with structured logging
- [ ] Add soft delete to critical entities
- [ ] Implement comprehensive health checks
- [ ] Set up log aggregation (ELK/Loki)
- [ ] Configure alerting rules

### Week 4: Frontend
- [ ] Fix auth state race condition
- [ ] Add form validation
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Implement retry logic
- [ ] Add offline support basics

### Week 5: Testing
- [ ] Write integration tests for payment flow
- [ ] Write load tests for slot booking
- [ ] Write E2E tests for assignment flow
- [ ] Document API contracts
- [ ] Create runbooks for common issues

### Week 6: Deployment
- [ ] Production deployment plan
- [ ] Database backup verification
- [ ] Rollback procedure testing
- [ ] Monitoring dashboard setup
- [ ] Team training on new procedures

---

## Success Metrics

After implementing these fixes:

1. **Security**: Zero critical vulnerabilities in security scan
2. **Performance**: API response time < 200ms (p95)
3. **Reliability**: 99.9% uptime, zero data loss
4. **Data Consistency**: No double bookings, payment-booking 100% consistent
5. **User Experience**: < 3 second app load time, clear error messages

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Database migration failure | Test on staging, have rollback script ready |
| Performance regression | Load test before each deployment |
| New bugs introduced | Comprehensive test coverage, staged rollout |
| Data loss | Automated backups, point-in-time recovery |
| Security breach | Security audit, penetration testing |

---

**Plan Version**: 1.0
**Last Updated**: 2026-02-01
**Next Review**: After Phase 1 completion
