const axios = require('axios');

// API base URL
const API_BASE = 'http://127.0.0.1:45357';

async function testServerSimple() {
  try {
    console.log('🔍 Testing basic server connectivity...');

    // Try to get services (shouldn't require auth)
    const servicesResponse = await axios.get(`${API_BASE}/services`);
    console.log('✅ Services endpoint:');
    console.log(`   Total services: ${servicesResponse.data.length}`);
    console.log(`   First service: ${servicesResponse.data[0].name}`);

    // Try to get workers (shouldn't require auth)
    const workersResponse = await axios.get(`${API_BASE}/workers/service/1`);
    console.log('✅ Workers endpoint:');
    console.log(`   Workers for service 1: ${workersResponse.data.length}`);

    console.log('\n🎉 Server is running and responding to requests!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testServerSimple();
