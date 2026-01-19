const axios = require('axios');

async function testServiceRequest() {
  try {
    console.log('Testing service request creation...');
    
    // First test if server is responding
    const healthCheck = await axios.get('http://127.0.0.1:3000/health');
    console.log('✅ Server is responding:', healthCheck.data);
    
    const response = await axios.post('http://127.0.0.1:3000/service-requests', {
      userId: 'test-uuid-123',
      serviceId: 'cleaning',
      date: '2024-01-15',
      timeWindow: 'morning',
      priceSnapshot: 500,
      location: {
        lat: 28.5804579,
        lng: 77.4392951,
        address: 'Test Address'
      }
    });

    console.log('✅ Service request created successfully!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Service request failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

testServiceRequest();