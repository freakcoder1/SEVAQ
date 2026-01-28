const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://127.0.0.1:45357';

async function main() {
  console.log('=== GETTING BOOKINGS ===\n');

  try {
    // Step 1: Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.user1@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.access_token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Step 2: Get bookings
    const bookingsResponse = await axios.get(`${BASE_URL}/bookings`, { headers: authHeaders });
    console.log('Bookings:', bookingsResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

main();