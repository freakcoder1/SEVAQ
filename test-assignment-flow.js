const axios = require('axios');

// API base URL
const API_BASE = 'http://127.0.0.1:45357';

async function testAssignmentFlow() {
  try {
    console.log('🔍 Testing assignment system...');

    // 1. Check system status
    const healthCheck = await axios.get(`${API_BASE}/health`);
    console.log('✅ System health:', healthCheck.data);

    // 2. Test login (test user)
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test.user1@example.com',
      password: 'password123'
    });

    const userToken = loginResponse.data.access_token;
    console.log('✅ Test user login successful');

    // 3. Check available workers for service 1 (House Cleaning)
    const workersResponse = await axios.get(`${API_BASE}/workers/service/1`);
    console.log('✅ Workers available for service 1:', workersResponse.data.length);

    // 4. Create a test service request (with correct structure)
    const serviceRequest = await axios.post(`${API_BASE}/service-requests`, {
      serviceId: 1,
      date: '2026-01-20',
      timeWindow: 'morning',
      priceSnapshot: 500,
      location: {
        lat: 12.9716,
        lng: 77.5946
      }
    }, {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    });

    console.log('✅ Service request created:', serviceRequest.data.publicId);

    // 5. Check assignment status
    const assignmentStatus = await axios.get(`${API_BASE}/assignments/status/latest`);
    console.log('✅ Latest assignment status:', assignmentStatus.data);

    console.log('\n🎉 Assignment system is working correctly!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAssignmentFlow();
