const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://127.0.0.1:45357';

async function testAssignmentAPI() {
  console.log('=== TESTING ASSIGNMENT API ===\n');

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.user1@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.access_token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Check availability first
    console.log('1. Checking availability...');

    const availabilityResponse = await axios.post(`${BASE_URL}/assignments/check-availability`, {
      serviceId: 1, // Home Cleaning
      userLat: 28.5805083,
      userLng: 77.4392111,
      startTime: '2026-01-20T10:00:00.000Z', // 10:00 AM IST
      endTime: '2026-01-20T13:00:00.000Z' // 1:00 PM IST
    }, { headers: authHeaders });

    console.log('Availability result:', availabilityResponse.data);

    console.log('\n=== TEST COMPLETE ===');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAssignmentAPI().catch(console.error);