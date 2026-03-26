# Database Fix Plan - Prioritized with Safety Measures

## Overview
This document outlines a prioritized fix plan for the PostgreSQL deployment issues identified in the logs. The plan is designed to fix issues sequentially without breaking existing functionality.

---

## Error Summary (from logs)

| Priority | Error | Root Cause |
|----------|-------|------------|
| P0 | `relation does not exist` for service_profiles, subscriptions, booking, worker | Tables empty - seed data never loaded |
| P1 | `null value in column "publicId"` violates NOT NULL | Entities have UUID columns without auto-generation |
| P2 | `invalid input syntax for type integer` for waitlist userId | Frontend sends UUID, column expects int |
| P3 | `FK constraint violation` service_requests → service | service table empty (cascade from P0) |
| P4 | `duplicate key` phone number already exists | User insertion without checking duplicates |
| P5 | `pg_stat_statements` not exist | Railway monitoring - non-critical |

---

## Dependency Graph

```
P0 (Empty Tables - Seed)
    ↓
P3 (FK Violations - Cascade)
    ↓
P1 (NOT NULL - publicId)
    ↓
P2 (Type Mismatch - waitlist)
    ↓
P4 (Duplicate Key)
```

---

## Phase 1: Run Database Seeding (P0 - CRITICAL)

### What It Does
Loads initial data into empty tables via the existing seed scripts.

### Files to Execute
- `flutter-nest-househelp-master/src/database/seed.ts`

### Execution Command
```bash
cd flutter-nest-househelp-master
npm run build
npm run seed
# OR if no seed script:
npx ts-node src/database/seed.ts
```

### What Gets Created (in order)
1. **Service Areas** - Greater Noida locations
2. **Micro Zones** - Alpha 1, Alpha 2, Beta, Commercial Belt
3. **Services** - 12 sample services (Home Cleaning, Deep Cleaning, Cooking, etc.)
4. **Workers** - 15 workers with profiles
5. **Customers** - Test customers

### Safety Measures
- ✅ Seed scripts check `if (existingWorkers > 0) { return; }` - idempotent
- ✅ Uses `findOne` before create - won't duplicate
- ✅ Service creation has fallback: "No services found, creating sample services..."

### Rollback
```sql
-- Run only if needed to reset:
DELETE FROM worker_services;
DELETE FROM worker;
DELETE FROM user;
DELETE FROM service;
DELETE FROM micro_zone;
DELETE FROM service_area;
DELETE FROM service_profiles;
DELETE FROM subscriptions;
DELETE FROM booking;
DELETE FROM assignment_metrics;
DELETE FROM service_requests;
```

### Impact Assessment
- **Safe**: No existing data loss if tables are empty
- **Existing data**: If workers/services exist, seed will skip (safe)
- **Time**: ~30 seconds execution

---

## Phase 2: Fix NOT NULL publicId (P1)

### Root Cause
Entities define `publicId` as UUID without DEFAULT value:
```typescript
// Current (broken)
@Column('uuid', { unique: true, nullable: false })
publicId: string;

// Seed provides: publicId: require('crypto').randomUUID()
```

### Fix Options

#### Option A: Let Seeds Handle It (RECOMMENDED)
The seed scripts already generate UUIDs using `require('crypto').randomUUID()`. After running Phase 1, this should work.

#### Option B: Add Entity Hook (Backup)
Add `@BeforeInsert()` hook to entities that need UUID generation:

```typescript
// In each entity file (e.g., service-profile.entity.ts)
import { v4 as uuidv4 } from 'uuid';

@BeforeInsert()
generatePublicId() {
  if (!this.publicId) {
    this.publicId = uuidv4();
  }
}
```

### Safety Measures
- Only affects NEW inserts
- Existing rows with publicId remain untouched
- Seed scripts already generate UUIDs - this is backup

### Entities That Need This Fix
- Service (src/services/entities/service.entity.ts)
- Worker (src/workers/entities/worker.entity.ts)
- User (src/users/entities/user.entity.ts)
- ServiceProfile (src/service-profiles/entities/service-profile.entity.ts)
- Subscription (src/subscriptions/entities/subscription.entity.ts)
- ServiceRequest (src/service-requests/entities/service-request.entity.ts)
- Slot (src/slots/entities/slot.entity.ts)
- Payment (src/payments/entities/payment.entity.ts)
- Booking (need to check)

