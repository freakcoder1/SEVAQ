const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:45357/api';

async function testSubscriptionFrontendFlow() {
  console.log('🔍 Testing Subscription Frontend Flow...\n');

  try {
    // Step 1: Login with test user
    console.log('1. Logging in with test user');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test.user1@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.access_token;
    const userId = loginResponse.data.user.id;
    console.log(`✅ Login successful! User ID: ${userId}`);
    console.log(`✅ Token: ${token.substring(0, 30)}...`);
    console.log();

    // Step 2: Get all service profiles
    console.log('2. Getting all service profiles');
    const profilesResponse = await axios.get(`${API_BASE_URL}/service-profiles`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`✅ Success! ${profilesResponse.data.data.length} profiles found`);
    console.log('✅ Profiles:');
    profilesResponse.data.data.forEach(profile => {
      console.log(`   - ${profile.serviceType} ${profile.profileName}: ₹${profile.monthlyPrice}/month`);
    });
    console.log();

    // Step 3: Get cooking profiles specifically
    console.log('3. Getting cooking profiles');
    const cookingProfilesResponse = await axios.get(`${API_BASE_URL}/service-profiles?serviceType=COOK`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`✅ Success! ${cookingProfilesResponse.data.data.length} cooking profiles found`);
    cookingProfilesResponse.data.data.forEach(profile => {
      console.log(`   - ${profile.profileName}: ${profile.description} (₹${profile.monthlyPrice}/month)`);
    });
    console.log();

    // Step 4: Create a subscription with a cooking profile
    console.log('4. Creating a subscription');
    const cookingProfile = cookingProfilesResponse.data.data[0]; // Select first cooking profile
    const createSubscriptionResponse = await axios.post(
      `${API_BASE_URL}/subscriptions`,
      {
        serviceProfileId: cookingProfile.id,
        frequency: 'WEEKDAYS',
        timeWindowStart: '08:00',
        timeWindowEnd: '09:00',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customDays: [1, 2, 3, 4, 5]
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log(`✅ Success! Subscription created: #${createSubscriptionResponse.data.id}`);
    console.log('✅ Subscription details:');
    console.log(`   - Service: ${cookingProfile.serviceType} ${cookingProfile.profileName}`);
    console.log(`   - Frequency: ${createSubscriptionResponse.data.frequency}`);
    console.log(`   - Time: ${createSubscriptionResponse.data.timeWindowStart} - ${createSubscriptionResponse.data.timeWindowEnd}`);
    console.log(`   - Price: ₹${createSubscriptionResponse.data.monthlyPriceSnapshot}/month`);
    console.log(`   - Status: ${createSubscriptionResponse.data.status}`);
    console.log();

    // Step 5: Get user's subscriptions
    console.log('5. Getting user subscriptions');
    const userSubscriptionsResponse = await axios.get(
      `${API_BASE_URL}/subscriptions/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log(`✅ Success! ${userSubscriptionsResponse.data.length} active subscriptions found`);
    console.log();

    // Step 6: Verify the subscription is in active state
    console.log('6. Verifying subscription status');
    const subscriptionId = createSubscriptionResponse.data.id;
    const subscriptionResponse = await axios.get(
      `${API_BASE_URL}/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log(`✅ Status: ${subscriptionResponse.data.status}`);
    if (subscriptionResponse.data.status === 'ACTIVE') {
      console.log('✅ Subscription is active - ready to use!');
    } else {
      console.log('❌ Subscription is not active');
    }
    console.log();

    // Step 7: Verify the price matches the profile's monthly price
    console.log('7. Verifying subscription price');
    const priceMatch = subscriptionResponse.data.monthlyPriceSnapshot === cookingProfile.monthlyPrice;
    console.log(`✅ Price check: ${priceMatch ? 'MATCH' : 'MISMATCH'}`);
    if (priceMatch) {
      console.log(`   - Profile price: ₹${cookingProfile.monthlyPrice}`);
      console.log(`   - Subscription price: ₹${subscriptionResponse.data.monthlyPriceSnapshot}`);
    }
    console.log();

    console.log('🎉 All frontend flow tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testSubscriptionFrontendFlow();
