// Create a test user and booking
const axios = require('axios');

const API_BASE = 'https://sevaq-production.up.railway.app/api';

const WORKER_EMAIL = 'brand_new_test_1774845295463@test.com';
const WORKER_PASSWORD = 'Test1234!';
const NEW_WORKER_ID = 16;

async function signup(email, phone, firstName, lastName, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/signup`, {
      email,
      phone,
      firstName,
      lastName,
      password
    });
    console.log('Signup successful');
    return response.data;
  } catch (error) {
    console.log('Signup error:', error.response?.data || error.message);
    return null;
  }
}

async function getToken(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return response.data.access_token;
  } catch (error) {
    return null;
  }
}

async function createServiceRequest(token, serviceId) {
  try {
    // Format date for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const response = await axios.post(`${API_BASE}/service-requests`,
      {
        serviceId: serviceId,
        date: tomorrow.toISOString(),
        timeWindow: '10:00-12:00', // Required field
        priceSnapshot: 500, // Required field
        notes: 'Test booking for worker flow verification',
        location: {
          address: '123 Test Street, Greater Noida',
          latitude: '28.58045790',
          longitude: '77.43929510'
        }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Service request created!');
    console.log('  Public ID:', response.data.publicId);
    console.log('  Status:', response.data.status);
    console.log('  Assigned Worker:', response.data.assignedWorkerId);
    return response.data;
  } catch (error) {
    console.log('Create service request error:', error.response?.data || error.message);
    return null;
  }
}

async function getWorkerBookings(token) {
  try {
    const response = await axios.get(`${API_BASE}/workers/me/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.log('Get bookings error:', error.response?.data || error.message);
    return [];
  }
}

async function main() {
  console.log('=== Creating test user and booking ===\n');
  
  // Generate unique test user
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testPhone = `999988${String(timestamp).slice(-4)}`;
  
  console.log('Creating test user:', testEmail);
  const user = await signup(testEmail, testPhone, 'Test', 'Customer', 'Test1234!');
  
  if (user && user.access_token) {
    console.log('\n✅ Test user created!');
    
    // Create service request for Home Cleaning (service ID 2)
    console.log('\n--- Creating service request for Home Cleaning ---');
    const serviceRequest = await createServiceRequest(user.access_token, 2);
    
    if (serviceRequest && serviceRequest.assignedWorkerId === NEW_WORKER_ID) {
      console.log('\n🎉 Booking was assigned to worker 16!');
    } else if (serviceRequest) {
      console.log('\n⚠️ Booking was assigned to worker:', serviceRequest.assignedWorkerId);
    }
    
    // Check worker bookings
    console.log('\n--- Checking worker 16 bookings ---');
    const workerToken = await getToken(WORKER_EMAIL, WORKER_PASSWORD);
    const bookings = await getWorkerBookings(workerToken);
    
    if (Array.isArray(bookings) && bookings.length > 0) {
      console.log('\n✅ FOUND', bookings.length, 'BOOKINGS!');
      console.log(JSON.stringify(bookings, null, 2));
    } else {
      console.log('\nNo bookings found for worker 16');
    }
  } else {
    console.log('Failed to create test user');
  }
}

main().catch(console.error);