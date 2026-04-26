const axios = require('axios');

// Test user credentials - need to get a valid token
const TEST_USER_PHONE = '+919876543210'; // From earlier conversation
const TEST_USER_OTP = '123456'; // OTP would need to be verified

// Use an existing token from earlier tests (may be expired)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTYwMzc2OSwiZXhwIjoxNzcyMTk1NzY5fQ.jp7kgDT_cViHbsE5D2-uUxXywsHJx74awkmWyuCdr20';

async function testCookingSubscription() {
    try {
        console.log('🔍 Testing cooking subscription with serviceProfileId=null...');
        
        // Create a cooking subscription with customPlanData but NO serviceProfileId
        const response = await axios.post('http://localhost:3000/api/subscriptions', {
            // No serviceProfileId - should trigger the fix
            serviceProfileId: null,
            frequency: 'WEEKLY',
            timeWindowStart: '09:00',
            timeWindowEnd: '13:00',
            startDate: '2026-04-27',
            // Custom plan data with cooking service type
            customPlanData: {
                serviceType: 'cooking', // Frontend sends lowercase
                persons: 3,
                mealPlan: 'full_day'
            },
            location: {
                lat: 28.5804,
                lng: 77.4393,
                address: '123 Test Street, Greater Noida'
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });

        console.log('✅ Subscription created successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Check the serviceProfileId in the response
        const subscription = response.data;
        console.log('\n🔍 Verification:');
        console.log(`Subscription ID: ${subscription.id}`);
        console.log(`Service Profile ID: ${subscription.serviceProfileId}`);
        console.log(`Custom Plan Data: ${JSON.stringify(subscription.customPlanData)}`);
        
        // Now fetch the subscription to see the service profile details
        if (subscription.id) {
            const getResponse = await axios.get(`http://localhost:3000/api/subscriptions/${subscription.id}`, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                }
            });
            console.log('\n📋 Full subscription details:');
            console.log(JSON.stringify(getResponse.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error testing subscription fix:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testCookingSubscription();
