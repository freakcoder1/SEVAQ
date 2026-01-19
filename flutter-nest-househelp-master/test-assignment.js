const { Client } = require('pg');
console.log('[DEBUG] test-assignment.js: Using PostgreSQL database for assignment testing');
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testAssignmentLogic() {
  await client.connect();
  try {
    console.log('=== TESTING ASSIGNMENT LOGIC ===\n');

  // Test 1: Check workers and their services
  console.log('1. Checking workers and their services...');
  const result = await client.query(`
    SELECT w.id, w.is_active as "isActive", w.is_available as "isAvailable", w.latitude, w.longitude, w.current_lat as "currentLat", w.current_lng as "currentLng",
           s.id as "serviceId", s.name as "serviceName"
    FROM worker w
    JOIN worker_services_service wss ON w.id = wss.worker_id
    JOIN service s ON wss.service_id = s.id
    ORDER BY w.id
  `);
  const workers = result.rows;

  console.log('Workers found:', workers.length);
  workers.forEach(w => {
    console.log(`  Worker ${w.id}: ${w.serviceName} (Active: ${w.isActive}, Available: ${w.isAvailable})`);
  });

  // Test 2: Check available slots
  console.log('\n2. Checking available slots...');
  const result2 = await client.query(`
    SELECT s.id, s.worker_id as "workerId", s.start_time as "startTime", s.end_time as "endTime", s.is_booked as "isBooked"
    FROM slot s
    WHERE s.is_booked = false
    ORDER BY s.start_time
    LIMIT 10
  `);
  const slots = result2.rows;

  console.log('Available slots found:', slots.length);
  slots.forEach(slot => {
    console.log(`  Slot ${slot.id}: Worker ${slot.workerId} - ${slot.startTime} to ${slot.endTime}`);
  });

  // Test 3: Simulate assignment request
  console.log('\n3. Simulating assignment request...');
  
  // Use a sample request with current time
  const now = new Date();
  const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
  
  console.log(`Looking for slots between ${startTime.toISOString()} and ${endTime.toISOString()}`);
  
  console.log(`Requesting assignment for ${startTime} to ${endTime}`);
  console.log('User location: 28.5805083, 77.4392111');

  // Test 4: Check which workers are within radius
  console.log('\n4. Checking worker distances...');
  
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const userLat = 28.5805083;
  const userLng = 77.4392111;

  for (const worker of workers) {
    const workerLat = worker.currentLat || worker.latitude;
    const workerLng = worker.currentLng || worker.longitude;
    
    if (workerLat && workerLng) {
      const distance = calculateDistance(userLat, userLng, workerLat, workerLng);
      console.log(`  Worker ${worker.id}: ${distance.toFixed(2)}km away`);
      
      if (distance <= 15) {
        console.log(`    ✅ Within 15km radius`);
        
        // Check if worker has available slots
        const result3 = await client.query(`
          SELECT s.id, s.start_time as "startTime", s.end_time as "endTime"
          FROM slot s
          WHERE s.worker_id = $1 AND s.is_booked = false
          AND s.start_time >= $2 AND s.start_time < $3
        `, [worker.id, startTime.toISOString(), endTime.toISOString()]);
        const availableSlots = result3.rows;
        
        console.log(`    Available slots: ${availableSlots.length}`);
        availableSlots.forEach(slot => {
          console.log(`      Slot: ${slot.startTime} to ${slot.endTime}`);
        });
      } else {
        console.log(`    ❌ Too far (${distance.toFixed(2)}km > 15km)`);
      }
    } else {
      console.log(`  Worker ${worker.id}: No location data`);
    }
  }

  console.log('\n=== TEST COMPLETE ===');
} catch (error) {
  console.error('Error:', error);
} finally {
  await client.end();
}
}

testAssignmentLogic().catch(console.error);