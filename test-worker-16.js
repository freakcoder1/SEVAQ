// Create test booking and assign to worker 16 - simpler approach
const axios = require('axios');

const API_BASE = 'https://sevaq-production.up.railway.app/api';

// Use worker 16's user account
const WORKER_16_EMAIL = 'brand_new_test_1774845295463@test.com';
const WORKER_16_PASSWORD = 'Test1234!';

let accessToken = null;

async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    console.log('✅ Login successful!');
    accessToken = response.data.access_token;
    return response.data;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function getWorkerInfo(workerId) {
  try {
    const response = await axios.get(`${API_BASE}/workers/${workerId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Worker info:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Get worker error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function getWorkers() {
  try {
    console.log('\n🔍 Getting available workers...');
    const response = await axios.get(`${API_BASE}/workers`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Workers count:', response.data.length || response.data.total || response.data.length);
    if (Array.isArray(response.data)) {
      console.log('First few workers:', response.data.slice(0, 3).map(w => ({id: w.id, name: w.user?.firstName})));
    }
    return response.data;
  } catch (error) {
    console.error('❌ Get workers error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function main() {
  console.log('=== Testing API with Worker 16 Credentials ===\n');
  
  // Login with worker 16's user account
  console.log(`Logging in as: ${WORKER_16_EMAIL}`);
  const user = await login(WORKER_16_EMAIL, WORKER_16_PASSWORD);
  
  if (!user || !accessToken) {
    console.log('\n⚠️ Login failed with worker 16 credentials.');
    console.log('   This is expected if this is a new worker account.');
    console.log('\n💡 Alternative: Create a new booking through the app and use the assign endpoint.');
    return;
  }
  
  // Check if worker 16 exists
  console.log('\n🔍 Checking worker 16...');
  await getWorkerInfo(16);
  
  // Get all workers
  await getWorkers();
}

main();