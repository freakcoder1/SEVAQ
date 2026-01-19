# Mock Worker Seeding Script

This script helps populate your development database with mock workers and slots for testing the availability adjustment functionality.

## Purpose

The mock seeding script creates realistic test data to simulate various scenarios:

- **Worker availability**: Some workers available, some busy
- **Time conflicts**: Overlapping bookings and unavailable time slots
- **Service variety**: Different types of services (cleaning, cooking, etc.)
- **Geographic distribution**: Workers in different locations
- **Weekend patterns**: Limited availability on Sundays

## Prerequisites

1. Backend API running on `http://localhost:3000`
2. Admin token for API access
3. Node.js installed
4. `axios` package installed (`npm install axios`)

## Usage

### 1. Configure the Script

Edit the configuration at the top of `mock-worker-seeding.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'your-admin-token-here'; // Replace with actual admin token
```

### 2. Run the Script

```bash
cd frontend-flutter-house-help-master
node mock-worker-seeding.js
```

### 3. Expected Output

```
🚀 Starting mock worker seeding...

1️⃣ Creating mock workers...
✓ Created worker: Ramesh Kumar
✓ Created worker: Sunita Singh
✓ Created worker: Amit Sharma
✓ Created worker: Priya Patel
✓ Created worker: Vijay Yadav

✅ Created 5 workers successfully!

2️⃣ Creating mock slots for the next 7 days...
✓ Created slot for worker 1 on 2024-01-15T08:00:00.000Z
✓ Created slot for worker 1 on 2024-01-15T12:00:00.000Z
...

✅ Created 90 total slots (63 available, 27 unavailable)!

🎉 Mock seeding completed successfully!

📊 Summary:
   • Workers created: 5
   • Total slots: 90
   • Available slots: 63
   • Unavailable slots: 27
   • Coverage: Next 7 days, 3 time windows per day

💡 Test scenarios you can now try:
   1. Request a booking during unavailable time → Should show AvailabilityAdjustmentScreen
   2. Request a booking during available time → Should proceed normally
   3. Try different services → Should show appropriate workers
   4. Test weekend bookings → Should show limited availability
```

## Test Scenarios

After seeding, you can test various scenarios:

### Scenario 1: Worker Unavailable (400 Error)
- Request a booking during an unavailable time slot
- Should trigger the `AvailabilityAdjustmentScreen`
- Tests the business state handling

### Scenario 2: Normal Assignment
- Request a booking during an available time slot
- Should proceed to assignment flow normally
- Tests successful path

### Scenario 3: Service Variety
- Try different service types (cleaning, cooking)
- Should show appropriate workers for each service
- Tests service filtering

### Scenario 4: Weekend Limitations
- Try booking on Sunday
- Should show limited or no availability
- Tests weekend handling

## API Endpoints for Testing

After seeding, you can test these endpoints:

```bash
# List all workers
GET /workers

# List all slots
GET /slots

# Test assignment flow
POST /assignments/start-assignment-flow
{
  "serviceId": "7ff3de68-1068-4cbf-8f9f-9d283bca1f5b",
  "userLat": 28.5805083,
  "userLng": 77.4392111,
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T14:00:00.000Z",
  "userId": "user-1"
}

# Get alternative slots
GET /slots/alternatives?serviceId=7ff3de68-1068-4cbf-8f9f-9d283bca1f5b&startTime=2024-01-15T10:00:00.000Z&endTime=2024-01-15T14:00:00.000Z
```

## Customization

### Adding More Workers
Edit the `mockWorkers` array in the script:

```javascript
const mockWorkers = [
  {
    user: {
      firstName: 'New',
      lastName: 'Worker',
      email: 'new.worker@example.com',
      role: 'worker',
      phone: '+919876543215'
    },
    bio: 'New worker bio',
    rating: 4.5,
    reviewCount: 50,
    location: {
      lat: 28.5800000,
      lng: 77.4400000,
      address: 'New location'
    },
    services: ['service-id-here']
  }
  // Add more workers...
];
```

### Adjusting Availability
Modify the `generateMockSlots` function to change availability patterns:

```javascript
// Change availability rate (currently 70%)
const isAvailable = Math.random() > 0.3; // 70% available

// Add more time windows
const timeWindows = [
  { startHour: 6, endHour: 10 },   // Early morning
  { startHour: 8, endHour: 12 },   // Morning
  { startHour: 12, endHour: 16 },  // Afternoon
  { startHour: 16, endHour: 20 },  // Evening
  { startHour: 20, endHour: 22 }   // Late evening
];
```

### Changing Time Range
Modify the date range in the `seedDatabase` function:

```javascript
const startDate = new Date();
const endDate = new Date();
endDate.setDate(startDate.getDate() + 14); // 2 weeks instead of 1
```

## Troubleshooting

### Common Issues

1. **Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3000
   ```
   **Solution**: Make sure your backend API is running on port 3000.

2. **Authentication Error**
   ```
   401 Unauthorized
   ```
   **Solution**: Update the `ADMIN_TOKEN` with a valid admin token.

3. **Missing Dependencies**
   ```
   Cannot find module 'axios'
   ```
   **Solution**: Run `npm install axios` in the project directory.

4. **Database Errors**
   ```
   Duplicate entry for key 'email'
   ```
   **Solution**: The script may have been run before. Clear the database or use different email addresses.

### Debug Mode

Add debug logging by uncommenting console.log statements in the script, or run with:

```bash
DEBUG=* node mock-worker-seeding.js
```

## Integration with Frontend Testing

Use this script in combination with your frontend testing:

1. **Run the seeding script** to populate the database
2. **Start your Flutter app** in development mode
3. **Test the assignment flow** through the ServiceClarificationScreen
4. **Verify the AvailabilityAdjustmentScreen** appears when expected
5. **Test alternative slot selection** and waitlist functionality

## Resetting Test Data

To reset your test data:

1. Clear the database tables (workers, slots, bookings)
2. Re-run the seeding script
3. Or modify the script to include cleanup functions

```javascript
// Add to the script for cleanup
async function clearDatabase() {
  await api.delete('/workers');
  await api.delete('/slots');
  console.log('Database cleared');
}
```

## Notes

- The script creates realistic data with varying availability
- Some slots are intentionally made unavailable to test error scenarios
- Workers have different service specializations
- Geographic distribution simulates real-world coverage
- Ratings and review counts add realism to the test data