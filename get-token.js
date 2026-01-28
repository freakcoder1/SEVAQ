const axios = require('axios');
require('dotenv').config();

const baseUrl = 'http://127.0.0.1:45357/api';

async function login() {
  console.log('🔑 Login to get valid JWT token');
  try {
    const response = await axios.post(
      `${baseUrl}/auth/login`,
      {
        email: 'test.user1@example.com',
        password: 'password123'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const { access_token } = response.data;
    console.log('✅ Token obtained successfully');
    console.log('🔐 Token:', access_token);

    return access_token;
  } catch (error) {
    console.log('❌ Error logging in:', error.response?.status, error.response?.statusText);
    console.log('🔍 Response data:', error.response?.data);
    console.log('🔍 Headers:', error.response?.headers);
    throw error;
  }
}

async function testSubscription() {
  const token = await login();
  
  console.log('\n📋 Testing Subscription API');
  console.log('🔍 URL:', `${baseUrl}/subscriptions`);

  try {
    const response = await axios.post(
      `${baseUrl}/subscriptions`,
      {
        serviceProfileId: 1,
        frequency: 'DAILY',
        timeWindowStart: '08:00',
        timeWindowEnd: '17:00',
        startDate: '2026-01-28',
        customDays: [1, 3, 5]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.statusText);
    console.log('🔍 Response data:', error.response?.data);
    console.log('🔍 Headers:', error.response?.headers);
  }
}

testSubscription();
