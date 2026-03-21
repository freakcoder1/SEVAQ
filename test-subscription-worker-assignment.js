const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357/api';

async function login() {
  try {
    console.log('\n🔐 Logging in...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test.user1@example.com',
      password: 'password123',
    });
    
    if (response.data.access_token) {
      console.log('✅ Login successful');
      return response.data.access_token;
    }
    return null;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function getSubscriptions(userId, token) {
  try {
    console.log('\n📋 Getting subscriptions for user:', userId);
    
    const response = await axios.get(`${API_BASE}/subscriptions/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Subscriptions found:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting subscriptions:', error.response?.data?.message || error.message);
    return [];
  }
}

async function triggerScheduler(token) {
  try {
    console.log('\n🚀 Triggering subscription assignment scheduler...');
    
    const response = await axios.post(`${API_BASE}/subscriptions/admin/trigger-scheduler`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Scheduler triggered:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Error triggering scheduler:', error.response?.data?.message || error.message);
    return false;
  }
}

async function getSubscriptionDetails(subscriptionId, token) {
  try {
    console.log('\n📋 Getting subscription details:', subscriptionId);
    
    const response = await axios.get(`${API_BASE}/subscriptions/${subscriptionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Subscription:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error getting subscription:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runTest() {
  console.log('='.repeat(60));
  console.log('🧪 SUBSCRIPTION WORKER ASSIGNMENT TEST');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Login
    console.log('\n📍 Step 1: Logging in...');
    const token = await login();
    
    if (!token) {
      console.log('❌ Login failed');
      return;
    }
    
    // Step 2: Get user ID (numeric ID for user test.user1@example.com is 18)
    const userId = 18;
    
    // Step 3: Get subscriptions
    console.log('\n📍 Step 2: Checking subscriptions...');
    const subscriptions = await getSubscriptions(userId, token);
    
    if (subscriptions.length === 0) {
      console.log('\n❌ No subscriptions found. Please create a subscription first.');
      console.log('📝 Use the Flutter app or API to create a subscription.');
      return;
    }
    
    // Find an active subscription
    const activeSubscription = subscriptions.find(s => s.status === 'ACTIVE');
    
    if (!activeSubscription) {
      console.log('\n❌ No active subscriptions found.');
      return;
    }
    
    console.log('\n📍 Found active subscription:', activeSubscription.id);
    
    // Step 4: Trigger the scheduler
    console.log('\n📍 Step 3: Triggering scheduler...');
    await triggerScheduler(token);
    
    // Wait a bit for the scheduler to run
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Check if worker was assigned
    console.log('\n📍 Step 4: Checking worker assignment...');
    const updatedSubscription = await getSubscriptionDetails(activeSubscription.id, token);
    
    if (updatedSubscription && updatedSubscription.assignedWorker) {
      console.log('\n✅ SUCCESS! Worker assigned:');
      console.log('   Worker ID:', updatedSubscription.assignedWorker.id);
      console.log('   Worker Name:', updatedSubscription.assignedWorker.firstName, updatedSubscription.assignedWorker.lastName);
      console.log('\n📱 Now open the Flutter app to see the worker assignment banner!');
    } else if (updatedSubscription && updatedSubscription.assignedWorkerId) {
      console.log('\n✅ Worker assigned (ID:', updatedSubscription.assignedWorkerId, ')');
      console.log('\n📱 Open the Flutter app to see the worker assignment banner!');
    } else {
      console.log('\n⚠️ No worker assigned yet. Check the backend logs for details.');
      console.log('   The scheduler runs every minute and may take time to assign a worker.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

runTest();
