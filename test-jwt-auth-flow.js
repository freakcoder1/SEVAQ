/**
 * Test script to diagnose JWT authentication flow
 * Tests login, token decoding, and authenticated endpoint access
 */

const http = require('http');

const BASE_URL = 'http://127.0.0.1:45357';
const TEST_EMAIL = 'aryanjaiswal791@gmail.com';
const TEST_PASSWORD = 'testpassword123'; // Adjust if different

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Simple JWT decoder (no verification, just payload extraction)
function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let payload = parts[1];
    // Fix padding
    while (payload.length % 4 !== 0) {
      payload += '=';
    }
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Error decoding JWT:', e.message);
    return null;
  }
}

async function runTests() {
  console.log('=== JWT Authentication Flow Test ===\n');

  // Step 1: Test login
  console.log('Step 1: Testing login...');
  try {
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    console.log(`Login response status: ${loginResponse.statusCode}`);
    console.log('Login response body:', JSON.stringify(loginResponse.body, null, 2));

    if (loginResponse.statusCode !== 200 || !loginResponse.body?.access_token) {
      console.error('\n❌ LOGIN FAILED - Cannot proceed with auth tests');
      console.log('Trying to find existing user or create one...');
      return;
    }

    const token = loginResponse.body.access_token;
    console.log(`\n✅ Login successful! Token length: ${token.length}`);

    // Step 2: Decode the JWT token
    console.log('\nStep 2: Decoding JWT token...');
    const decoded = decodeJwt(token);
    if (decoded) {
      console.log('JWT Payload:', JSON.stringify(decoded, null, 2));
      console.log('- sub (userId):', decoded.sub);
      console.log('- email:', decoded.email);
      console.log('- role:', decoded.role);
      console.log('- iat:', decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'N/A');
      console.log('- exp:', decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A');
    } else {
      console.error('❌ Failed to decode JWT token');
      return;
    }

    // Step 3: Test authenticated endpoints
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test 3a: /api/notifications/all-bookings
    console.log('\nStep 3a: Testing /api/notifications/all-bookings...');
    const bookingsResponse = await makeRequest('GET', '/api/notifications/all-bookings', null, authHeaders);
    console.log(`Status: ${bookingsResponse.statusCode}`);
    console.log('Response:', JSON.stringify(bookingsResponse.body, null, 2).substring(0, 500));

    // Test 3b: /api/service-requests
    console.log('\nStep 3b: Testing GET /api/service-requests...');
    const serviceRequestsResponse = await makeRequest('GET', '/api/service-requests', null, authHeaders);
    console.log(`Status: ${serviceRequestsResponse.statusCode}`);
    console.log('Response:', JSON.stringify(serviceRequestsResponse.body, null, 2).substring(0, 500));

    // Test 3c: /api/subscriptions/user/{userId}
    const userId = decoded.sub;
    console.log(`\nStep 3c: Testing /api/subscriptions/user/${userId}...`);
    const subscriptionsResponse = await makeRequest(
      'GET',
      `/api/subscriptions/user/${userId}`,
      null,
      authHeaders
    );
    console.log(`Status: ${subscriptionsResponse.statusCode}`);
    console.log('Response:', JSON.stringify(subscriptionsResponse.body, null, 2).substring(0, 500));

    // Step 4: Test with wrong token format
    console.log('\nStep 4: Testing with wrong Authorization header format...');
    const wrongFormatHeaders = { Authorization: token }; // Missing "Bearer " prefix
    const wrongFormatResponse = await makeRequest('GET', '/api/notifications/all-bookings', null, wrongFormatHeaders);
    console.log(`Status with missing "Bearer " prefix: ${wrongFormatResponse.statusCode}`);

    // Step 5: Test with no token
    console.log('\nStep 5: Testing with no Authorization header...');
    const noAuthResponse = await makeRequest('GET', '/api/notifications/all-bookings');
    console.log(`Status with no auth header: ${noAuthResponse.statusCode}`);

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

runTests().catch(console.error);
