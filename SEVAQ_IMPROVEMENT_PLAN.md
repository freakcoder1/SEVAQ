# SEVAQ Improvement Plan - System Managed

## Executive Summary

All improvements focus on **system-managed assignment** (like Urban Company). NO customer worker selection - the system automatically assigns the best worker.

---

## Implementation Plan (No Customer Choice)

### Priority 1: Fix Worker App Bookings Not Showing 🔴

**Issue:** Worker app shows 0 bookings even when assigned bookings exist.

**Root Cause:** The `/api/workers/me/bookings` endpoint queries by authenticated user, not worker profile.

**Files to fix:**
- `flutter-nest-househelp-master/src/workers/workers.controller.ts` - Check `/me/bookings` endpoint
- `flutter-nest-househelp-master/src/workers/workers.service.ts` - Fix query logic

**Fix:**
```typescript
@Get('me/bookings')
async getMyBookings(@Request() req) {
  // 1. First get worker profile by user ID
  const worker = await this.workersRepository.findOne({
    where: { user: { id: req.user.userId } }
  });
  
  if (!worker) return [];
  
  // 2. Then query bookings by worker ID
  return this.bookingsRepository.find({
    where: { worker: { id: worker.id } },
    relations: ['user', 'service']
  });
}
```

---

### Priority 2: Enforce Worker Profile Completion 🔴

**Issue:** New workers register with incomplete profiles (no location, no schedule, small radius).

**Fix:** Require these fields before worker becomes active:

**Files to modify:**
- `flutter-nest-househelp-master/src/workers/workers.service.ts` - `createWorkerProfile()`
- `flutter-nest-househelp-master/src/workers/dto/create-worker.dto.ts`

**Required fields:**
```typescript
const REQUIRED = [
  'bio',                    // Worker description (min 10 chars)
  'latitude',              // Location (required)
  'longitude',             // Location (required)
  'serviceRadiusKm',       // Must be >= 10km
  'availabilitySchedule', // At least 1 day with hours
  'services'              // At least 1 service selected
];
```

**Backend validation:**
```typescript
async createWorkerProfile(...) {
  // Validate required fields
  if (!bio || bio.length < 10) 
    throw new BadRequestException('Bio is required (min 10 characters)');
  if (!latitude || !longitude) 
    throw new BadRequestException('Location is required');
  if (!serviceRadiusKm || serviceRadiusKm < 10) 
    throw new BadRequestException('Service radius must be at least 10km');
  if (!availabilitySchedule || availabilitySchedule.length === 0) 
    throw new BadRequestException('Availability schedule is required');
  if (!serviceIds || serviceIds.length === 0) 
    throw new BadRequestException('Select at least one service');
}
```

---

### Priority 3: Auto-Set Default Values for New Workers 🟡

**Issue:** New workers get default 5km radius, no schedule - they can't get bookings.

**Fix:** Set sensible defaults during registration:

```typescript
// In createWorkerProfile()
const worker = this.workersRepository.create({
  // ... other fields
  serviceRadiusKm: 25, // Default 25km (like established workers)
  isActive: true,
  availabilitySchedule: [
    { day: 1, startTime: '08:00', endTime: '20:00' }, // Mon
    { day: 2, startTime: '08:00', endTime: '20:00' }, // Tue
    { day: 3, startTime: '08:00', endTime: '20:00' }, // Wed
    { day: 4, startTime: '08:00', endTime: '20:00' }, // Thu
    { day: 5, startTime: '08:00', endTime: '20:00' }, // Fri
  ]
});
```

---

### Priority 4: Improve Scoring Algorithm 🟡

**Current Issue:** Scoring doesn't consider:
- Worker's service radius vs customer distance
- Worker's availability schedule vs requested time
- Load balancing (workers with fewer today's jobs)

**Improved Scoring:**
```typescript
// In findBestWorker()

// 1. Check if worker can actually serve this distance
const maxDistance = worker.serviceRadiusKm || 25;
if (distance > maxDistance) {
  return null; // Worker can't serve this far
}

// 2. Check if worker is available at requested time
const isAvailable = checkAvailability(worker.availabilitySchedule, requestedTime);
if (!isAvailable) {
  return null; // Worker not working at this time
}

// 3. Calculate better score (lower = better)
const distanceScore = distanceKm <= 3 ? 0 : (distanceKm - 3) * 1.5;  // 3km free zone
const ratingScore = worker.rating < 4.0 ? (4.0 - worker.rating) * 20 : 0; // Penalize low rating
const loadScore = todayBookingsCount * 5; // Workers with fewer jobs get priority

const totalScore = distanceScore + ratingScore + loadScore;
```

---

### Priority 5: Worker Card UI Improvements 🟢

**Goal:** Show trust indicators like Urban Company

**Files to modify:**
- `frontend-flutter-house-help-master/lib/widgets/worker_card.dart`

**New UI:**
```dart
// Show more trust indicators
WorkerCard(
  name: "Manoj Sharma",
  rating: 4.5,           // ⭐ 4.5
  reviews: "(145 reviews)",
  jobs: "500+ homes served",  // NEW - homesServedInArea
  experience: "5 years",     // NEW - yearsOfExperience  
  distance: "2.5 km away",
  verified: true,            // NEW - isVerified badge
)
```

---

## Implementation Checklist

```
[ ] Priority 1: Fix worker app bookings not showing
    - Fix /workers/me/bookings endpoint
    - Test on worker app

[ ] Priority 2: Enforce worker profile completion  
    - Add validation in createWorkerProfile()
    - Return clear error messages

[ ] Priority 3: Auto-set default values
    - Default 25km radius
    - Default availability schedule (Mon-Fri 8am-8pm)

[ ] Priority 4: Improve scoring algorithm
    - Check service radius
    - Check availability schedule
    - Add load balancing

[ ] Priority 5: Worker card UI improvements  
    - Show homes served
    - Show years experience
    - Show verified badge
```

---

## Quick Actions (Can Do Now)

### 1. Update existing workers (cp pandey & Sumit) with proper defaults:

Run on Railway:
```bash
railway run node -e "
const { DataSource } = require('typeorm');
const dataSource = new DataSource({...});

async function main() {
  await dataSource.initialize();
  
  // Update cp pandey (id 17)
  await dataSource.query(\`
    UPDATE worker 
    SET \"serviceRadiusKm\" = 25,
        latitude = 28.58045790,
        longitude = 77.43929510
    WHERE id = 17
  \`);
  
  // Update Sumit (id 21)
  await dataSource.query(\`
    UPDATE worker 
    SET \"serviceRadiusKm\" = 25,
        latitude = 28.58045790,
        longitude = 77.43929510
    WHERE id = 21
  \`);
  
  console.log('Updated workers to 25km radius');
}

main();
"
```

### 2. Add slots for new workers (run migration script)

---

## Files Summary

| Priority | File | Change |
|----------|------|--------|
| 1 | `workers.controller.ts` | Fix /me/bookings query |
| 1 | `workers.service.ts` | Fix booking retrieval |
| 2 | `workers.service.ts` | Add profile validation |
| 3 | `workers.service.ts` | Set default values |
| 4 | `bookings.service.ts` | Improve scoring |
| 5 | `worker_card.dart` | Show trust indicators |

---

Ready to implement? Tell me which priority to start with.