### Rollback
- Remove @BeforeInsert hook if added
- Data remains intact

---

## Phase 3: Fix waitlist Type Mismatch (P2)

### Root Cause
Waitlist entity expects `userId: number` (int) but frontend sends UUID string.

### Current Definition (waitlist.entity.ts)
```typescript
@Column({ type: 'int' })
userId: number;  // Expects: 1, 2, 3
```

### Frontend Sending
```typescript
// Sends: "3a872ebb-7477-454e-a678-5719cdbd6ad3"
// Instead of: 1
```

### Fix Options

#### Option A: Accept UUID in waitlist (RECOMMENDED)
Change column type to match what's actually being sent:

```typescript
@Column('uuid')
userId: string;  // Accept UUID from authenticated user
```

**AND** update the service to resolve numeric ID:
```typescript
// In locations.service.ts addToWaitlist()
async addToWaitlist(userId: string, ...) {
  // If userId is UUID, get numeric ID
  const user = await this.userRepository.findOne({
    where: { publicId: userId }
  });
  const numericUserId = user?.id; // Use numeric ID for waitlist
}
```

#### Option B: Fix Frontend to Send Numeric ID
Modify Flutter frontend to send `user.id` (numeric) instead of `user.publicId` (UUID).

### Safety Measures
- Option A is safer - handles both formats
- Option B requires Flutter changes and rebuild

### Impact
- If Option A: Requires code change in locations service
- If Option B: Requires Flutter rebuild and app update

### Rollback
- Revert entity change
- No data loss

---

## Phase 4: Handle Duplicate Key (P4)

### Root Cause
User insertion tries to insert phone that already exists.

### Fix Options

#### Option A: Upsert (RECOMMENDED)
Use `INSERT ... ON CONFLICT DO NOTHING` or check-before-insert:

```typescript
// In users.service.ts create()
async create(createUserDto: CreateUserDto) {
  // Check if user with this phone already exists
  const existing = await this.usersRepository.findOne({
    where: { phone: createUserDto.phone }
  });
  if (existing) {
    throw new ConflictException('Phone number already exists');
  }
  // Proceed with create
}
```

#### Option B: Update Instead of Create
If user exists with same phone, update their record instead of creating new.

### Safety Measures
- Check before insert - no data loss
- Return clear error message to user

### Rollback
- Revert error handling logic
- No data loss

---

## Implementation Priority Order

```
1. Run seeds (Phase 1)        ← Immediate, most impact
2. Test P1 errors resolved    ← Check if NOT NULL errors stop
3. If P1 persists, add hooks   ← Entity changes if needed
4. Run seeds again if needed   ← After entity hooks added
5. Fix waitlist (Phase 3)      ← Backend code change
6. Fix duplicate key (Phase 4) ← Error handling
```

---

## Verification Steps After Each Phase

### After Phase 1 (Seeding)
```bash
# Check tables have data
SELECT COUNT(*) FROM service;
SELECT COUNT(*) FROM worker;
SELECT COUNT(*) FROM service_area;
SELECT COUNT(*) FROM micro_zone;
```

### After Phase 2 (NOT NULL)
- Try creating a new service via API
- Check response has publicId

### After Phase 3 (waitlist)
- Test waitlist endpoint with authenticated user
- Check insert succeeds

### After Phase 4 (Duplicate)
- Try creating user with existing phone
- Should return conflict error, not crash

---

## Emergency Rollback Commands

If something breaks:

```sql
-- Full database reset (DANGER - deletes all data)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then re-run migrations and seeds
```

---

## Summary Checklist

- [ ] Phase 1: Run seeds → Verify data exists
- [ ] Phase 2: Check NOT NULL errors resolved
- [ ] Phase 3: Implement waitlist fix or frontend fix
- [ ] Phase 4: Add duplicate handling
- [ ] Full test: Create user, add to waitlist, create booking

---

## Files Modified

| Phase | File | Change |
|-------|------|--------|
| 1 | `src/database/seed.ts` | Run with `npm run seed` |
| 2 | Entities (if needed) | Add @BeforeInsert hooks |
| 3 | `src/locations/entities/waitlist.entity.ts` | Change userId type |
| 3 | `src/locations/locations.service.ts` | Add user resolution |
| 4 | `src/users/users.service.ts` | Add duplicate check |

---

Generated: 2026-03-26
Based on: Railway PostgreSQL deployment logs analysis
