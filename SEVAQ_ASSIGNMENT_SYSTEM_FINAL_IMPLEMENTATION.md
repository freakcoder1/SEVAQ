# SEVAQ Assignment System - Final Implementation Summary

## Overview

This document summarizes the complete implementation of the SEVAQ Assignment System, which defines how professionals are assigned to one-time services vs. subscriptions based on the core business rule:

> **SEVAQ assigns professionals early only when the commitment is short. For long-term responsibility, assignment follows payment and happens just-in-time.**

## Core Rules (Non-Negotiable)

### 1. One-Time Services (On-Demand)

**Assignment Timing:** BEFORE payment (provisional)

**Assignment Type:** `PROVISIONAL`

**Flow:**
1. User selects date & time
2. System finds available professional
3. **Provisional assignment** (soft hold) - 15-minute timeout
4. User pays
5. Provisional assignment confirmed
6. Service delivered

**Backend State:**
```
Assignment.type = PROVISIONAL
Assignment.expiresAt = now() + 15 minutes
Booking.assignmentType = PROVISIONAL
```

**UI Truth:**
- ✅ Show professional before payment
- Language must imply availability, not continuity

### 2. Subscriptions (Monthly/Recurring)

**Assignment Timing:** AFTER payment, just-in-time (24-48h before start date)

**Assignment Type:** `PRIMARY`

**Flow:**
1. User selects plan + start date + time window
2. User pays
3. Subscription becomes `ACTIVE`
4. Assignment window opens (24-48h before start date)
5. Primary professional assigned by scheduler
6. Daily service begins

**Backend State:**
```
Assignment.type = PRIMARY
Assignment.startsAt = subscription.startDate - 24 to 48 hours
Booking.assignmentType = PRIMARY
```

**UI Truth:**
- ❌ Do NOT show worker before payment
- Copy must say: "We'll assign a verified professional before your service begins."

### 3. Daily Execution (Subscriptions)

- Same professional is preferred, not guaranteed
- System silently replaces if needed
- User notified only if replacement happens
- Continuity is a system responsibility, not a promise to a person

### 4. Absolute Do-Nots (Locked)

- ❌ Never let users choose professionals
- ❌ Never assign subscription professionals before payment
- ❌ Never guarantee a specific person long-term
- ❌ Never block workers on unpaid intent
- ❌ Never reuse one-time copy for subscriptions

## Implementation Details

### Backend Components

#### 1. Booking Entity (`flutter-nest-househelp-master/src/bookings/entities/booking.entity.ts`)

**New Fields:**
```typescript
@PrimaryGeneratedColumn()
id: number;

@Column({ nullable: true })
assignmentType: AssignmentType; // PROVISIONAL | PRIMARY

@Column({ nullable: true })
assignmentState: AssignmentState; // PENDING | ASSIGNED | CONFIRMED | EXPIRED

@Column({ type: 'timestamp', nullable: true })
assignmentExpiresAt: Date; // For provisional assignment timeout

@Column({ type: 'timestamp', nullable: true })
assignmentStartsAt: Date; // For primary assignment scheduling
```

**Enums:**
```typescript
export enum AssignmentType {
  PROVISIONAL = 'PROVISIONAL', // One-time: assigned before payment
  PRIMARY = 'PRIMARY', // Subscription: assigned just-in-time
}

export enum AssignmentState {
  PENDING = 'PENDING', // Assignment requested but not yet processed
  ASSIGNED = 'ASSIGNED', // Worker assigned but not yet confirmed
  CONFIRMED = 'CONFIRMED', // Assignment confirmed (payment received)
  EXPIRED = 'EXPIRED', // Provisional assignment expired (no payment)
}
```

#### 2. Subscription Assignment Scheduler (`flutter-nest-househelp-master/src/subscriptions/subscription-assignment.scheduler.ts`)

**Features:**
- Hourly cron job (`@Cron(CronExpression.EVERY_HOUR)`)
- Finds subscriptions starting in 24-48 hours
- Creates bookings and assigns workers as PRIMARY
- Runs via NestJS ScheduleModule

**Key Logic:**
```typescript
async handleSubscriptionAssignments() {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const subscriptionsToAssign = await this.subscriptionRepository.find({
    where: {
      status: SubscriptionStatus.ACTIVE,
      startDate: Between(twentyFourHoursFromNow, fortyEightHoursFromNow),
    },
  });
}
```

#### 3. Subscriptions Module (`flutter-nest-househelp-master/src/subscriptions/subscriptions.module.ts`)

