# SEVAQ Assignment System Implementation Plan

Based on the SEVAQ Assignment System Specification, this document outlines the implementation plan for the professional assignment logic.

## Core Principle

> **SEVAQ assigns professionals early only when the commitment is short. For long-term responsibility, assignment follows payment and happens just-in-time.**

---

## 1. Database & Entity Updates

### 1.1 Update Booking Entity

**File:** `flutter-nest-househelp-master/src/bookings/entities/booking.entity.ts`

Add the following fields to support assignment types:

```typescript
export enum AssignmentType {
  PROVISIONAL = 'provisional',  // One-time services: availability reservation
  PRIMARY = 'primary',           // Subscriptions: operational responsibility
}

// Add to Booking entity:
@Column({ type: 'text', enum: AssignmentType, nullable: true })
assignmentType: AssignmentType;

@Column({ type: 'timestamp', nullable: true })
assignmentExpiresAt: Date;  // For provisional assignments (payment timeout)

@Column({ type: 'timestamp', nullable: true })
assignmentStartsAt: Date;   // For primary assignments (subscription start)
```

### 1.2 Update AssignmentState Enum

Current: `PENDING, ASSIGNED, CONFIRMED, REASSIGNING, CANCELLED`

Update to support payment confirmation:
- `PROVISIONAL_ASSIGNED` - Worker assigned provisionally, awaiting payment
- `PROVISIONAL_EXPIRED` - Payment not received, assignment released

---

## 2. Backend Implementation

### 2.1 One-Time Service Flow (PROVISIONAL)

**Flow:**
1. User selects date & time
2. System finds available professional
3. **Provisional assignment created** (soft hold)
4. User sees worker details and pays
5. **Provisional assignment confirmed** on payment
6. Service delivered

**Implementation:**

```typescript
// In AssignmentsService
async createProvisionalAssignment(bookingId: number): Promise<Booking> {
  const booking = await this.bookingsRepository.findOne({
    where: { id: bookingId }
  });

  // Find best worker
  const worker = await this.findBestWorker(...);

  // Create provisional assignment
  booking.assignmentType = AssignmentType.PROVISIONAL;
  booking.assignmentState = AssignmentState.PROVISIONAL_ASSIGNED;
  booking.assignedWorkerId = worker.id;
  booking.assignmentExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min timeout
  booking.assignmentReason = 'Provisional assignment for one-time service';

  return this.bookingsRepository.save(booking);
}
```

### 2.2 Subscription Flow (PRIMARY)

**Flow:**
1. User selects plan + start date + time window
2. User pays
3. Subscription becomes ACTIVE
4. Assignment window opens (24-48h before start)
5. **Primary professional assigned** just-in-time
6. Daily service begins

**Implementation:**

```typescript
// In SubscriptionsSchedulerService
async assignPrimaryProfessional(subscriptionId: number) {
  const subscription = await this.subscriptionsRepository.findOne({
    where: { id: subscriptionId }
  });

  // Calculate assignment window (24-48h before start)
  const assignmentWindow = {
    start: new Date(subscription.startDate.getTime() - 48 * 60 * 60 * 1000),
    end: new Date(subscription.startDate.getTime() - 24 * 60 * 60 * 1000)
  };

  // Find best worker for the subscription
  const worker = await this.findBestWorker(
    subscription.serviceProfileId,
    subscription.location.lat,
    subscription.location.lng,
    assignmentWindow.start,
    assignmentWindow.end
  );

  // Create primary assignment
  const booking = await this.createBookingForSubscription(subscription, worker);
  booking.assignmentType = AssignmentType.PRIMARY;
  booking.assignmentState = AssignmentState.CONFIRMED;
  booking.assignmentStartsAt = subscription.startDate;

  return this.bookingsRepository.save(booking);
}
```

### 2.3 Payment Webhook Integration

**File:** `flutter-nest-househelp-master/src/payments/payments.controller.ts`

```typescript
@Post('webhook')
async handlePaymentWebhook(@Body() paymentData: any) {
  const { bookingId, status } = paymentData;

  if (status === 'success' && bookingId) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId }
    });

    if (booking?.assignmentType === AssignmentType.PROVISIONAL) {
      // Confirm provisional assignment
      booking.assignmentState = AssignmentState.CONFIRMED;
      booking.assignmentExpiresAt = null; // Remove timeout
      await this.bookingsRepository.save(booking);
    }
  }
}
```

### 2.4 Provisional Assignment Expiry Handler

```typescript
// In AssignmentsSchedulerService
@Cron(CronExpression.EVERY_MINUTE)
async handleExpiredAssignments() {
  const expiredBookings = await this.bookingsRepository.find({
    where: {
      assignmentType: AssignmentType.PROVISIONAL,
      assignmentState: AssignmentState.PROVISIONAL_ASSIGNED,
      assignmentExpiresAt: LessThanOrEqual(new Date())
    }
  });

  for (const booking of expiredBookings) {
    // Release worker and cancel booking
    await this.releaseWorker(booking.assignedWorkerId);
    booking.assignmentState = AssignmentState.PROVISIONAL_EXPIRED;
    booking.assignedWorkerId = null;
    await this.bookingsRepository.save(booking);
  }
}
```

