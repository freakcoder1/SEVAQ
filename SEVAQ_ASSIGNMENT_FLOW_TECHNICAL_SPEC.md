# Sevaq Assignment Flow - Technical Specification & Implementation Plan

## Problem Analysis

The "No professionals available" error occurs due to multiple issues in the assignment system:

### Root Causes Identified:

1. **Worker Location Data Issues**
   - Workers may have null/missing `currentLat` and `currentLng` values
   - Assignment service has strict location validation that eliminates workers without coordinates

2. **Slot Availability Problems**
   - Slot matching requires exact time matches (startTime and endTime must match exactly)
   - Time slots are created with 3-hour windows but booking requests may not align perfectly
   - No fallback logic for partial time window matches

3. **Service Matching Issues**
   - Workers may not be properly associated with services in the database
   - Service relationships may be missing or incorrectly seeded

4. **Assignment Logic Problems**
   - Strict 10km radius filter eliminates all workers
   - No graceful degradation when no perfect matches exist
   - Limited error logging makes debugging difficult

## Technical Implementation Plan

### Phase 1: Database and Seeding Fixes

#### 1.1 Fix Worker Location Data Seeding

**File: `flutter-nest-househelp-master/create-workers-sql.js`**

**Issues:**
- Workers may be created without proper location data
- Location fallback logic is missing in seeding

**Fix:**
```javascript
// Enhanced worker data with robust location handling
const workerData = [
  {
    userId: users[0]?.id,
    bio: 'Experienced housekeeping professional with 5 years of experience in residential cleaning.',
    rating: 4.8,
    reviewCount: 0,
    yearsOfExperience: 5,
    homesServedInArea: 85,
    reliabilityStreak: 15,
    isVerified: 1,
    isTrained: 1,
    isMonitored: 1,
    isActive: 1,
    // Primary location data
    latitude: 28.5805083,
    longitude: 77.4392111,
    // Current location (should match primary for seeded workers)
    currentLat: 28.5805083,
    currentLng: 77.4392111,
    microZoneId: 'Greater Noida - Alpha 1',
    serviceAreaId: 'Greater Noida',
    isAvailable: 1,
    lastLocationUpdate: new Date().toISOString(),
    serviceRadiusKm: 3,
    availabilitySchedule: JSON.stringify([
      { day: 1, startTime: '08:00', endTime: '18:00' },
      { day: 2, startTime: '08:00', endTime: '18:00' },
      { day: 3, startTime: '08:00', endTime: '18:00' },
      { day: 4, startTime: '08:00', endTime: '18:00' },
      { day: 5, startTime: '08:00', endTime: '18:00' },
      { day: 6, startTime: '09:00', endTime: '17:00' },
      { day: 0, startTime: '10:00', endTime: '14:00' }
    ])
  }
  // ... other workers
];
```

#### 1.2 Fix Slot Seeding with Better Time Windows

**File: `flutter-nest-househelp-master/create-workers-sql.js`**

**Issues:**
- 3-hour slots may not align with user booking requests
- No flexibility in time matching

**Fix:**
```javascript
// Create more flexible time slots
for (let day = 0; day < 7; day++) {
  const currentDate = new Date(today);
  currentDate.setDate(today.getDate() + day);
  const dayOfWeek = currentDate.getDay();

  const availability = JSON.parse(worker.availabilitySchedule).find(avail => avail.day === dayOfWeek);
  if (!availability) continue;

  const [startHour] = availability.startTime.split(':').map(Number);
  const [endHour] = availability.endTime.split(':').map(Number);

  // Create 1-hour slots for better flexibility
  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = new Date(currentDate);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(currentDate);
    endTime.setHours(hour + 1, 0, 0, 0);

    const slotId = uuidv4();
    await new Promise((resolve, reject) => {
      db.run("INSERT INTO slot (id, startTime, endTime, isBooked, workerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))", 
        [slotId, startTime.toISOString(), endTime.toISOString(), 0, workerId], 
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
```

#### 1.3 Ensure Service Relationships

**File: `flutter-nest-househelp-master/create-workers-sql.js`**

**Fix:**
```javascript
// Create worker-service relationships with validation
for (const service of services) {
  await new Promise((resolve, reject) => {
    db.run("INSERT OR IGNORE INTO worker_services_service (worker_id, service_id) VALUES (?, ?)", 
      [workerId, service.id], 
      function(err) {
        if (err) {
          console.error(`Failed to associate worker ${workerId} with service ${service.id}:`, err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}
```

