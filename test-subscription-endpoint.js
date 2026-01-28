const axios = require('axios');
require('dotenv').config();

const baseUrl = 'http://localhost:45357/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU4MzA3OCwiZXhwIjoxNzcyMTc1MDc4fQ.YF7bX3y8pN3G2zZ8X3y8pN3G2zZ8X3y8pN3G2zZ8';

async function testSubscription() {
  console.log('📋 Testing Subscription API');
  console.log('🔍 URL:', `${baseUrl}/subscriptions`);
  console.log('🔑 Token:', token);

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
