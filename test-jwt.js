const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function main() {
  console.log('=== Testing JWT Token ===\n');
  
  // Step 1: Login
  console.log('1. Logging in...');
  const loginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify({email: 'admin@sevaq.com', password: 'Admin@123456'}).length
    }
  }, JSON.stringify({email: 'admin@sevaq.com', password: 'Admin@123456'}));
  
  if (!loginRes.data || !loginRes.data.access_token) {
    console.error('Login failed:', loginRes.data);
    return;
  }
  
  const token = loginRes.data.access_token;
  console.log('✅ Got token:', token.substring(0, 50) + '...\n');
  
  // Step 2: Try to access protected endpoint
  console.log('2. Accessing protected endpoint...');
  const workersRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/workers',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Status:', workersRes.status);
  console.log('Response:', JSON.stringify(workersRes.data).substring(0, 500));
  
  if (workersRes.status === 200) {
    console.log('\n✅ JWT authentication is working!');
  } else {
    console.log('\n❌ JWT authentication failed!');
  }
}

main().catch(console.error);
