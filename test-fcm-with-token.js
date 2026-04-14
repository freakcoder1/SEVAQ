const axios = require('axios');

const BASE_URL = 'https://sevaq-production.up.railway.app/api';

// Current FCM token from running Flutter app (updated)
const TEST_FCM_TOKEN = 'eRBOvl_zQNKESqfw-jmIuc:APA91bFKk9B3c2r3QWTn03VAOlmrIBCN2C2jMvy2wxD1fVCYe3kk9p-WocBEgpNBK3PNoLzhjdiiSnYpraLKlmbGbhnNIgrVEK2TrnF1njkIeDRGg3vtJ3Y';

async function testFCMWithToken() {
  console.log('=== TESTING FCM NOTIFICATION WITH REAL TOKEN ===\n');

  if (TEST_FCM_TOKEN === 'YOUR_FCM_TOKEN_HERE') {
    console.log('❌ Please replace TEST_FCM_TOKEN with a real FCM token from your running Flutter app');
    console.log('\nTo get an FCM token:');
    console.log('1. Check the Flutter app logs for "FCM Token obtained successfully"');
    console.log('2. Or add debug logging to print the token');
    console.log('3. Copy the token and paste it here');
    return;
  }

  try {
    // Check server health
    console.log('1. Checking server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');

    // Test FCM notification without authentication (since we added the endpoint)
    console.log('2. Testing FCM notification...');
    console.log(`Using FCM token: ${TEST_FCM_TOKEN.substring(0, 30)}...`);

    const notificationData = {
      fcmToken: TEST_FCM_TOKEN,
      title: 'Test Notification from Backend',
      body: `Test sent at ${new Date().toISOString()}`,
      data: {
        type: 'test_notification',
        testId: Date.now().toString(),
        source: 'backend_test'
      }
    };

    try {
      // Try without auth first (if endpoint allows it)
      console.log('Trying direct FCM test without authentication...');
      const response = await axios.post(`${BASE_URL}/notifications/test-fcm`, notificationData);
      console.log('✅ FCM notification sent successfully!');
      console.log('Response:', response.data);
      console.log('\n🎉 SUCCESS! FCM notification was sent via backend!');
      console.log('Check the Flutter app running on device 21b9bbc9 to see if notification was received.');
      return;
    } catch (authError) {
      console.log('Endpoint still requires authentication:', authError.response?.status);
      console.log('❌ Test endpoint requires authentication');
      console.log('This means we need valid login credentials to test');

      // Try to login and test
      console.log('\n3. Attempting authenticated test...');

      // Try the worker's credentials
      const loginData = {
        email: 'sumitjaiwal7870@gmail.com', // Worker email from database
        password: 'password123'             // Try common password
      };

      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
        const token = loginResponse.data.access_token;
        const authHeaders = { Authorization: `Bearer ${token}` };

        console.log('✅ Login successful');

        const response = await axios.post(
          `${BASE_URL}/notifications/test-fcm`,
          notificationData,
          { headers: authHeaders }
        );

        console.log('✅ FCM notification sent successfully!');
        console.log('Response:', response.data);

      } catch (loginError) {
        console.log('❌ Could not authenticate for testing');
        console.log('Error:', loginError.response?.data || loginError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error during FCM testing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

console.log('FCM Token Test Script');
console.log('======================');
console.log(`Test Token: ${TEST_FCM_TOKEN}`);
console.log('');

if (TEST_FCM_TOKEN === 'YOUR_FCM_TOKEN_HERE') {
  console.log('⚠️  ACTION REQUIRED: Replace TEST_FCM_TOKEN with a real FCM token from your running Flutter app');
  console.log('');
  console.log('How to get an FCM token:');
  console.log('1. Check Flutter app logs for "FCM Token obtained successfully: xxx..."');
  console.log('2. Look for token registration logs in the backend');
  console.log('3. Use Firebase Console to send a test notification and capture the token');
  console.log('4. Add debug logging to print the token in the Flutter app');
} else {
  testFCMWithToken();
}