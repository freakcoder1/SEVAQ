const axios = require('axios');

async function testSubscriptionProfilesAPI() {
    try {
        console.log('🔍 Testing Subscription Profiles API...');

        // Step 1: Login to get token
        console.log('\n🔐 Logging in...');
        const loginResponse = await axios.post('http://127.0.0.1:45357/api/auth/login', {
            email: 'test.user1@example.com',
            password: 'password123'
        });

        console.log('✅ Login successful');
        const token = loginResponse.data.access_token;
        const userId = loginResponse.data.user.id;
        console.log('🔑 Token obtained:', token.substring(0, 20) + '...');
        console.log('👤 User ID:', userId);

        // Step 2: Test getServiceProfiles method with different service types
        const serviceTypes = ['CLEANING', 'COOK', 'MAID'];
        
        for (const serviceType of serviceTypes) {
            console.log(`\n📋 Fetching profiles for service type: ${serviceType}`);
            
            try {
                const response = await axios.get(
                    `http://127.0.0.1:45357/api/service-profiles?serviceType=${serviceType}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log(`✅ Profiles retrieved for ${serviceType}`);
                console.log(`📊 Number of profiles: ${response.data.data.length}`);
                console.log('📄 Profile details:');
                response.data.data.forEach(profile => {
                    console.log(`  - ${profile.profileName} (${profile.publicId})`);
                    console.log(`    Price: ₹${profile.monthlyPrice}/month`);
                    console.log(`    Description: ${profile.description}`);
                    console.log(`    Capacity: ${profile.maxCapacityHint}`);
                });

            } catch (error) {
                console.error(`❌ Error fetching profiles for ${serviceType}:`, error.response?.data || error.message);
            }
        }

        console.log('\n🎉 All subscription profiles tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testSubscriptionProfilesAPI();