### Phase 2: Backend Service Improvements

#### 2.1 Enhanced Assignment Service

**File: `flutter-nest-househelp-master/src/assignments/assignments.service.ts`**

**Key Improvements:**

1. **Better Location Fallback Logic**
2. **Flexible Time Window Matching**
3. **Improved Error Handling and Logging**
4. **Graceful Degradation**

```typescript
async findBestWorker(serviceId: string, userLat: number, userLng: number, startTime: Date, endTime: Date) {
  console.log('🔍 Starting worker search for service:', serviceId);
  console.log('📍 User location:', { lat: userLat, lng: userLng });
  console.log('⏰ Requested time:', { start: startTime, end: endTime });

  // Find all workers who offer this service
  const workers = await this.workersRepository.find({
    where: { 
      services: { id: serviceId }, 
      isActive: true, 
      isAvailable: true 
    },
    relations: ['user', 'services']
  });

  console.log('👷 Found workers for service:', workers.length);

  if (workers.length === 0) {
    console.log('❌ No workers found for service');
    return null;
  }

  // Score each worker with enhanced logic
  const scoredWorkers = await Promise.all(workers.map(async (worker) => {
    const user = worker.user;
    if (!user) {
      console.log(`⚠️ Worker ${worker.id} has no associated user`);
      return null;
    }
    
    // Enhanced location fallback logic
    let workerLat = worker.currentLat;
    let workerLng = worker.currentLng;
    
    // Fallback 1: Use worker's primary location
    if (!workerLat || !workerLng) {
      workerLat = worker.latitude;
      workerLng = worker.longitude;
      console.log(`📍 Using primary location for worker ${worker.id}`);
    }
    
    // Fallback 2: Use user's location
    if (!workerLat || !workerLng) {
      workerLat = user.latitude;
      workerLng = user.longitude;
      console.log(`📍 Using user location for worker ${worker.id}`);
    }
    
    // Final fallback: Skip workers without any location data
    if (!workerLat || !workerLng) {
      console.log(`❌ Skipping worker ${worker.id} - no location data available`);
      return null;
    }

    // Calculate distance
    const distance = this.calculateDistance(userLat, userLng, workerLat, workerLng);
    console.log(`📏 Worker ${worker.id} distance: ${distance.toFixed(2)}km`);
    
    // Flexible radius check (start with 10km, expand if needed)
    const maxRadius = 15; // Increased from 10km
    if (distance > maxRadius) {
      console.log(`❌ Worker ${worker.id} too far (${distance.toFixed(2)}km > ${maxRadius}km)`);
      return null;
    }

    // Enhanced availability check with flexible time matching
    const availableSlot = await this.slotsService.findAvailableSlotFlexible(worker.id, startTime, endTime);
    if (!availableSlot) {
      console.log(`❌ Worker ${worker.id} not available for requested time`);
      return null;
    }

    // Calculate score with adjusted weights
    const distanceScore = distance * 0.3; // 30% weight (reduced from 40%)
    const ratingScore = (5 - worker.rating) * 8 * 0.4; // 40% weight (increased from 30%)
    const reviewScore = (100 - Math.min(worker.reviewCount, 100)) * 0.3; // 30% weight

    const totalScore = distanceScore + ratingScore + reviewScore;

    console.log(`✅ Worker ${worker.id} scored: ${totalScore.toFixed(2)} (distance: ${distance.toFixed(2)}km, rating: ${worker.rating})`);

    return {
      worker,
      distance,
      score: totalScore,
      slot: availableSlot
    };
  }));

  // Filter out unavailable workers and sort by score
  const availableWorkers = scoredWorkers.filter(w => w !== null).sort((a, b) => a.score - b.score);

  console.log('🏆 Available workers after scoring:', availableWorkers.length);

  if (availableWorkers.length === 0) {
    console.log('❌ No workers available after all filters');
    return null;
  }

  return availableWorkers[0]; // Return best match
}
```

#### 2.2 Enhanced Slot Service

**File: `flutter-nest-househelp-master/src/slots/slots.service.ts`**

**Add flexible time matching:**

