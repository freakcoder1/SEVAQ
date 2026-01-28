const axios = require('axios');

async function checkWorkersAndSlots() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post('http://0.0.0.0:45357/auth/login', {
      email: 'test.user1@example.com',
      password: 'password123'
    });
    const token = loginRes.data.access_token;

    console.log('✅ Logged in successfully');

    // Check workers for service 1
    console.log('🔍 Checking workers for service 1...');
    const workersRes = await axios.get('http://0.0.0.0:45357/workers/service/1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('👷 Workers available:', workersRes.data.length);

    // Check slots for a worker
    if (workersRes.data.length > 0) {
      const workerId = workersRes.data[0].id;
      console.log(`📅 Checking slots for worker ${workerId}...`);
      const slotsRes = await axios.get('http://0.0.0.0:45357/slots?workerId=' + workerId, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📋 Slots available:', slotsRes.data.length);
      
      if (slotsRes.data.length > 0) {
        console.log('⏰ First slot details:', slotsRes.data[0]);
      }
    } else {
      console.log('❌ No workers available for service 1');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📄 Full response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkWorkersAndSlots();
