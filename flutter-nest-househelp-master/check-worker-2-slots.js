const axios = require('axios');

async function checkWorker2Slots() {
  try {
    // Login
    const loginRes = await axios.post('http://0.0.0.0:45357/auth/login', {
      email: 'test.user1@example.com',
      password: 'password123'
    });
    const token = loginRes.data.access_token;

    // Check slots for worker 2
    const slotsRes = await axios.get('http://0.0.0.0:45357/slots?workerId=2', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Worker 2 slots:', JSON.stringify(slotsRes.data, null, 2));

    // Check if worker 2 is available for service 1
    const workersRes = await axios.get('http://0.0.0.0:45357/workers/service/1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const worker2 = workersRes.data.find(w => w.id === 2);
    console.log('👷 Worker 2 details:', JSON.stringify(worker2, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📄 Full response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkWorker2Slots();
