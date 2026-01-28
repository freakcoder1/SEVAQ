const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testUpcomingBookings() {
  try {
    const token = jwt.sign({ 
      email: 'test.user1@example.com', 
      sub: 18, 
      role: 'user' 
    }, 'supersecretkey', { expiresIn: '1h' });

    console.log('Generated token:', token);

    const response = await axios.get('http://localhost:45357/notifications/upcoming-bookings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Upcoming bookings count:', response.data.count);
    console.log('Bookings:', JSON.stringify(response.data.bookings, null, 2));

    // Check if any bookings are upcoming
    if (response.data.count > 0) {
      console.log('\n✅ Upcoming bookings found');
    } else {
      console.log('\n❌ No upcoming bookings found');
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testUpcomingBookings();