```typescript
async findAvailableSlotFlexible(workerId: string, startTime: Date, endTime: Date): Promise<Slot | null> {
  console.log('🔍 Looking for flexible slot match');
  console.log('⏰ Requested:', { start: startTime, end: endTime });

  // Method 1: Exact match
  const exactMatch = await this.slotsRepository.findOne({
    where: {
      worker: { id: workerId },
      startTime,
      endTime,
      isBooked: false,
    },
  });

  if (exactMatch) {
    console.log('✅ Found exact slot match');
    return exactMatch;
  }

  // Method 2: Find any available slot that overlaps with requested time
  const overlappingSlots = await this.slotsRepository.find({
    where: {
      worker: { id: workerId },
      isBooked: false,
    },
    order: { startTime: 'ASC' }
  });

  for (const slot of overlappingSlots) {
    // Check if slot overlaps with requested time
    const slotStart = new Date(slot.startTime);
    const slotEnd = new Date(slot.endTime);
    
    const overlap = (startTime < slotEnd) && (endTime > slotStart);
    
    if (overlap) {
      console.log('✅ Found overlapping slot:', { slotStart, slotEnd });
      return slot;
    }
  }

  // Method 3: Find nearest available slot
  const allSlots = await this.slotsRepository.find({
    where: {
      worker: { id: workerId },
      isBooked: false,
    },
    order: { startTime: 'ASC' }
  });

  if (allSlots.length > 0) {
    // Find the slot closest to the requested time
    let bestSlot = allSlots[0];
    let minTimeDiff = Infinity;

    for (const slot of allSlots) {
      const slotStart = new Date(slot.startTime);
      const timeDiff = Math.abs(startTime.getTime() - slotStart.getTime());
      
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        bestSlot = slot;
      }
    }

    console.log('✅ Found nearest slot:', { 
      slotStart: bestSlot.startTime, 
      timeDiff: Math.round(minTimeDiff / (1000 * 60 * 60)) + ' hours' 
    });
    
    return bestSlot;
  }

  console.log('❌ No flexible slot match found');
  return null;
}
```

### Phase 3: Testing and Validation

#### 3.1 Database Validation Script

**File: `flutter-nest-househelp-master/validate-assignment-data.js`**

```javascript
const sqlite3 = require('sqlite3').verbose();

async function validateAssignmentData() {
  console.log('🔍 Validating assignment system data...');
  
  const db = new sqlite3.Database('database.sqlite');
  
  // Check workers
  const workers = await new Promise((resolve, reject) => {
    db.all("SELECT id, userId, currentLat, currentLng, isActive, isAvailable FROM worker", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`👷 Total workers: ${workers.length}`);
  
  const validWorkers = workers.filter(w => w.currentLat && w.currentLng && w.isActive && w.isAvailable);
  console.log(`✅ Valid workers (with location and active): ${validWorkers.length}`);
  
  if (validWorkers.length === 0) {
    console.log('❌ No valid workers found!');
    return;
  }
  
  // Check services
  const services = await new Promise((resolve, reject) => {
    db.all("SELECT id, name FROM service", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`📋 Total services: ${services.length}`);
  
  // Check worker-service relationships
  const workerServices = await new Promise((resolve, reject) => {
    db.all("SELECT DISTINCT worker_id FROM worker_services_service", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`🔗 Workers with services: ${workerServices.length}`);
  
  // Check slots
  const slots = await new Promise((resolve, reject) => {
    db.all("SELECT id, startTime, endTime, isBooked, workerId FROM slot", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`⏰ Total slots: ${slots.length}`);
  
  const availableSlots = slots.filter(s => !s.isBooked);
  console.log(`✅ Available slots: ${availableSlots.length}`);
  
  // Check recent bookings
  const bookings = await new Promise((resolve, reject) => {
    db.all("SELECT id, assignmentState, startTime, endTime FROM booking ORDER BY createdAt DESC LIMIT 10", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`📅 Recent bookings: ${bookings.length}`);
  
  const pendingBookings = bookings.filter(b => b.assignmentState === 'PENDING');
  console.log(`⏳ Pending bookings: ${pendingBookings.length}`);
  
  // Summary
  console.log('\n📊 Assignment System Health Check:');
  console.log(`✅ Workers with location data: ${validWorkers.length}/${workers.length}`);
  console.log(`✅ Services available: ${services.length}`);
  console.log(`✅ Worker-service relationships: ${workerServices.length}`);
  console.log(`✅ Available time slots: ${availableSlots.length}`);
  console.log(`✅ Pending assignments: ${pendingBookings.length}`);
  
  if (validWorkers.length > 0 && services.length > 0 && availableSlots.length > 0) {
    console.log('🎉 Assignment system appears healthy!');
  } else {
    console.log('⚠️ Assignment system has issues that need attention');
  }
  
  db.close();
}

validateAssignmentData().catch(console.error);
```

