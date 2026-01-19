const axios = require('axios');

async function loginUser(email, password) {
  try {
    const response = await axios.post('http://0.0.0.0:45357/auth/login', { email, password });
    return response.data.access_token;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testServiceRequest() {
  console.log('=== TESTING SERVICE REQUEST CREATION ===\n');

  try {
    // Login first
    console.log('1. Logging in...');
    const token = await loginUser('user@test.com', 'UserPass123!');
    console.log('Login successful, got token');

    // Create a service request
    console.log('2. Creating a service request...');

    const response = await axios.post('http://0.0.0.0:45357/service-requests', {
      serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b', // Home Cleaning
      date: '2026-01-15T10:00:00.000Z',
      timeWindow: 'morning',
      priceSnapshot: 1500,
      location: {
        lat: 28.5805083,
        lng: 77.4392111,
        address: 'Test Address'
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Service request created:', response.data);

    const requestId = response.data.requestId;

    // Wait a bit for assignment processing
    console.log('\n2. Waiting for assignment processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check assignment status
    console.log('\n3. Checking assignment status...');

    const statusResponse = await axios.get(`http://0.0.0.0:45357/service-requests/${requestId}`);
    console.log('Assignment status:', statusResponse.data);

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testServiceRequest();