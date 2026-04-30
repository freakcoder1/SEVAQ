const axios = require('axios');

const API_BASE = 'http://127.0.0.1:3000/api';

async function testMonitoring() {
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sevaq.com',
      password: 'admin123' // Assuming this password, adjust if needed
    });
    
    const token = loginRes.data.access_token;
    console.log('   Login successful, token obtained');
    
    // Step 2: Test worker locations endpoint
    console.log('\n2. Testing GET /admin/monitoring/workers/locations...');
    const workersRes = await axios.get(`${API_BASE}/admin/monitoring/workers/locations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Status: ${workersRes.status}`);
    console.log(`   Workers count: ${workersRes.data.length}`);
    console.log('   Sample worker:', JSON.stringify(workersRes.data[0], null, 2));
    
    // Step 3: Test active bookings endpoint
    console.log('\n3. Testing GET /admin/monitoring/bookings/active...');
    const bookingsRes = await axios.get(`${API_BASE}/admin/monitoring/bookings/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Status: ${bookingsRes.status}`);
    console.log(`   Active bookings count: ${bookingsRes.data.length}`);
    console.log('   Sample booking:', JSON.stringify(bookingsRes.data[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\nTrying to create admin user first...');
      try {
        await axios.post(`${API_BASE}/auth/signup`, {
          email: 'admin@sevaq.com',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        });
        console.log('Admin user created, please run the script again');
      } catch (signupError) {
        console.error('Failed to create admin:', signupError.response?.data || signupError.message);
      }
    }
  }
}

testMonitoring();
