const axios = require('axios');
const { exec } = require('child_process');

const API_BASE_URL = 'http://127.0.0.1:45357/api';
const TEST_USER = {
    email: 'test.user1@example.com',
    password: 'password123'
};

async function testSubscriptionScheduler() {
    console.log('🔍 Testing Subscription Scheduler...\n');
    
    try {
        // Login to get token
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        
        const token = loginResponse.data.access_token;
        const userId = loginResponse.data.user.id;
        
        console.log('✅ Login successful');
        console.log('🔑 Token obtained:', token.substring(0, 30) + '...');
        console.log('👤 User ID:', userId);
        
        // Create a test subscription
        console.log('\n📝 Creating a test subscription...');
        const createSubscriptionResponse = await axios.post(`${API_BASE_URL}/subscriptions`, {
            serviceProfileId: 1, // Cooking Basic
            frequency: 'WEEKDAYS',
            timeWindowStart: '08:00',
            timeWindowEnd: '09:00',
            startDate: new Date().toISOString().split('T')[0],
            customDays: null
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const subscriptionId = createSubscriptionResponse.data.id;
        console.log('✅ Subscription created successfully');
        console.log('📦 Subscription details:', createSubscriptionResponse.data);
        
        // Verify that the subscription is active
        console.log('\n🔍 Verifying subscription status...');
        const getSubscriptionResponse = await axios.get(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (getSubscriptionResponse.data.status === 'ACTIVE') {
            console.log('✅ Subscription is active');
        } else {
            console.error('❌ Subscription is not active');
            process.exit(1);
        }
        
        // Cleanup: Cancel the test subscription
        console.log('\n🗑️ Canceling test subscription...');
        await axios.put(`${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Test subscription canceled successfully');
        
        // Verify that the subscription is canceled
        const canceledSubscriptionResponse = await axios.get(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (canceledSubscriptionResponse.data.status === 'CANCELLED') {
            console.log('✅ Subscription is canceled');
        } else {
            console.error('❌ Subscription is not canceled');
            process.exit(1);
        }
        
        console.log('\n🎉 All subscription tests passed!');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data?.message || error.message);
        console.error('📦 Full error response:', error.response?.data);
        process.exit(1);
    }
}

testSubscriptionScheduler();
