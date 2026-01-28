const http = require('http');

console.log('Testing signup...');

const data = JSON.stringify({
  email: 'test@example.com',
  password: 'Test@123',
  firstName: 'Test',
  lastName: 'User'
});

const options = {
  hostname: '127.0.0.1',
  port: 45357,
  path: '/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`\n✅ Status Code: ${res.statusCode}`);
  console.log(`\n✅ Response Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(responseData);
      console.log('\n✅ Response Data:');
      console.log(JSON.stringify(parsedData, null, 2));
      
      if (parsedData && parsedData.access_token) {
        console.log(`\n✅ Signup successful! Token: ${parsedData.access_token}`);
      }
    } catch (error) {
      console.log(`\n⚠️ Failed to parse JSON response: ${error.message}`);
      console.log(`\nRaw Response: ${responseData}`);
    }
  });
});

req.on('error', (error) => {
  console.log(`\n❌ Signup failed:`);
  console.error(error);
});

req.write(data);
req.end();