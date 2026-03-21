# Subscription userId Migration Plan

## Problem Statement

The subscription features are broken due to a **type mismatch** between the `subscriptions.userId` column and the `user.id` primary key.

### Root Cause
- **`subscriptions.userId`** column is stored as `integer` in the database
- **`user.id`** primary key is stored as `uuid` in the database
- The TypeScript entity [`subscription.entity.ts`](flutter-nest-househelp-master/src/subscriptions/entities/subscription.entity.ts) has been updated to use `@Column('uuid')` for `userId`, but the database schema hasn't been migrated

### Error Messages
```
operator does not exist: integer = uuid
invalid input syntax for type uuid: "18"
```

## Affected Flows

### 1. Get User Subscriptions (`GET /api/subscriptions/user/:publicId`)
- **File**: [`subscriptions.service.ts`](flutter-nest-househelp-master/src/subscriptions/subscriptions.service.ts:105-115)
- **Method**: `getSubscriptionsByPublicId()`
- **Query**: Joins `subscription.userId` (integer) with `user.id` (uuid)
- **Status**: ❌ BROKEN

### 2. Payment Subscription Creation (`POST /api/payments/confirm-subscription`)
- **File**: [`payments.service.ts`](flutter-nest-househelp-master/src/payments/payments.service.ts:203-216)
- **Method**: `createSubscriptionAfterPayment()`
- **Issue**: Inserts integer `userId` where UUID is expected
- **Status**: ❌ BROKEN

### 3. Subscription Assignment Scheduler
- **File**: [`subscription-assignment.scheduler.ts`](flutter-nest-househelp-master/src/subscriptions/subscription-assignment.scheduler.ts:63-69)
- **Method**: `handleSubscriptionAssignments()`
- **Query**: Loads subscriptions with user relations (JOIN on mismatched types)
- **Status**: ❌ BROKEN

## Solution: Database Migration

### Step 1: Create Migration Script

```sql
-- Migration: Change subscriptions.userId from integer to uuid

-- 1. Add temporary column for UUID values
ALTER TABLE "subscriptions" ADD COLUMN "userId_uuid" uuid;

-- 2. Update the temporary column with actual user UUIDs
UPDATE "subscriptions" s
SET "userId_uuid" = u.id
FROM "user" u
WHERE s."userId" = u.id::integer;

-- 3. Drop the foreign key constraint (if exists)
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK subscriptions.userId";

-- 4. Drop the old integer column
ALTER TABLE "subscriptions" DROP COLUMN "userId";

-- 5. Rename the temporary column
ALTER TABLE "subscriptions" RENAME COLUMN "userId_uuid" TO "userId";

-- 6. Add foreign key constraint
ALTER TABLE "subscriptions" 
ADD CONSTRAINT "FK subscriptions.userId" 
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
```

### Step 2: Execute Migration
Run the migration against the PostgreSQL database.

### Step 3: Verify Migration
- Check column type: `SELECT data_type FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'userId';`
- Verify data: `SELECT s.id, s."userId", u.id, u."publicId" FROM "subscriptions" s JOIN "user" u ON s."userId" = u.id LIMIT 5;`

### Step 4: Restart Backend
Restart the NestJS application to pick up the schema changes.

### Step 5: Test All Flows
1. Get user subscriptions endpoint
2. Create subscription via payment
3. Subscription assignment scheduler

## Impact Analysis

### ✅ What Will Be Fixed
- All subscription queries that JOIN with user table
- Payment flow for creating subscriptions
- Scheduler for assigning workers to subscriptions
- Any other related queries affected by the type mismatch

### ⚠️ Potential Risks
1. **Downtime**: Brief downtime during migration execution
2. **Data Consistency**: Must ensure all userId values are properly migrated
3. **Rollback Plan**: Keep backup of subscription data before migration

### 🔄 No Negative Impact On Other Flows
- User authentication (uses `publicId`, not `id`)
- Service profiles (independent entity)
- Worker management (independent entity)
- Bookings (may have similar issue - check separately)
- Reviews (independent entity)

## Files to Modify

### Database Migration
- Create new migration file in [`flutter-nest-househelp-master/src/database/migrations/`](flutter-nest-househelp-master/src/database/migrations/)

### No Code Changes Required
The TypeScript entities and services are already correctly typed:
- [`subscription.entity.ts`](flutter-nest-househelp-master/src/subscriptions/entities/subscription.entity.ts:39-40) already uses `@Column('uuid')`
- [`subscriptions.service.ts`](flutter-nest-househelp-master/src/subscriptions/subscriptions.service.ts) already has UUID handling logic
