const axios = require('axios');

async function checkUpcomingBookings() {
    try {
        // Login
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post('http://127.0.0.1:45357/auth/login', {
            email: 'test.user1@example.com',
            password: 'password123'
        });
        
        console.log('✅ Login successful');
        const token = loginResponse.data.access_token;
        
        console.log('👤 User details:', loginResponse.data.user);
        
        // Check upcoming bookings
        console.log('\n📅 Getting upcoming bookings...');
        const upcomingResponse = await axios.get('http://127.0.0.1:45357/notifications/upcoming-bookings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 Response status:', upcomingResponse.status);
        console.log('📋 Response data:', JSON.stringify(upcomingResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

checkUpcomingBookings();
