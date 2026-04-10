// Test script to check what the workers/me API returns
const axios = require('axios');

// Use the same IP as the Flutter app
const API_BASE = 'http://192.168.1.38:45357';

async function testApi() {
  try {
    // First login to get a token
    console.log('Attempting OTP login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/otp/verify-login`, {
      phone: '+918299126022',
      idToken: 'dev_test_token'
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.access_token || loginResponse.data.accessToken;
    
    if (!token) {
      console.log('No token received!');
      return;
    }
    
    console.log('\nToken received:', token.substring(0, 50) + '...');
    
    // Now get worker profile
    console.log('\nFetching worker profile...');
    const workerResponse = await axios.get(`${API_BASE}/workers/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('\n=== WORKER PROFILE RESPONSE ===');
    console.log(JSON.stringify(workerResponse.data, null, 2));
    
    // Check if user object is present
    const data = workerResponse.data;
    if (data.worker) {
      console.log('\n=== WORKER DATA (nested) ===');
      console.log('worker.user:', JSON.stringify(data.worker.user, null, 2));
      console.log('worker.userId:', data.worker.userId);
      console.log('worker.id:', data.worker.id);
    } else {
      console.log('\n=== DIRECT WORKER DATA ===');
      console.log('user:', JSON.stringify(data.user, null, 2));
      console.log('userId:', data.userId);
      console.log('id:', data.id);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testApi();
