// Test worker registration endpoint
const https = require('https');

const postData = JSON.stringify({
  phone: '9999888877',
  email: 'test_worker_new@test.com',
  password: 'Test1234!',
  firstName: 'Test',
  lastName: 'Worker'
});

const options = {
  hostname: 'sevaq-production.up.railway.app',
  port: 443,
  path: '/api/auth/workers/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();