# Subscription Professional Assignment - Fix Plan

## Current State

The server is running with **cached TypeORM metadata**. The scheduler keeps failing with:
```
query failed: INSERT INTO "booking"("id", "publicId", "serviceRequestId", "userId", "workerId", "serviceId", "slotId", "startTime", "endTime", "date", "totalAmount", "isPaid", "status", "type", "notes", "responsibilityTransferred", "systemMonitoring", "protectionStatus", "assignmentState", "assignmentType", "assignmentExpiresAt", "assignmentStartsAt", "assignedWorkerId", ...) VALUES (...)
```

This shows the **old entity schema** is being used, not the updated minimal schema.

## The Fix

### Step 1: Stop the Current Server

Press `Ctrl+C` in the terminal running `npm run start:dev`

### Step 2: Clear TypeORM Cache and Restart

```bash
cd flutter-nest-househelp-master
# Clear any cached metadata
npm run start
```

Or if using docker-compose:
```bash
docker-compose restart backend
```

### Step 3: Verify the Fix

After restart, check the scheduler logs. You should see:
- INSERT only includes columns that exist: `id, userId, workerId, serviceId, slotId, startTime, endTime, amount, status, type, notes, createdAt, updatedAt`
- NO: `publicId, serviceRequestId, date, totalAmount, isPaid, assignmentType, assignmentExpiresAt, assignmentStartsAt, assignmentState`

## Files Already Updated

1. **`src/bookings/entities/booking.entity.ts`** - Minimal schema matching database
2. **`src/bookings/bookings.service.ts`** - Uses `amount` instead of `totalAmount`
3. **`src/assignments/assignments.service.ts`** - Fixed type mismatches
4. **`src/metrics/metrics.service.ts`** - Uses `amount` instead of `totalAmount`
5. **`src/subscriptions/subscription-assignment.scheduler.ts`** - Removed `date` field

## Expected Result After Restart

```
SubscriptionAssignmentScheduler: Found 1 subscriptions needing immediate assignment
SubscriptionAssignmentScheduler: Assigning primary worker for subscription 6
Booking creation successful
Worker assignment complete
```

## If It Still Fails

If assignment still fails after restart, the error will be a **real schema issue** (not cached metadata), and we can debug from there.
