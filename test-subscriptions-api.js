const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testSubscriptions() {
  try {
    // Step 1: Login to get token
    console.log('Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amit.kumar@househelp.com',
        password: 'password123' // Try common password
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginData.message);
      // Try another password
      const loginRes2 = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'amit.kumar@househelp.com',
          password: 'amit123'
        })
      });
      const loginData2 = await loginRes2.json();
      if (!loginRes2.ok) {
        console.error('Second login attempt failed:', loginData2.message);
        return;
      }
      var token = loginData2.accessToken || loginData2.token;
    } else {
      var token = loginData.accessToken || loginData.token;
    }
    
    console.log('Token obtained:', token ? 'Yes' : 'No');
    if (!token) {
      console.error('No token in response:', loginData);
      return;
    }
    
    // Step 2: Get user profile to get publicId
    console.log('Getting user profile...');
    const userRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const userData = await userRes.json();
    console.log('User publicId:', userData.publicId);
    
    // Step 3: Get subscriptions
    console.log('Fetching subscriptions...');
    const subsRes = await fetch(`${API_BASE}/subscriptions/user/${userData.publicId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const subsData = await subsRes.json();
    
    console.log('Subscriptions response status:', subsRes.status);
    console.log('Subscriptions count:', Array.isArray(subsData) ? subsData.length : 'Not an array');
    console.log('Subscriptions data:', JSON.stringify(subsData, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSubscriptions();
