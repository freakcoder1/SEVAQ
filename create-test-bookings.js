const axios = require('axios');

async function createTestBookings() {
  try {
    // First, login to get an access token
    const loginResponse = await axios.post('http://127.0.0.1:45357/auth/login', {
      email: 'test.user1@example.com',
      password: 'password123'
    });
    
    const accessToken = loginResponse.data.accessToken;

    // Create a booking for tomorrow (T-24h reminder)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const booking1 = await axios.post(
      'http://127.0.0.1:45357/bookings',
      {
        userId: 18,
        serviceId: 1,
        workerId: 1,
        startTime: '08:00:00',
        endTime: '11:00:00',
        date: tomorrowStr,
        type: 'on_demand',
        notes: 'Test booking for T-24h reminder'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Test booking 1 created:', booking1.data);

    // Update booking status to confirmed
    await axios.patch(
      `http://127.0.0.1:45357/bookings/${booking1.data.id}`,
      {
        status: 'confirmed'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Get updated booking details
    const updatedBooking1 = await axios.get(
      `http://127.0.0.1:45357/bookings/${booking1.data.id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Test booking 1 updated to confirmed:', updatedBooking1.data);

    // Create a booking for today + 2 hours (T-2h reminder)
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const inFiveHours = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];

    const booking2 = await axios.post(
      'http://127.0.0.1:45357/bookings',
      {
        userId: 18,
        serviceId: 1,
        workerId: 1,
        startTime: inTwoHours.toTimeString().split(' ')[0].slice(0, 8),
        endTime: inFiveHours.toTimeString().split(' ')[0].slice(0, 8),
        date: todayStr,
        type: 'on_demand',
        notes: 'Test booking for T-2h reminder'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Test booking 2 created:', booking2.data);

    // Update booking status to confirmed
    await axios.patch(
      `http://127.0.0.1:45357/bookings/${booking2.data.id}`,
      {
        status: 'confirmed'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Get updated booking details
    const updatedBooking2 = await axios.get(
      `http://127.0.0.1:45357/bookings/${booking2.data.id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Test booking 2 updated to confirmed:', updatedBooking2.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createTestBookings();
