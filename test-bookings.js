// Test worker bookings endpoint
const axios = require('axios');

async function test() {
  try {
    // Use the same token from before
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN1bWl0amlhd2w3ODcwQGdtYWlsLmNvbSIsInN1YiI6IjExIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzQ5NzQ1MjEsImV4cCI6MTc3NTA2MDkyMX0.k0tM89lP_8F_yZyqP_tK3Gvf0U1V2LJyU9gP5XwKz7qE';
    
    // First get worker profile
    const profileRes = await axios.get('https://sevaq-production.up.railway.app/api/workers/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Worker ID:', profileRes.data.id);
    
    // Then get bookings
    const bookingsRes = await axios.get('https://sevaq-production.up.railway.app/api/workers/me/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Bookings:', JSON.stringify(bookingsRes.data, null, 2));
    
  } catch (e) {
    console.log('Error:', e.response?.status, e.response?.data || e.message);
  }
}

test();