const axios = require('axios');

async function checkLogin() {
  try {
    const response = await axios.post('http://127.0.0.1:45357/api/auth/login', {
      email: 'test.user1@example.com',
      password: 'password123'
    });

    console.log('Login response status:', response.status);
    console.log('Login response headers:', response.headers);
    console.log('Login response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    console.error('Error data:', error.response?.data);
  }
}

checkLogin();