const axios = require('axios');

const BASE_URL = 'https://sevaq-production.up.railway.app/api';

async function testFCMProduction() {
  console.log('=== TESTING FCM NOTIFICATIONS IN PRODUCTION ===\n');

  try {
    // First, let's check if the server is running
    console.log('1. Checking server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');

    // Try to get some worker data to see if FCM tokens are registered
    console.log('2. Checking for workers with FCM tokens...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.user1@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.access_token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Get workers
    const workersResponse = await axios.get(`${BASE_URL}/workers`, {
      headers: authHeaders
    });

    const workers = workersResponse.data;
    console.log(`Found ${workers.length} workers`);

    // Check which workers have FCM tokens
    const workersWithTokens = workers.filter(w => w.fcmToken);
    console.log(`${workersWithTokens.length} workers have FCM tokens registered`);

    if (workersWithTokens.length > 0) {
      console.log('\n3. Testing FCM notification to first worker...');
      const testWorker = workersWithTokens[0];
      console.log(`Testing with worker: ${testWorker.id}, FCM token: ${testWorker.fcmToken.substring(0, 20)}...`);

      // Test FCM notification
      const notificationResponse = await axios.post(
        `${BASE_URL}/notifications/test-fcm`,
        {
          fcmToken: testWorker.fcmToken,
          title: 'Test Notification from Production',
          body: 'This is a test FCM notification from the production server'
        },
        { headers: authHeaders, timeout: 15000 }
      );

      console.log('✅ FCM test notification sent successfully');
      console.log('Response:', notificationResponse.data);
    } else {
      console.log('❌ No workers have FCM tokens registered');
    }

  } catch (error) {
    console.error('❌ Error during FCM testing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFCMProduction();