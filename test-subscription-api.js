const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:45357/api';

async function testAuthAndSubscriptions() {
  console.log('=== Testing Auth and Subscriptions API ===');
  console.log('');

  // Test 1: Login
  console.log('1. Testing login...');
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test.user1@example.com',
      password: 'password123'
    });

    const { token, user } = loginResponse.data;
    console.log('✅ Login successful');
    console.log(`   User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   Token length: ${token.length}`);
    console.log(`   Token snippet: ${token.substring(0, 50)}...`);
    fs.writeFileSync('token.txt', token);
    console.log('');

    // Test 2: Get user's subscriptions
    console.log('2. Testing GET /api/subscriptions...');
    try {
      const subscriptionsResponse = await axios.get(`${API_BASE}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Subscriptions retrieved successfully');
      console.log(`   Status: ${subscriptionsResponse.status}`);
      console.log(`   Data type: ${typeof subscriptionsResponse.data}`);
      if (Array.isArray(subscriptionsResponse.data)) {
        console.log(`   Number of subscriptions: ${subscriptionsResponse.data.length}`);
        if (subscriptionsResponse.data.length > 0) {
          console.log(`   First subscription:`, subscriptionsResponse.data[0]);
        }
      } else {
        console.log(`   Data:`, subscriptionsResponse.data);
      }
      console.log('');
    } catch (error) {
      console.log('❌ GET /api/subscriptions failed');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.message || error.response.statusText}`);
        console.log(`   Full error:`, error.response.data);
      } else if (error.request) {
        console.log(`   No response received:`, error.request);
      } else {
        console.log(`   Error:`, error.message);
      }
      console.log('');
    }

    // Test 3: Create a subscription
    console.log('3. Testing POST /api/subscriptions...');
    try {
      const newSubscription = {
        serviceProfileId: 1, // Assuming profile 1 exists
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      };

      const createResponse = await axios.post(`${API_BASE}/subscriptions`, newSubscription, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Subscription created successfully');
      console.log(`   Status: ${createResponse.status}`);
      console.log(`   Subscription:`, createResponse.data);
      console.log('');
    } catch (error) {
      console.log('❌ POST /api/subscriptions failed');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.message || error.response.statusText}`);
        console.log(`   Full error:`, error.response.data);
      } else if (error.request) {
        console.log(`   No response received:`, error.request);
      } else {
        console.log(`   Error:`, error.message);
      }
      console.log('');
    }

  } catch (loginError) {
    console.log('❌ Login failed');
    if (loginError.response) {
      console.log(`   Status: ${loginError.response.status}`);
      console.log(`   Message: ${loginError.response.data?.message || loginError.response.statusText}`);
    } else if (loginError.request) {
      console.log(`   No response received:`, loginError.request);
    } else {
      console.log(`   Error:`, loginError.message);
    }
  }

  console.log('=== Testing completed ===');
}

testAuthAndSubscriptions().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
