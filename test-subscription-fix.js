const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357/api';

async function testSubscriptionFix() {
  try {
    // 1. Login to existing user
  const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
    email: 'test.user1@example.com',
    password: 'password123',
  });
  const token = loginResponse.data.access_token;
  const userResponse = loginResponse; // to maintain consistency
  console.log('✅ Logged in');

    // 2. Get service profiles
    const profilesResponse = await axios.get(`${API_BASE}/service-profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Service profiles:', profilesResponse.data);

    const firstProfileId = profilesResponse.data.data[0].id;

    // 3. Create subscription with location
    const subscriptionResponse = await axios.post(
      `${API_BASE}/subscriptions`,
      {
        serviceProfileId: firstProfileId,
        frequency: 'DAILY',
        timeWindowStart: '08:00:00',
        timeWindowEnd: '12:00:00',
        startDate: '2026-01-29', // Tomorrow
        location: {
          lat: 28.5804579,
          lng: 77.4392951,
          address: 'Test Location',
        },
        customDays: [1, 2, 3, 4, 5], // Monday to Friday
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log('✅ Subscription created:', subscriptionResponse.data);

    // 4. Verify the subscription has location
    console.log('✅ Subscription location:', subscriptionResponse.data.location);

    // 5. Check if service request was created with location
    const userSubscriptionsResponse = await axios.get(
      `${API_BASE}/subscriptions/user/${loginResponse.data.user.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log('✅ User subscriptions:', userSubscriptionsResponse.data);

    console.log('🎉 All tests passed!');
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

testSubscriptionFix();
