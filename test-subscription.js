
const axios = require('axios');

// Function to create a test subscription
async function createTestSubscription() {
  try {
    console.log('🔐 Logging in...');
    // First, let's login to get a token
    const loginResponse = await axios.post('http://192.168.29.154:45357/auth/login', {
      email: 'test.user1@example.com',
      password: 'password123'
    });

    console.log('✅ Login successful');
    const token = loginResponse.data.access_token;
    const userId = loginResponse.data.user.id;

    console.log(`🔑 Token obtained: ${token.substring(0, 30)}...`);
    console.log(`👤 User ID: ${userId}`);

    // Now, create a subscription
    console.log('📝 Creating subscription...');
    const subscriptionResponse = await axios.post('http://192.168.29.154:45357/subscriptions', {
      serviceProfileId: 1, // Cook - Basic
      frequency: 'WEEKDAYS',
      timeWindowStart: '08:00',
      timeWindowEnd: '09:00',
      startDate: '2026-01-25',
      endDate: '2026-02-24'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Subscription created successfully:');
    console.log(subscriptionResponse.data);
  } catch (error) {
    console.error('❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Message:', error.message);
    }
    console.error('Config:', error.config);
  }
}

createTestSubscription();
