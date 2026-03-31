const axios = require('axios');

async function test() {
  try {
    // Use a valid token from previous tests
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN1bWl0amlhd2w3ODcwQGdtYWlsLmNvbSIsInN1YiI6IjExIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzQ5NzQ1MjEsImV4cCI6MTc3NTA2MDkyMX0.k0tM89lP_8F_yZyqP_tK3Gvf0U1V2LJyU9gP5XwKz7qE';
    
    // Try PATCH
    const patchRes = await axios.patch('https://sevaq-production.up.railway.app/api/workers/me', 
      { bio: 'Updated bio' },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    console.log('PATCH:', patchRes.status, JSON.stringify(patchRes.data, null, 2));
  } catch (e) {
    console.log('Error:', e.response?.status, e.response?.data || e.message);
  }
}

test();