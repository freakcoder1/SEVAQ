const axios = require('axios');

async function checkService1Workers() {
  try {
    // Login
    const loginRes = await axios.post('http://0.0.0.0:45357/auth/login', {
      email: 'test.user1@example.com',
      password: 'password123'
    });
    const token = loginRes.data.access_token;

    // Get all workers for service 1
    const workersRes = await axios.get('http://0.0.0.0:45357/workers/service/1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('👷 Workers for service 1:', workersRes.data.length);
    
    for (const worker of workersRes.data) {
      console.log(`\n--- Worker ${worker.id} ---`);
      console.log(`Name: ${worker.user?.name || 'Unknown'}`);
      console.log(`Distance: ${worker.distance?.toFixed(2)}km`);
      console.log(`Location: ${worker.currentLat}, ${worker.currentLng}`);
      console.log(`Available: ${worker.isAvailable}`);
      
      // Check slots for this worker
      const slotsRes = await axios.get(`http://0.0.0.0:45357/slots?workerId=${worker.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Slots available: ${slotsRes.data.length}`);
      if (slotsRes.data.length > 0) {
        console.log('Slot details:');
        slotsRes.data.forEach(slot => {
          console.log(`  - ${slot.date}: ${slot.startTime.slice(11, 16)} - ${slot.endTime.slice(11, 16)} (Booked: ${slot.isBooked})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📄 Full response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkService1Workers();