---

## 3. Frontend Implementation

### 3.1 One-Time Service Flow

**Screen Flow:**
1. `BookingScreen` → Select service, date, time
2. `FindingProfessionalScreen` → Show while finding worker
3. `ProfessionalAssignedScreen` → **Show worker details + payment button**
4. `PaymentConfirmationScreen` → Confirm payment
5. `AssignmentConfirmedScreen` → Service confirmed

**Key Change:** Show worker in `ProfessionalAssignedScreen` BEFORE payment.

### 3.2 Subscription Flow

**Screen Flow:**
1. `SubscriptionProfilesScreen` → Select plan
2. `SubscriptionSchedulingScreen` → Select start date, time window
3. `PaymentConfirmationScreen` → Pay for subscription
4. `SubscriptionConfirmedScreen` → **DO NOT show worker, use copy:**
   - "We'll assign a verified professional before your service begins"
5. (24-48h later) `ProfessionalAssignedScreen` → Worker assigned

**Key Change:** Hide worker in `SubscriptionConfirmedScreen`.

### 3.3 Update SubscriptionSchedulingScreen

**Current Issue:** May be showing worker selection.

**Fix:**
```dart
// Remove any worker selection UI
// Update copy to:
Text(
  'We\'ll assign a verified professional before your service begins',
  style: Theme.of(context).textTheme.bodyMedium,
),
```

### 3.4 Create Subscription Confirmation Screen

If not exists, create `subscription_confirmed_screen.dart`:
- Shows subscription details
- Does NOT show worker
- Shows expected start date
- Reassurance copy about professional assignment

---

## 4. API Endpoint Updates

### 4.1 One-Time Service Endpoints

```
POST /bookings/provisional
- Creates provisional booking with provisional assignment
- Returns booking with worker details

POST /bookings/:id/confirm
- Confirms booking after payment
- Converts provisional to confirmed assignment
```

### 4.2 Subscription Endpoints

```
POST /subscriptions
- Creates subscription with ACTIVE status
- No worker assignment yet

GET /subscriptions/:id/assignment
- Returns assigned worker (only available 24h before start)
```

---

## 5. Testing Plan

### 5.1 One-Time Service Tests

- [ ] Provisional assignment created before payment
- [ ] Worker details shown to user before payment
- [ ] Payment confirmation converts provisional to confirmed
- [ ] Expired provisional assignments are released
- [ ] Worker slot released on expiry

### 5.2 Subscription Tests

- [ ] Subscription created without worker assignment
- [ ] Worker assigned 24-48h before start date
- [ ] Worker NOT visible in subscription confirmation
- [ ] Daily execution uses assigned worker
- [ ] Silent replacement works correctly

---

## 6. Migration Script

```sql
-- Add assignment type column
ALTER TABLE booking ADD COLUMN assignmentType VARCHAR(20) DEFAULT NULL;

-- Add expiresAt column
ALTER TABLE booking ADD COLUMN assignmentExpiresAt TIMESTAMP DEFAULT NULL;

-- Add startsAt column
ALTER TABLE booking ADD COLUMN assignmentStartsAt TIMESTAMP DEFAULT NULL;

-- Update AssignmentState enum (database-specific)
```

---

## 7. Implementation Priority

1. **P0 - Core Logic:**
   - Database entity updates
   - Backend assignment type logic
   - Payment webhook integration

2. **P1 - Frontend Updates:**
   - Subscription screen copy fixes
   - One-time service worker display

3. **P2 - Scheduler:**
   - Provisional expiry handler
   - Subscription just-in-time assignment

4. **P3 - Testing & Polish:**
   - Unit tests
   - Integration tests
   - Documentation

---

## 8. Key Metrics to Monitor

- Assignment success rate (alert at < 80%)
- Provisional assignment confirmation rate
- Subscription just-in-time assignment rate
- Worker utilization by assignment type
- Customer satisfaction by flow type

---

## 9. Files to Modify

### Backend:
- `flutter-nest-househelp-master/src/bookings/entities/booking.entity.ts`
- `flutter-nest-househelp-master/src/assignments/assignments.service.ts`
- `flutter-nest-househelp-master/src/subscriptions/subscriptions.service.ts`
- `flutter-nest-househelp-master/src/payments/payments.controller.ts`
- New: `flutter-nest-househelp-master/src/assignments/assignments.scheduler.ts`

### Frontend:
- `frontend-flutter-house-help-master/lib/screens/professional_assigned_screen.dart`
- `frontend-flutter-house-help-master/lib/screens/subscription_scheduling_screen.dart`
- New: `frontend-flutter-house-help-master/lib/screens/subscription_confirmed_screen.dart`

### Database:
- Migration script for new columns
