const axios = require('axios');

async function createTestBooking() {
    try {
        console.log('=== Creating Test Booking for Tomorrow ===');
        
        // Login
        const loginResponse = await axios.post('http://127.0.0.1:45357/auth/login', {
            email: 'test.user1@example.com',
            password: 'password123'
        });
        
        console.log('✅ Login successful');
        
        const token = loginResponse.data.access_token;
        
        // Create booking for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const bookingResponse = await axios.post('http://127.0.0.1:45357/bookings', {
            serviceId: 1,
            date: dateStr,
            startTime: '10:00:00',
            endTime: '13:00:00',
            notes: 'Test booking for PreServiceReminderBanner'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Booking created successfully');
        console.log('📄 Booking details:');
        console.log(JSON.stringify(bookingResponse.data, null, 2));
        
        // Update booking status to confirmed
        await axios.patch(`http://127.0.0.1:45357/bookings/${bookingResponse.data.id}`, {
            status: 'confirmed'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Booking status updated to confirmed');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

createTestBooking();
