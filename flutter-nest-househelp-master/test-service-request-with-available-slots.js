const axios = require('axios');

async function testServiceRequest() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post('http://0.0.0.0:45357/auth/login', {
      email: 'test.user1@example.com',
      password: 'password123'
    });
    const token = loginRes.data.access_token;

    console.log('✅ Logged in successfully');

    // Create service request for tomorrow (which has available slots)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log('📝 Creating service request for:', tomorrowStr);
    
    const serviceRequestData = {
      serviceId: 1,
      date: tomorrowStr,
      timeWindow: 'morning',
      priceSnapshot: 300,
      location: {
        lat: 28.5820,
        lng: 77.4370,
        address: '123 Main Street, New Delhi'
      }
    };

    const serviceRequestRes = await axios.post('http://0.0.0.0:45357/service-requests', serviceRequestData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Service request created successfully');
    console.log('📄 Request details:', JSON.stringify(serviceRequestRes.data, null, 2));

    // Check assignment status
    const requestId = serviceRequestRes.data.requestId;
    console.log('🔍 Checking assignment status for request:', requestId);
    
    // Wait a few seconds for assignment worker to process
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusRes = await axios.get(`http://0.0.0.0:45357/service-requests/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📊 Assignment status:', JSON.stringify(statusRes.data, null, 2));

    // Check if we got assigned workers
    if (statusRes.data.status === 'ASSIGNED') {
      console.log('🎉 Great! Workers have been assigned');
    } else if (statusRes.data.status === 'SEARCHING') {
      console.log('⏳ Still searching for available workers...');
    } else {
      console.log('❌ No workers available');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📄 Full response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testServiceRequest();
