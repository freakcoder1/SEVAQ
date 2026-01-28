const axios = require('axios');

async function testServiceRequest() {
    try {
        const baseUrl = 'http://127.0.0.1:45357';
        
        // Check health endpoint
        const healthResponse = await axios.get(`${baseUrl}/health`);
        console.log('Health endpoint:', healthResponse.status, healthResponse.data);
        
        // Check system readiness
        const readinessResponse = await axios.get(`${baseUrl}/system/readiness`);
        console.log('System readiness:', readinessResponse.status, readinessResponse.data);
        
        // Log in to get token
        console.log('\nLogging in to get token...');
        const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
            email: 'test3@example.com',
            password: 'Test@123'
        });
        const token = loginResponse.data.access_token;
        console.log('Login successful. Token received');
        
        // Create a service request with a future date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        console.log('\nTesting service request creation with future date:', tomorrowStr);
        const testRequest = {
            serviceId: 1,
            date: tomorrowStr,
            timeWindow: 'morning',
            priceSnapshot: 150.00
        };
        
        const response = await axios.post(`${baseUrl}/service-requests`, testRequest, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('Success! Service request created:', response.data);
        
        return true;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return false;
    }
}

testServiceRequest().then(success => {
    console.log('\n=== Test Complete ===');
    console.log('Service requests endpoint is', success ? 'working' : 'not working');
});
