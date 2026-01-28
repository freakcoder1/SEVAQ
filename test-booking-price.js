const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357';
const USER_EMAIL = 'test.user1@example.com';
const USER_PASSWORD = 'password123';

async function login() {
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASSWORD
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function createBooking(token) {
    try {
        console.log('Creating booking with service request...');
        const response = await axios.post(`${API_BASE}/bookings`, {
            serviceId: 1,
            userId: 25,
            workerId: 15,
            startTime: new Date('2026-01-25T08:00:00Z'),
            endTime: new Date('2026-01-25T11:00:00Z'),
            notes: 'Test booking to check price calculation'
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Booking created:', response.data);
        console.log('Total Amount:', response.data.totalAmount);
    } catch (error) {
        console.error('Booking creation failed:', error.response?.data || error.message);
    }
}

async function main() {
    console.log('=== Testing Booking Price Calculation ===');
    const token = await login();
    await createBooking(token);
}

main();
