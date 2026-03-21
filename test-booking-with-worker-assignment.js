const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357/api';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU4OTc0MSwiZXhwIjoxNzcyMTgxNzQxfQ.CWmEYqetW147FeEIOkg9zFzhSOZBL79M2idzUyuDI2Q';

// Test configuration
const TEST_SERVICE_ID = 1; // Home Cleaning
const TEST_WORKER_ID = 1; // Amit Kumar
const TEST_LOCATION = { lat: 28.5780049, lng: 77.4386759 }; // Greater Noida

// Headers with authentication
const authHeaders = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json',
};

async function getAvailableWorkers() {
  try {
    console.log('\n👥 Checking available workers near location...');
    
    const response = await axios.get(`${API_BASE}/locations/availability`, {
      params: {
        lat: TEST_LOCATION.lat,
        lng: TEST_LOCATION.lng,
        radius: 15,
      }
    });
    
    console.log('✅ Available workers:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error getting available workers:', error.response?.data?.message || error.message);
    return null;
  }
}

async function getWorkersForService(serviceId) {
  try {
    console.log(`\n👷 Getting workers for service ${serviceId}...`);
    
    const response = await axios.get(`${API_BASE}/workers/service/${serviceId}`);
    console.log('✅ Workers for service count:', response.data.length);
    
    // Show workers offering the service
    const workers = response.data.map(w => ({
      id: w.id,
      name: `${w.user?.firstName} ${w.user?.lastName}`,
      rating: w.rating,
      reviewCount: w.reviewCount,
      availability: w.availabilitySchedule
    }));
    console.log('Workers:', JSON.stringify(workers, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting workers for service:', error.response?.data?.message || error.message);
    return null;
  }
}

async function createBooking(serviceId, workerId, startTime, endTime) {
  try {
    console.log(`\n📅 Creating booking with worker ${workerId}...`);
    
    const bookingData = {
      serviceId,
      workerId,
      startTime,
      endTime,
      notes: 'Test booking with worker assignment'
    };
    
    const response = await axios.post(`${API_BASE}/bookings`, bookingData, { headers: authHeaders });
    console.log('✅ Booking created:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error creating booking:', error.response?.data?.message || error.message);
    return null;
  }
}

async function getBookingStatus(bookingId) {
  try {
    console.log(`\n📋 Getting booking status for ${bookingId}...`);
    
    const response = await axios.get(`${API_BASE}/bookings/${bookingId}`, { headers: authHeaders });
    console.log('✅ Booking status:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error getting booking status:', error.response?.data?.message || error.message);
    return null;
  }
}

async function attemptAssignment(serviceId, userLat, userLng) {
  try {
    console.log(`\n🔍 Attempting worker assignment for service ${serviceId}...`);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9:00 AM IST
    
    const endTime = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000);
    
    const assignmentData = {
      serviceId,
      userLat,
      userLng,
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
    };
    
    const response = await axios.post(`${API_BASE}/assignments/attempt-assignment`, assignmentData, { headers: authHeaders });
    console.log('✅ Assignment result:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error attempting assignment:', error.response?.data?.message || error.message);
    return null;
  }
}

async function createBookingWithAssignment(serviceId, userLat, userLng) {
  try {
    console.log(`\n📅 Creating booking with automatic assignment...`);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9:00 AM IST
    
    const endTime = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000);
    
    const bookingData = {
      serviceId,
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      notes: 'Test booking with auto-assignment',
      userLat,
      userLng,
    };
    
    const response = await axios.post(`${API_BASE}/bookings`, bookingData, { headers: authHeaders });
    console.log('✅ Booking created:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error creating booking:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runTest() {
  console.log('='.repeat(60));
  console.log('🧪 WORKER ASSIGNMENT TEST');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check available workers near location
    console.log('\n📍 Step 1: Checking available workers near test location...');
    const availableWorkers = await getAvailableWorkers();
    
    // Step 2: Get workers for Home Cleaning
    console.log('\n📍 Step 2: Getting workers for Home Cleaning (Service 1)...');
    const serviceWorkers = await getWorkersForService(TEST_SERVICE_ID);
    
    if (serviceWorkers.length === 0) {
      console.log('\n❌ No workers found for Home Cleaning service');
      return;
    }
    
    // Use the first available worker (Amit Kumar - ID 1)
    const selectedWorker = serviceWorkers[0];
    console.log(`\n✅ Selected worker: ${selectedWorker.user?.firstName} ${selectedWorker.user?.lastName} (ID: ${selectedWorker.id})`);
    
    // Step 3: Try creating booking with the selected worker
    console.log('\n📍 Step 3: Creating booking with selected worker...');
    
    // Use tomorrow at 9:00 AM IST (which is 03:30 UTC)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9:00 AM IST
    
    const endTime = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000); // 3 hours later
    
    console.log(`Booking time: ${tomorrow.toISOString()} (UTC)`);
    console.log(`Local time: ${tomorrow.toString()}`);
    
    const booking = await createBooking(
      TEST_SERVICE_ID,
      selectedWorker.id,
      tomorrow.toISOString(),
      endTime.toISOString()
    );
    
    if (booking && booking.id) {
      console.log('\n🎉 SUCCESS: Booking created with worker assignment!');
      console.log('Booking ID:', booking.id);
      console.log('Worker ID:', booking.workerId);
      console.log('Service ID:', booking.serviceId);
      console.log('Start Time:', booking.startTime);
      console.log('End Time:', booking.endTime);
      console.log('Status:', booking.status || booking.assignmentState);
      
      // Check booking status
      console.log('\n📍 Step 4: Checking booking status...');
      const status = await getBookingStatus(booking.id);
      
      if (status) {
        console.log('\n📋 Full Booking Details:');
        console.log('  ID:', status.id);
        console.log('  Worker:', status.worker ? `${status.worker.user?.firstName} ${status.worker.user?.lastName}` : 'N/A');
        console.log('  Status:', status.status);
        console.log('  Assignment State:', status.assignmentState);
      }
    } else {
      console.log('\n⚠️  Booking creation failed, trying auto-assignment...');
      
      // Step 4: Try auto-assignment
      console.log('\n📍 Step 4: Trying automatic worker assignment...');
      const assignment = await attemptAssignment(TEST_SERVICE_ID, TEST_LOCATION.lat, TEST_LOCATION.lng);
      
      if (assignment && assignment.success && assignment.worker) {
        console.log('\n✅ Worker found via assignment!');
        console.log('Worker:', `${assignment.worker.firstName} ${assignment.worker.lastName}`);
        
        // Create booking with assigned worker
        const booking2 = await createBooking(
          TEST_SERVICE_ID,
          assignment.worker.id,
          tomorrow.toISOString(),
          endTime.toISOString()
        );
        
        if (booking2 && booking2.id) {
          console.log('\n🎉 BOOKING SUCCESSFUL!');
          console.log('Booking ID:', booking2.id);
        }
      } else {
        console.log('\n❌ No worker available for assignment');
        console.log('Reason:', assignment?.reason || 'Unknown');
        
        // Try booking with auto-assignment endpoint
        console.log('\n📍 Step 5: Trying booking with auto-assignment...');
        const autoBooking = await createBookingWithAssignment(TEST_SERVICE_ID, TEST_LOCATION.lat, TEST_LOCATION.lng);
        
        if (autoBooking && autoBooking.id) {
          console.log('\n🎉 AUTO-ASSIGNMENT BOOKING SUCCESSFUL!');
          console.log('Booking ID:', autoBooking.id);
          console.log('Assigned Worker ID:', autoBooking.workerId);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
runTest();
