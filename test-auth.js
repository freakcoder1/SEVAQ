const axios = require('axios');
const apiUrl = 'http://127.0.0.1:45357/api';

async function testLogin() {
    try {
        console.log('Testing login with test user...');
        const response = await axios.post(`${apiUrl}/auth/login`, {
            email: 'test.user1@example.com',
            password: 'password123'
        });
        
        console.log('✅ Login successful');
        console.log('Token received:', response.data.access_token.substring(0, 50) + '...');
        console.log('User data:', response.data.user);
        
        // Test authenticated endpoint
        console.log('\nTesting authenticated endpoint...');
        const meResponse = await axios.get(`${apiUrl}/auth/profile`, {
            headers: {
                'Authorization': 'Bearer ' + response.data.access_token
            }
        });
        
        console.log('✅ Authenticated request successful');
        console.log('User profile:', meResponse.data);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('🔒 Authentication failed - check credentials');
        }
    }
}

testLogin();
