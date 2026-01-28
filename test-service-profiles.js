const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:45357/api';
const TEST_USER = {
    email: 'test.user1@example.com',
    password: 'password123'
};

async function testServiceProfiles() {
    console.log('🔍 Testing Service Profiles API...\n');
    
    try {
        // Login to get token
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        
        console.log('✅ Login successful');
        console.log('📦 Login response:', loginResponse.data);
        
        const token = loginResponse.data.access_token;
        const userId = loginResponse.data.user.id;
        
        console.log('🔑 Token obtained:', token.substring(0, 30) + '...');
        console.log('👤 User ID:', userId);
        
        // Get all service profiles
        console.log('\n📋 Fetching all service profiles...');
        const profilesResponse = await axios.get(`${API_BASE_URL}/service-profiles`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Service profiles retrieved successfully');
        console.log('📊 Response data:', profilesResponse.data);
        
        // Check if data is an array
        let profiles = [];
        if (Array.isArray(profilesResponse.data)) {
            profiles = profilesResponse.data;
        } else if (profilesResponse.data.data) {
            profiles = profilesResponse.data.data;
        }
        
        console.log(`📊 Number of profiles: ${profiles.length}`);
        
        // Log profiles with details
        console.log('\n📄 Profile details:');
        profiles.forEach(profile => {
            console.log(`\n- ${profile.profileName} (${profile.serviceType})`);
            console.log(`  Description: ${profile.description}`);
            console.log(`  Scope: ${profile.scopeDefinition}`);
            console.log(`  Capacity: ${profile.maxCapacityHint}`);
            console.log(`  Price: ₹${profile.monthlyPrice}`);
            console.log(`  Active: ${profile.isActive}`);
        });
        
        // Get cooking profiles
        console.log('\n🍳 Cooking profiles:');
        const cookingProfiles = profiles.filter(p => p.serviceType === 'COOK');
        cookingProfiles.forEach(profile => {
            console.log(`  - ${profile.profileName}: ₹${profile.monthlyPrice}/month`);
        });
        
        // Get cleaning profiles
        console.log('\n🧹 Cleaning profiles:');
        const cleaningProfiles = profiles.filter(p => p.serviceType === 'CLEANING');
        cleaningProfiles.forEach(profile => {
            console.log(`  - ${profile.profileName}: ₹${profile.monthlyPrice}/month`);
        });
        
        // Test profile retrieval by ID
        if (profiles.length > 0) {
            const firstProfileId = profiles[0].id;
            console.log(`\n🔍 Testing profile retrieval by ID: ${firstProfileId}`);
            const singleProfileResponse = await axios.get(`${API_BASE_URL}/service-profiles/${firstProfileId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Profile retrieved successfully');
            console.log('📦 Single profile response:', singleProfileResponse.data);
        }
        
        console.log('\n🎉 All service profiles tests passed!');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data?.message || error.message);
        console.error('📦 Full error response:', error.response?.data);
        process.exit(1);
    }
}

testServiceProfiles();
