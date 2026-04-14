const axios = require('axios');

const BASE_URL = 'https://sevaq-production.up.railway.app/api';

async function testFCMDiagnostics() {
  console.log('=== FCM DIAGNOSTICS IN PRODUCTION ===\n');

  try {
    // 1. Check server health
    console.log('1. Checking server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');

    // 2. Check Firebase status
    console.log('2. Checking Firebase initialization status...');
    const firebaseStatusResponse = await axios.get(`${BASE_URL}/notifications/firebase-status`);
    const firebaseStatus = firebaseStatusResponse.data;
    console.log('Firebase Status:', JSON.stringify(firebaseStatus, null, 2));
    console.log();

    // 3. Try to login and get workers with FCM tokens
    console.log('3. Checking workers with FCM tokens...');
    try {
      // Try different test credentials
      const testCredentials = [
        { email: 'test.user1@example.com', password: 'password123' },
        { email: 'worker@example.com', password: 'password123' },
        { email: 'admin@sevaq.com', password: 'admin123' }
      ];

      let authHeaders = null;
      let workers = [];

      for (const creds of testCredentials) {
        try {
          console.log(`Trying to login with ${creds.email}...`);
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, creds);
          const token = loginResponse.data.access_token;
          authHeaders = { Authorization: `Bearer ${token}` };
          console.log(`✅ Login successful with ${creds.email}`);

          // Get workers
          const workersResponse = await axios.get(`${BASE_URL}/workers`, { headers: authHeaders });
          workers = workersResponse.data;
          console.log(`Found ${workers.length} workers`);
          break;
        } catch (e) {
          console.log(`❌ Login failed for ${creds.email}: ${e.response?.status}`);
        }
      }

      if (!authHeaders) {
        console.log('❌ Could not login with any test credentials');
        return;
      }

      // Check workers with FCM tokens
      const workersWithTokens = workers.filter(w => w.fcmToken);
      console.log(`${workersWithTokens.length} workers have FCM tokens registered`);

      if (workersWithTokens.length > 0) {
        console.log('\nWorkers with FCM tokens:');
        workersWithTokens.forEach((worker, index) => {
          console.log(`${index + 1}. ID: ${worker.id}, Name: ${worker.name || 'N/A'}, FCM Token: ${worker.fcmToken.substring(0, 20)}...`);
        });

        // 4. Test FCM notification to first worker
        console.log('\n4. Testing FCM notification delivery...');
        const testWorker = workersWithTokens[0];
        console.log(`Testing with worker: ${testWorker.id} (${testWorker.name || 'N/A'})`);
        console.log(`FCM Token: ${testWorker.fcmToken.substring(0, 30)}...`);

        // Test direct FCM notification
        const notificationData = {
          fcmToken: testWorker.fcmToken,
          title: 'FCM Diagnostic Test',
          body: `Test notification sent at ${new Date().toISOString()}`,
          data: {
            type: 'diagnostic_test',
            testId: Date.now().toString(),
            workerId: testWorker.id
          }
        };

        console.log('Sending test notification...');
        const notificationResponse = await axios.post(
          `${BASE_URL}/notifications/test-fcm`,
          notificationData,
          { headers: authHeaders, timeout: 15000 }
        );

        console.log('✅ FCM test notification sent successfully');
        console.log('Response:', notificationResponse.data);

        // 5. Check recent bookings to see if notifications were sent
        console.log('\n5. Checking recent bookings for notification status...');
        try {
          const bookingsResponse = await axios.get(`${BASE_URL}/bookings?limit=10`, { headers: authHeaders });
          const bookings = bookingsResponse.data.bookings || bookingsResponse.data;

          if (bookings && bookings.length > 0) {
            console.log(`Found ${bookings.length} recent bookings:`);
            bookings.forEach((booking, index) => {
              const status = booking.notificationSent ? '✅ Notified' : '❌ Not notified';
              console.log(`${index + 1}. ID: ${booking.id}, Status: ${booking.status}, Notification: ${status}`);
            });
          } else {
            console.log('No recent bookings found');
          }
        } catch (e) {
          console.log(`Could not fetch bookings: ${e.message}`);
        }

      } else {
        console.log('❌ No workers have FCM tokens registered');
        console.log('This explains why notifications are not being received!');
        console.log('\nPossible causes:');
        console.log('1. Flutter apps are not registering FCM tokens with the backend');
        console.log('2. FCM token registration is failing due to authentication issues');
        console.log('3. Users are not logged in when FCM tokens are generated');
      }

    } catch (e) {
      console.log(`❌ Error during worker/FCM check: ${e.message}`);
    }

  } catch (error) {
    console.error('❌ Error during FCM diagnostics:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Add a test FCM endpoint to the notifications controller if it doesn't exist
async function addTestFCMEndpoint() {
  console.log('\n=== ADDING TEST FCM ENDPOINT ===');

  // This would require modifying the notifications controller
  // For now, we'll document what needs to be added

  console.log('To add a test FCM endpoint, add this to notifications.controller.ts:');
  console.log(`
@Post('test-fcm')
@UseGuards(JwtAuthGuard)
async testFcmNotification(@Request() req: JwtRequest, @Body() body: { fcmToken: string, title: string, body: string, data?: any }) {
  const success = await this.notificationsService.sendPushNotification(body.fcmToken, body.title, body.body, body.data);
  return { success, message: success ? 'Test notification sent' : 'Failed to send test notification' };
}
  `);
}

testFCMDiagnostics().then(() => {
  console.log('\n=== DIAGNOSTICS COMPLETE ===');
  addTestFCMEndpoint();
});