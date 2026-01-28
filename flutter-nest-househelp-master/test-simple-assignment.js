const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:45357';
const TEST_USER_EMAIL = 'test.user1@example.com';
const TEST_USER_PASSWORD = 'password123';

async function testAssignmentFlow() {
  try {
    console.log('=== Testing Assignment Flow ===');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');

    // Step 2: Check availability
    console.log('2. Checking availability...');
    const availabilityResponse = await axios.post(`${API_BASE_URL}/assignments/check-availability`, {
      serviceId: 1,
      userLat: 28.5805083,
      userLng: 77.4392111,
      startTime: '2026-01-20T10:00:00.000Z',
      endTime: '2026-01-20T13:00:00.000Z'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Availability check successful:', availabilityResponse.data.available ? 'Available' : 'Not available');
    if (!availabilityResponse.data.available) {
      console.log('❌ No availability, cannot proceed with assignment');
      return;
    }

    // Step 3: Try to create booking with assignment
    console.log('3. Creating booking with assignment...');
    const bookingResponse = await axios.post(`${API_BASE_URL}/assignments/create-booking-with-assignment`, {
      serviceId: 1,
      userLat: 28.5805083,
      userLng: 77.4392111,
      startTime: '2026-01-20T10:00:00.000Z',
      endTime: '2026-01-20T13:00:00.000Z',
      notes: 'Test booking'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Booking created successfully');
    console.log('Booking details:', bookingResponse.data);

    console.log('=== Assignment Flow Test Complete ===');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('Detailed error:', error.response.data);
    }
  }
}

testAssignmentFlow();