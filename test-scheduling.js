const axios = require('axios');
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function testScheduling() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'sevaq_db'
  });

  try {
    await client.connect();
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Update user's password
    const updateQuery = `
      UPDATE "user" 
      SET password = $1
      WHERE email = 'test.user1@example.com'
    `;
    await client.query(updateQuery, [hashedPassword]);
    console.log('✅ Password updated for test.user1@example.com');

    await client.end();

    // Login to get token
    const loginResponse = await axios.post('http://127.0.0.1:45357/auth/login', {
      email: 'test.user1@example.com',
      password: 'test123'
    });

    const token = loginResponse.data.access_token;
    console.log('🔑 Login successful, token obtained');

    // Create service request
    const response = await axios.post('http://127.0.0.1:45357/service-requests', {
      serviceId: 1,
      date: '2026-01-18',
      timeWindow: 'morning',
      priceSnapshot: 1500,
      location: {
        lat: 28.58046,
        lng: 77.43928,
        address: 'Greater Noida, Bisrakh Jalalpur, Uttar Pradesh, India'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Service request created successfully:', response.data);
    console.log('📝 Request ID:', response.data.requestId);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (client._connected) {
      await client.end();
    }
  }
}

testScheduling();