// Test login on local server
const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357/api';

async function testLogin(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    console.log('✅ Login successful!');
    console.log('Token:', response.data.access_token.substring(0, 50) + '...');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return null;
  }
}

async function getWorkerBookings(token, workerId) {
  try {
    const response = await axios.get(`${API_BASE}/bookings?workerId=${workerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`\n📋 Worker ${workerId} bookings:`);
    console.log('  Total:', response.data.total);
    if (response.data.data && response.data.data.length > 0) {
      console.log('  Bookings:', JSON.stringify(response.data.data.map(b => ({id: b.id, status: b.status, service: b.service?.name})), null, 2));
    }
    return response.data;
  } catch (error) {
    console.error('❌ Get worker bookings error:', error.response?.data || error.message);
    return null;
  }
}

// Try different credentials
async function main() {
  console.log('Testing local server login...\n');
  
  // Try test user credentials
  const credentials = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'test.user1@example.com', password: 'password123' },
    { email: 'admin@sevaq.com', password: 'admin123' },
    { email: 'user@example.com', password: 'password123' },
  ];
  
  for (const cred of credentials) {
    console.log(`Trying: ${cred.email} / ${cred.password}`);
    const token = await testLogin(cred.email, cred.password);
    if (token) {
      console.log('\n✅ Found working credentials!');
      
      // Check worker 16 bookings
      await getWorkerBookings(token, 16);
      break;
    }
    console.log('');
  }
}

main();
