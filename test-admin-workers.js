const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://127.0.0.1:45357/api/auth/login', {
      email: 'admin@sevaq.com',
      password: 'Admin@123456'
    });
    const token = loginRes.data.access_token;
    console.log('Token obtained');

    const headers = { Authorization: 'Bearer ' + token };

    // Test workers endpoint
    const workersRes = await axios.get('http://127.0.0.1:45357/api/admin/workers', { headers });
    console.log('Workers count:', workersRes.data.length);
    if (workersRes.data.length > 0) {
      console.log('First worker:', JSON.stringify(workersRes.data[0], null, 2));
    }

    // Test with filter
    const workersFiltered = await axios.get('http://127.0.0.1:45357/api/admin/workers?isAvailable=true', { headers });
    console.log('Workers with isAvailable=true:', workersFiltered.data.length);

  } catch (e) {
    console.error('Error:', e.response?.status, JSON.stringify(e.response?.data, null, 2) || e.message);
  }
}

test();
