// Create a booking and assign to the new worker
const axios = require('axios');

const API_BASE = 'https://sevaq-production.up.railway.app/api';

// Test credentials
const WORKER_EMAIL = 'brand_new_test_1774845295463@test.com';
const WORKER_PASSWORD = 'Test1234!';

// Worker details
const WORKER_ID = 16;

async function getToken(email, password) {
  const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return response.data.access_token;
}

async function createBooking(token) {
  // Create a new booking for testing with Date objects
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const endTime = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
  
  const bookingData = {
    serviceId: 2, // Home Cleaning service ID
    userId: 'f29177ed-d1a1-4fbc-ae75-02d0bd9a8a73', // Worker user UUID
    workerId: WORKER_ID,
    startTime: tomorrow.toISOString(), // Full datetime string
    endTime: endTime.toISOString(), // Full datetime string
    notes: 'Test booking for worker flow verification',
    type: 'one-time',
    location: {
      address: '123 Test Street, Greater Noida',
      latitude: '28.58045790',
      longitude: '77.43929510'
    }
  };

  try {
    const response = await axios.post(`${API_BASE}/bookings`, bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Booking created:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('Booking creation error:', error.response?.data || error.message);
    return null;
  }
}

async function checkBookings(token) {
  try {
    const response = await axios.get(`${API_BASE}/workers/me/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Worker bookings count:', Array.isArray(response.data) ? response.data.length : 'Not an array');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('Check error:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('=== Creating test booking for worker flow ===\n');
  
  // Login as worker
  console.log('--- Getting worker token ---');
  const workerToken = await getToken(WORKER_EMAIL, WORKER_PASSWORD);
  console.log('Worker token obtained');
  
  // Check current bookings
  console.log('\n--- Current worker bookings ---');
  await checkBookings(workerToken);
  
  // Create a booking as worker
  console.log('\n--- Creating new booking (as worker) ---');
  const booking = await createBooking(workerToken);
  
  if (booking && booking.id) {
    console.log('✅ Booking created successfully with ID:', booking.id);
    // Check bookings again
    console.log('\n--- Worker bookings after creation ---');
    await checkBookings(workerToken);
  } else {
    console.log('❌ Booking creation failed');
  }
}

main().catch(console.error);