**Updated Imports:**
```typescript
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsModule } from '../bookings/bookings.module';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    ScheduleModule.forRoot(),
    BookingsModule,
    AssignmentsModule,
  ],
  // ...
})
export class SubscriptionsModule {}
```

### Frontend Components

#### 1. Subscription Scheduling Screen (`frontend-flutter-house-help-master/lib/screens/subscription_scheduling_screen.dart`)

**Key Features:**
- Collects: start date, time window
- No worker selection shown
- Shows SEVAQ-compliant messaging:
  - "We'll assign a verified professional 24-48 hours before your service begins"
  - "Same professional preferred daily (not guaranteed)"

**Updated Payment Navigation:**
```dart
// Navigate to SubscriptionConfirmationScreen with SEVAQ messaging
Navigator.pushAndRemoveUntil(
  context,
  MaterialPageRoute(
    builder: (context) => SubscriptionConfirmationScreen(
      serviceProfile: widget.serviceProfile,
      startDate: _selectedStartDate ?? DateTime.now(),
      timeWindow: _selectedTimeWindow?.name ?? 'MORNING',
      userId: userId,
    ),
  ),
  (route) => route.isFirst,
);
```

#### 2. Subscription Confirmation Screen (`frontend-flutter-house-help-master/lib/screens/subscription_confirmation_screen.dart`)

**Purpose:** Shows after successful subscription payment

**SEVAQ Messaging:**
- ✅ "We'll assign a verified professional 24-48 hours before your service begins"
- ✅ "Same professional preferred daily (not guaranteed)"
- ✅ "SEVAQ handles all monitoring & replacement"

#### 3. WorkerCard Component (`frontend-flutter-house-help-master/lib/widgets/worker_card.dart`)

**Selection Control:**
```dart
final bool isSelectable; // New parameter to control selection behavior
final bool isPostAssignment; // New parameter to indicate post-assignment state

// When isSelectable = false:
// - onTap is disabled
// - Visual indication of non-selectability
// - Shows "Informational only" or "Your assigned professional"
```

### Database Migration

**File:** `flutter-nest-househelp-master/migrations/add-sevaq-assignment-columns.sql`

```sql
-- Add SEVAQ assignment columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assignmentType VARCHAR(20) DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assignmentState VARCHAR(20) DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assignmentExpiresAt TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assignmentStartsAt TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.assignmentType IS 'PROVISIONAL (one-time, before payment) or PRIMARY (subscription, just-in-time)';
COMMENT ON COLUMN bookings.assignmentState IS 'PENDING, ASSIGNED, CONFIRMED, or EXPIRED';
COMMENT ON COLUMN bookings.assignmentExpiresAt IS 'Timeout for provisional assignment (15 minutes after assignment)';
COMMENT ON COLUMN bookings.assignmentStartsAt IS 'When primary assignment should begin (24-48h before subscription start)';
```

## Testing Checklist

### One-Time Service Flow (Provisional → Confirmed)

- [ ] User selects date & time
- [ ] System finds available professional
- [ ] Provisional assignment created (expires in 15 min)
- [ ] Worker shown before payment
- [ ] User pays
- [ ] Provisional assignment confirmed
- [ ] Service delivered

### Subscription Flow (Payment → Just-in-Time Assignment)

- [ ] User selects plan + start date + time window
- [ ] No worker shown before payment
- [ ] User pays
- [ ] Subscription becomes ACTIVE
- [ ] SubscriptionConfirmationScreen shown with SEVAQ messaging
- [ ] 24-48h before start date: scheduler assigns worker
- [ ] Daily service begins with assigned worker

## Files Modified/Created

### Backend
- `src/bookings/entities/booking.entity.ts` - Added assignment fields and enums
- `src/subscriptions/subscription-assignment.scheduler.ts` - NEW
- `src/subscriptions/subscriptions.module.ts` - Updated imports
- `migrations/add-sevaq-assignment-columns.sql` - NEW

### Frontend
- `lib/screens/subscription_scheduling_screen.dart` - Updated navigation
- `lib/screens/subscription_confirmation_screen.dart` - NEW
- `lib/widgets/worker_card.dart` - Added isSelectable parameter

## Next Steps

1. **Update API documentation** for assignment endpoints
2. **Add unit tests** for assignment type logic
3. **Integration testing** of both flows
4. **Monitor scheduler** for subscription assignments
5. **Track assignment success rate** metrics

---

**Status:** ✅ Implementation Complete
**Last Updated:** 2026-01-30
**Version:** 1.0
