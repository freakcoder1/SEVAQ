/**
 * Flutter Worker App API Paths Test Script
 * Tests all worker-related endpoints from the Flutter worker app
 */

const BASE_URL = 'https://sevaq-production.up.railway.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RhZ2FpbkBzZXZhcS5jb20iLCJzdWIiOiJmOGY1OGVlNy02YzgwLTQzMDAtOWZmYy1mYjUwOTRhOWMxZDEiLCJyb2xlIjoid29ya2VyIiwiaWF0IjoxNzc0NzgzMjAzLCJleHAiOjE3NzQ4Njk2MDN9.OsbjpxosqyqtgJHED3mNLw07II7VGQ7qQMP5XXTX7Co';

async function testEndpoint(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.text();
    let json;
    try {
      json = JSON.parse(data);
    } catch {
      json = data;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: json
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Flutter Worker App API Paths Test');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const tests = [
    // Worker Profile Endpoints
    { name: 'GET /api/workers/me', path: '/api/workers/me', expectedStatus: [200] },
    { name: 'GET /api/workers/me/bookings', path: '/api/workers/me/bookings', expectedStatus: [200] },
    { name: 'GET /api/workers/me/earnings', path: '/api/workers/me/earnings', expectedStatus: [200] },
    
    // Booking Action Endpoints (POST - need real booking UUID)
    { name: 'POST /api/workers/bookings/:id/accept', path: '/api/workers/bookings/1/accept', method: 'POST', expectedStatus: [400, 404] },
    { name: 'POST /api/workers/bookings/:id/reject', path: '/api/workers/bookings/1/reject', method: 'POST', expectedStatus: [400, 404] },
    { name: 'POST /api/workers/bookings/:id/start', path: '/api/workers/bookings/1/start', method: 'POST', expectedStatus: [400, 404] },
    { name: 'POST /api/workers/bookings/:id/complete', path: '/api/workers/bookings/1/complete', method: 'POST', expectedStatus: [400, 404] },
    
    // Availability Endpoint
    { name: 'PATCH /api/workers/me/availability', path: '/api/workers/me/availability', method: 'PATCH', body: { isAvailable: true }, expectedStatus: [200] },
    
    // Auth Endpoints
    { name: 'POST /api/auth/login', path: '/api/auth/login', method: 'POST', body: { email: 'test@test.com', password: 'test123' } },
    { name: 'GET /api/auth/profile', path: '/api/auth/profile' },
    
    // Service Request Endpoints
    { name: 'GET /api/service-requests', path: '/api/service-requests' },
    { name: 'GET /api/service-requests/:id', path: '/api/service-requests/1' },
    
    // Categories
    { name: 'GET /api/categories', path: '/api/categories' },
    
    // Locations
    { name: 'GET /api/locations', path: '/api/locations' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const method = test.method || 'GET';
    console.log(`Testing: ${method} ${test.path}`);
    
    const result = await testEndpoint(method, test.path, test.body);
    
    if (result.error) {
      console.log(`  ❌ ERROR: ${result.error}`);
      failed++;
    } else if (result.ok || (test.expectedStatus && test.expectedStatus.includes(result.status))) {
      console.log(`  ✅ HTTP ${result.status} - OK`);
      passed++;
    } else {
      // Check if this test has expected status that includes the actual status
      if (test.expectedStatus && test.expectedStatus.includes(result.status)) {
        console.log(`  ✅ HTTP ${result.status} - OK (expected)`);
        passed++;
      } else {
        console.log(`  ⚠️  HTTP ${result.status}`);
        if (result.data && typeof result.data === 'object') {
          if (result.data.message) {
            console.log(`     Message: ${result.data.message}`);
          }
        }
        failed++;
      }
    }
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════');
}

runTests().catch(console.error);