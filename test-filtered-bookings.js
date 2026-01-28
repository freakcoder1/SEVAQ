const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357';

async function testFilteredBookings() {
    console.log('Testing filtered bookings for testuser2...');
    
    try {
        // 1. Login as testuser2
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'test.user2@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Login successful. Token received');
        
        // 2. Get all bookings for user (not just upcoming reminders)
        const allBookingsResponse = await axios.get(`${API_BASE}/bookings?userId=19`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ All bookings received');
        console.log('📦 Number of bookings:', allBookingsResponse.data.length);
        
        // 3. Verify all bookings belong to testuser2
        const userEmails = new Set();
        allBookingsResponse.data.forEach(booking => {
            userEmails.add(booking.user.email);
        });
        
        console.log('👥 Unique user emails in bookings:', [...userEmails]);
        
        if (allBookingsResponse.data.length === 0) {
            console.log('✅ SUCCESS: No bookings found (which is expected if no bookings exist for testuser2)');
        } else if (userEmails.size === 1 && [...userEmails][0] === 'test.user2@example.com') {
            console.log('✅ SUCCESS: All bookings belong to testuser2');
        } else {
            console.log('❌ FAILURE: Bookings include other users');
        }
        
        // 4. Log booking details
        console.log('\n📋 Booking details:');
        allBookingsResponse.data.forEach(booking => {
            console.log(`- Booking ${booking.publicId}: ${booking.service.name} on ${booking.date} at ${booking.startTime}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run test
testFilteredBookings();
