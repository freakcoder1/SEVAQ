/**
 * Test worker registration with a brand new user
 */

const https = require('https');

const BASE_URL = 'sevaq-production.up.railway.app';

// Generate unique email
const uniqueId = Date.now();
const testEmail = `brand_new_test_${uniqueId}@test.com`;
const testPhone = `9999888${String(uniqueId).slice(-4)}`;

console.log('Creating new test user:');
console.log('Email:', testEmail);
console.log('Phone:', testPhone);

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: BASE_URL,
      port: 443,
      path: `/api${path}`,
      method,
      headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTest() {
  try {
    // Step 1: Signup as a new user
    console.log('\n=== Step 1: Creating new user ===');
    const signupResult = await makeRequest('POST', '/auth/signup', {
      email: testEmail,
      password: 'Test1234!',
      phone: testPhone,
      firstName: 'Brand',
      lastName: 'NewTest'
    });
    
    console.log('Signup status:', signupResult.status);
    console.log('Signup response:', JSON.stringify(signupResult.data, null, 2));
    
    if (!signupResult.data.access_token) {
      console.log('\n❌ Signup failed - no access token');
      return;
    }
    
    const token = signupResult.data.access_token;
    
    // Step 2: Try to create worker profile
    console.log('\n=== Step 2: Creating worker profile ===');
    const registerResult = await makeRequest('POST', '/workers/me/register', {
      bio: 'Test bio for new worker',
      serviceIds: [],
      latitude: 28.5804579,
      longitude: 77.4392951
    }, token);
    
    console.log('Registration status:', registerResult.status);
    console.log('Registration response:', JSON.stringify(registerResult.data, null, 2));
    
    if (registerResult.status === 200 || registerResult.status === 201) {
      console.log('\n✅ Worker registration SUCCESS!');
    } else {
      console.log('\n❌ Worker registration FAILED with status:', registerResult.status);
    }
    
    // Step 3: Get bookings
    console.log('\n=== Step 3: Getting bookings ===');
    const bookingsResult = await makeRequest('GET', '/workers/me/bookings', null, token);
    console.log('Bookings status:', bookingsResult.status);
    console.log('Bookings:', JSON.stringify(bookingsResult.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

runTest();