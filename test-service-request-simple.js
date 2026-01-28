const http = require('http');

console.log('Testing service request creation...');

const data = JSON.stringify({
  serviceId: 1,
  date: '2026-01-17',
  timeWindow: 'morning',
  priceSnapshot: 100,
  location: {
    lat: 28.5804579,
    lng: 77.4392951,
    address: 'Test address near workers'
  }
});

const options = {
  hostname: '127.0.0.1',
  port: 45357,
  path: '/service-requests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QyQGV4YW1wbGUuY29tIiwic3ViIjoyMiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njg1ODE5NTMsImV4cCI6MTc2ODU4NTU1M30.a__HjLHnAa1YLExMdxuCT58gIWFNJ5YB3iSUNYOaJZ0'
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
      
      if (parsedData && parsedData.id) {
        console.log(`\n✅ Service request created successfully! ID: ${parsedData.id}`);
      }
    } catch (error) {
      console.log(`\n⚠️ Failed to parse JSON response: ${error.message}`);
      console.log(`\nRaw Response: ${responseData}`);
    }
  });
});

req.on('error', (error) => {
  console.log(`\n❌ Service request failed:`);
  console.error(error);
});

req.write(data);
req.end();