/**
 * Investigation script to check:
 * 1. What workers exist in the system
 * 2. What bookings exist with their assignedWorkerId
 * 3. Status of those bookings
 */

const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357';

async function investigate() {
  console.log('=== WORKER APP BOOKING INVESTIGATION ===\n');

  try {
    // Step 1: Get all workers
    console.log('1. Fetching all workers...');
    const workersResponse = await axios.get(`${API_BASE}/api/workers`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const workers = workersResponse.data;
    console.log(`   Found ${workers.length} workers:`);
    workers.forEach(w => {
      console.log(`   - ID: ${w.id}, Name: ${w.name}, Phone: ${w.phone}, Status: ${w.status}`);
    });
    console.log('');

    if (workers.length === 0) {
      console.log('NO WORKERS FOUND - This is likely the issue!');
      return;
    }

    // Step 2: Get bookings from database via API
    console.log('2. Fetching all bookings to check assignedWorkerId...');
    let bookings = [];
    try {
      const bookingsResponse = await axios.get(`${API_BASE}/api/bookings`, {
        headers: { 'Content-Type': 'application/json' }
      });
      bookings = bookingsResponse.data;
    } catch (err) {
      console.log('   Could not fetch all bookings (may require auth):', err.message);
    }

    // Step 3: For each worker, check their bookings via /api/workers/:id/bookings
    console.log('\n3. Checking bookings for each worker via /api/workers/:id/bookings...');
    for (const worker of workers) {
      try {
        const response = await axios.get(`${API_BASE}/api/workers/${worker.id}/bookings`, {
          headers: { 'Content-Type': 'application/json' }
        });
        const workerBookings = response.data;
        console.log(`\n   Worker ${worker.name} (ID: ${worker.id}):`);
        console.log(`   Found ${workerBookings.length} bookings`);
        
        if (workerBookings.length > 0) {
          workerBookings.forEach(b => {
            console.log(`   - Booking ID: ${b.id}, Status: ${b.status}, Service: ${b.serviceName || b.service?.name || 'N/A'}`);
            console.log(`     AssignedWorkerId: ${b.assignedWorkerId}`);
          });
        }
      } catch (err) {
        console.log(`   Error fetching bookings for worker ${worker.id}:`, err.message);
      }
    }

    // Step 4: Check /api/workers/me/bookings (requires auth - need to get a token)
    console.log('\n4. Checking /api/workers/me/bookings...');
    console.log('   Note: This endpoint requires worker authentication.');
    console.log('   We need to test this from the worker app perspective with a valid token.');

    // Step 5: List sample booking IDs to check assignedWorkerId values
    console.log('\n5. Sample booking data (if available):');
    if (bookings.length > 0) {
      bookings.slice(0, 5).forEach(b => {
        console.log(`   Booking ID: ${b.id}, Status: ${b.status}, assignedWorkerId: ${b.assignedWorkerId}`);
      });
    }

    console.log('\n=== INVESTIGATION COMPLETE ===');

  } catch (error) {
    console.error('Error during investigation:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

investigate();