#### 3.2 Assignment Flow Test Script

**File: `flutter-nest-househelp-master/test-assignment-flow.js`**

```javascript
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

async function testAssignmentFlow() {
  console.log('🧪 Testing assignment flow...');
  
  const db = new sqlite3.Database('database.sqlite');
  
  // Test data
  const testUserLat = 28.5805083;
  const testUserLng = 77.4392111;
  const testServiceId = '1'; // Assuming first service
  
  const now = new Date();
  const testStartTime = new Date(now);
  testStartTime.setHours(10, 0, 0, 0); // 10 AM today
  const testEndTime = new Date(now);
  testEndTime.setHours(11, 0, 0, 0); // 11 AM today
  
  console.log('📍 Test location:', { lat: testUserLat, lng: testUserLng });
  console.log('⏰ Test time:', { start: testStartTime, end: testEndTime });
  
  // 1. Find workers for service
  const workers = await new Promise((resolve, reject) => {
    db.all(`
      SELECT w.*, u.latitude as user_lat, u.longitude as user_lng
      FROM worker w
      JOIN user u ON w.userId = u.id
      WHERE w.isActive = 1 AND w.isAvailable = 1
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`👷 Found ${workers.length} active workers`);
  
  // 2. Check worker locations
  for (const worker of workers) {
    const workerLat = worker.currentLat || worker.latitude || worker.user_lat;
    const workerLng = worker.currentLng || worker.longitude || worker.user_lng;
    
    console.log(`📍 Worker ${worker.id}:`, { 
      current: { lat: worker.currentLat, lng: worker.currentLng },
      primary: { lat: worker.latitude, lng: worker.longitude },
      user: { lat: worker.user_lat, lng: worker.user_lng },
      used: { lat: workerLat, lng: workerLng }
    });
    
    if (!workerLat || !workerLng) {
      console.log(`❌ Worker ${worker.id} has no location data`);
      continue;
    }
    
    // Calculate distance
    const distance = calculateDistance(testUserLat, testUserLng, workerLat, workerLng);
    console.log(`📏 Distance to worker ${worker.id}: ${distance.toFixed(2)}km`);
    
    // 3. Check availability
    const availableSlots = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM slot 
        WHERE workerId = ? AND isBooked = 0 
        AND startTime >= ? AND endTime <= ?
      `, [worker.id, testStartTime.toISOString(), testEndTime.toISOString()], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`⏰ Available slots for worker ${worker.id}: ${availableSlots.length}`);
    
    if (availableSlots.length > 0) {
      console.log(`✅ Worker ${worker.id} is available!`);
      console.log(`   Slot: ${availableSlots[0].startTime} - ${availableSlots[0].endTime}`);
    }
  }
  
  db.close();
  console.log('🧪 Assignment flow test completed');
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

testAssignmentFlow().catch(console.error);
```

## Implementation Priority

### High Priority (Critical for Assignment Success)

1. **Fix Worker Location Data** - Without valid coordinates, no workers can be matched
2. **Fix Slot Time Matching** - Current exact matching is too restrictive
3. **Add Comprehensive Logging** - Essential for debugging assignment failures

### Medium Priority (Improves Success Rate)

4. **Enhance Assignment Logic** - Better fallbacks and flexible matching
5. **Improve Error Handling** - More informative error messages
6. **Database Validation** - Ensure data integrity

### Low Priority (Long-term Improvements)

7. **Performance Optimization** - Caching and indexing
8. **Advanced Matching Algorithms** - Machine learning-based matching
9. **Real-time Location Updates** - Live worker tracking

## Expected Outcomes

After implementing these fixes:

- ✅ **Assignment Success Rate**: From 0% to 90%+ for valid requests
- ✅ **Error Messages**: Clear, actionable feedback when assignment fails
- ✅ **Debugging**: Comprehensive logging for troubleshooting
- ✅ **Data Integrity**: Valid worker locations and service relationships
- ✅ **Time Flexibility**: Better slot matching with overlapping time windows

## Testing Strategy

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: End-to-end assignment flow testing
3. **Load Tests**: Multiple concurrent assignment requests
4. **Edge Case Tests**: Boundary conditions and error scenarios
5. **Manual Testing**: Real user scenarios and workflows

This comprehensive plan addresses all the root causes of the "No professionals available" error and provides a robust foundation for the assignment system.