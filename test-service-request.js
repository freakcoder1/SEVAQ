const axios = require('axios');

// Test service request creation
async function testServiceRequest() {
  try {
    const baseUrl = 'http://127.0.0.1:45357';
    
    // First, check if the endpoint is reachable
    console.log('Checking service requests endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('Health endpoint:', healthResponse.status, healthResponse.data);
    
    // Check if service requests route is registered
    console.log('\nChecking system readiness...');
    const readinessResponse = await axios.get(`${baseUrl}/system/readiness`);
    console.log('System readiness:', readinessResponse.status, readinessResponse.data);
    
    // Log in to get token
    console.log('\nLogging in to get token...');
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'test3@example.com',
      password: 'Test@123'
    });
    const token = loginResponse.data.access_token;
    console.log('Login successful. Token received');
    
    // Try to create a test service request
    console.log('\nTesting service request creation...');
    const testRequest = {
      serviceId: 1,
      date: '2024-01-17',
      timeWindow: 'morning',
      priceSnapshot: 150.00
    };
    
    const response = await axios.post(`${baseUrl}/service-requests`, testRequest, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Success! Service request created:', response.data);
    
    return true;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return false;
  }
}

testServiceRequest().then(success => {
  console.log('\n=== Test Complete ===');
  console.log('Service requests endpoint is', success ? 'working' : 'not working');
});
