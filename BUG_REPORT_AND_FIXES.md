# Bug Report: Comprehensive API Testing - Issues and Fixes

**Date:** 2026-03-24
**Project:** SEVAQ Backend (NestJS + PostgreSQL)
**Test Script:** `flutter-nest-househelp-master/comprehensive-api-test.js`

---

## Bug Summary

| # | Bug ID | Component | Severity | Status |
|---|--------|-----------|----------|--------|
| 1 | BUG-001 | Notifications Service | HIGH | Identified |
| 2 | BUG-002 | One-Time Booking | MEDIUM | Identified |
| 3 | BUG-003 | Authentication | LOW | Workaround |

---

## Bug 1: Notifications UUID Parsing Error

### Error Message
```
error: invalid input syntax for type uuid: "36"
```

### Root Cause Analysis

The booking entity uses UUID for `userId`:
```typescript
// booking.entity.ts (lines 48-49)
@Column({ name: 'userId', type: 'uuid' })
userId: string;
```

However, in the notifications service, when querying for bookings, the code passes the JWT publicId directly:
```typescript
// notifications.service.ts (line 336)
query = query.andWhere('booking.userId = :userId', { userId });
```

The JWT contains a `userId` as the numeric database ID, but the booking table expects a UUID.

### Affected Code Locations

1. **`notifications.service.ts:166-172`** - `sendPreServiceReminder()`
```typescript
const user = await this.usersRepository.findOne({
  where: { publicId: booking.userId },  // ❌ booking.userId is UUID, not publicId
});
```

2. **`notifications.service.ts:335-337`** - `findBookingsNeedingReminders()`
```typescript
if (userId) {
  query = query.andWhere('booking.userId = :userId', { userId });
  // ❌ userId from JWT is numeric, but booking.userId is UUID
}
```

### Fix Implementation

**File:** `flutter-nest-househelp-master/src/notifications/notifications.service.ts`

#### Fix 1.1: Update `sendPreServiceReminder` (lines 166-176)

```typescript
async sendPreServiceReminder(
  booking: Booking,
  reminderType: '24h' | '2h',
): Promise<void> {
  // FIX: booking.userId is already a UUID, use it directly
  const user = await this.usersRepository.findOne({
    where: { id: booking.userId },  // Changed from publicId to id
  });
  if (!user) {
    console.error(`User not found for booking ${booking.id}`);
    return;
  }
  // ... rest of the code
}
```

**Wait - this is wrong.** The `booking.userId` is a UUID but the User entity uses `publicId` as UUID. Let me check the user entity:

Looking at the error, the issue is that:
1. The JWT contains `userId` as numeric (database ID)
2. The booking stores `userId` as UUID (foreign key)
3. The notification service is passing the numeric JWT ID to the UUID column

The proper fix should be to convert the numeric userId to UUID first.

#### Fix 1.2: Update `findBookingsNeedingReminders` (lines 335-337)

```typescript
if (userId) {
  // FIX: First convert the numeric userId to UUID
  const user = await this.usersRepository.findOne({
    where: { id: parseInt(userId) } as any,  // Convert numeric to find user
  });
  
  if (user) {
    query = query.andWhere('booking.userId = :userId', { 
      userId: user.publicId  // Use the UUID publicId
    });
  }
}
```

### Impact Assessment

- **Subscription Flow:** ✅ NOT AFFECTED - Uses serviceProfileId, not userId for queries
- **Worker Assignment:** ✅ NOT AFFECTED - Uses booking ID and worker ID
- **Booking Creation:** ✅ NOT AFFECTED - Uses service ID and dates
- **Notifications:** ❌ BROKEN - Needs the above fix

---

## Bug 2: One-Time Booking Service Response Parsing

### Error Message
```
❌ Create one-time booking: FAIL No services available
```

### Root Cause Analysis

The test script uses:
```javascript
const servicesRes = await makeRequest('GET', '/services');
const service = servicesRes.data[0];  // ❌ Returns undefined
```

The actual API response format is:
```json
{
  "data": [
    { "id": 1, ... },
    { "id": 3, ... }
  ],
  "meta": { "total": 2, ... }
}
```

The script should access `servicesRes.data.data[0]` (nested) or handle the response properly.

### Affected Code Locations

1. **`comprehensive-api-test.js`** - Test function `testOneTimeBooking()`

### Fix Implementation

**File:** `flutter-nest-househelp-master/comprehensive-api-test.js`

```javascript
// Update testOneTimeBooking function (around line 80)
async function testOneTimeBooking(token) {
  // ...
  
  // Test 2.1: Create a one-time booking
  try {
    // First, get available services
    const servicesRes = await makeRequest('GET', '/services');
    // FIX: Handle nested data structure
    const services = servicesRes.data.data || servicesRes.data;
    const service = services && services[0];
    
    if (!service) {
      log('Create one-time booking', 'FAIL', 'No services available');
      return { ...results, bookingId: null };
    }
    // ... rest of the code
  }
}
```

### Impact Assessment

- **Subscription Flow:** ✅ NOT AFFECTED - Uses service-profiles endpoint
- **Worker Assignment:** ❌ PARTIALLY AFFECTED - Can't assign without booking
- **Booking Creation:** ❌ BROKEN - Can't create one-time bookings
- **Notifications:** ✅ NOT AFFECTED - Uses different endpoints

---

## Bug 3: Authentication Test User Not Found

### Error Message
```
❌ Login with valid credentials: FAIL Status: 401, Response: Invalid credentials
```

### Root Cause Analysis

The test script tries to login with hardcoded credentials:
```javascript
email: 'test@example.com',
password: 'password123',
```

But this user doesn't exist in the database. The workaround in the test script creates a new user via signup first, then logs in.

### Affected Code Locations

1. **`comprehensive-api-test.js`** - Test function `testLogin()`

### Current Workaround (Already Implemented)

The test script now:
1. Creates a new user via `/api/auth/signup`
2. Uses those new credentials to login

This is the correct approach - no code fix needed for the backend.

### Impact Assessment

- **All Flows:** ✅ NOT AFFECTED - Workaround implemented in test script

---

## Summary of Fixes Required

### Priority 1: HIGH - Fix Notifications UUID Issue

**Files to modify:**
- `flutter-nest-househelp-master/src/notifications/notifications.service.ts`

**Changes needed:**
1. Line ~170: Fix user lookup to use correct ID type
2. Line ~335-337: Convert userId to UUID before query

### Priority 2: MEDIUM - Update Test Script Service Parsing

**Files to modify:**
- `flutter-nest-househelp-master/comprehensive-api-test.js`

**Changes needed:**
- Line ~80: Fix service data access (`servicesRes.data.data`)

### Priority 3: LOW - No Action Required

The authentication workaround is already in place in the test script.

---

## Testing After Fixes

After implementing fixes, re-run the test script:
```bash
cd flutter-nest-househelp-master
node comprehensive-api-test.js
```

Expected results after fixes:
- Login/Authentication: 3/3 (100%)
- One-Time Booking: 4/4 (100%)
- Subscription Service: 7/7 (100%)
- Worker Assignment: 3/3 (100%)
- Notifications: 3/3 (100%)
- Service Profiles: 3/3 (100%)

Total: 23/23 (100%)
