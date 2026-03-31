/**
 * Test all worker app endpoints after registration
 */

const https = require('https');

const BASE_URL = 'sevaq-production.up.railway.app';

// Use the token we got from registration
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3Rfd29ya2VyX25ld0B0ZXN0LmNvbSIsInN1YiI6IjllYTFkMzMzLTU0NTgtNDVlMS04YWMwLTA0NDE2NWFiYzJkNCIsInJvbGUiOiJ3b3JrZXIiLCJpYXQiOjE3NzQ3OTI0MDUsImV4cCI6MTc3NDg3ODgwNX0.0OPbqgf8ah5h0JP6nP4uxi0lGvLn3xXZAuW-cwqtTVo';

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

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${method} /api${path}`);
    if (body) console.log('Body:', JSON.stringify(body, null, 2));
    console.log('='.repeat(60));

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
        } catch {
          console.log('Response:', data);
        }
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 Testing Worker App Endpoints');
  console.log('Token:', TOKEN.substring(0, 50) + '...');

  try {
    // Test 1: Get worker profile
    await makeRequest('GET', '/workers/me', null, TOKEN);

    // Test 2: Get worker bookings
    await makeRequest('GET', '/workers/me/bookings', null, TOKEN);

    // Test 3: Get worker earnings
    await makeRequest('GET', '/workers/me/earnings', null, TOKEN);

    // Test 4: Update availability
    await makeRequest('PATCH', '/workers/me/availability', { isAvailable: true }, TOKEN);

    // Test 5: Try registration with same email (should fail with conflict)
    await makeRequest('POST', '/auth/workers/register', {
      phone: '9999888878',
      email: 'test_worker_new@test.com',
      password: 'Test1234!',
      firstName: 'Test2',
      lastName: 'Worker2'
    });

    console.log('\n✅ All endpoint tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

runTests();