const axios = require('axios');

async function loginUser(email, password) {
  try {
    const response = await axios.post('http://127.0.0.1:45357/auth/login', { email, password });
    return response.data.access_token;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testServiceRequest() {
  console.log('=== TESTING SERVICE REQUEST CREATION ===\n');

  try {
    // Login first with correct test credentials
    console.log('1. Logging in...');
    const token = await loginUser('test.user1@example.com', 'password123');
    console.log('Login successful, got token');

    // Create a service request
    console.log('2. Creating a service request...');

    // Use tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const response = await axios.post('http://127.0.0.1:45357/service-requests', {
      serviceId: 1, // Home Cleaning
      date: tomorrowStr,
      timeWindow: 'early-morning', // This should match the available slots
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

    const statusResponse = await axios.get(`http://127.0.0.1:45357/service-requests/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Assignment status:', statusResponse.data);

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testServiceRequest();
