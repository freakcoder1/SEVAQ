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

async function createServiceRequest(token) {
    try {
        const response = await axios.post(`${API_BASE}/service-requests`, {
            serviceId: 1,
            date: '2026-01-26',
            timeWindow: 'morning',
            location: {
                lat: 28.5804579,
                lng: 77.4392951,
                address: 'Greater Noida, Bisrakh Jalalpur, Uttar Pradesh, India'
            },
            priceSnapshot: 1500
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Service Request Created:', response.data);
        return response.data.requestId;
    } catch (error) {
        console.error('Service Request creation failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function createBooking(token, serviceRequestId) {
    try {
        const response = await axios.post(`${API_BASE}/bookings`, {
            serviceRequestId: serviceRequestId
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Booking Created:', response.data);
        console.log('Total Amount:', response.data.totalAmount);
    } catch (error) {
        console.error('Booking creation failed:', error.response?.data || error.message);
    }
}

async function main() {
    console.log('=== Testing Booking with Service Request ===');
    const token = await login();
    const serviceRequestId = await createServiceRequest(token);
    await createBooking(token, serviceRequestId);
}

main();
