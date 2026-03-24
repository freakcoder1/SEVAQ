const http = require('http');

console.log('Testing one-time on-demand service request creation...');

const data = JSON.stringify({
  userId: "83579b6b-8bd4-4659-99dc-8b552f228804",
  serviceId: 1,
  date: '2026-03-24',
  timeWindow: 'morning',
  priceSnapshot: 1500,
  location: {
    lat: 28.578271,
    lng: 77.4392025,
    address: 'Supertech Eco village-1, Greater Noida, Uttar Pradesh, India'
  },
  source: 'ONE_TIME'
});

const options = {
  hostname: '127.0.0.1',
  port: 45357,
  path: '/api/service-requests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU1NjkyOCwiZXhwIjoxNzY5NTYwNTI4fQ.mxkr6QKANlcs_Ska4XgqMKG28940sVeAaUu5hC9R3jo'
  }
};

const req = http.request(options, (res) => {
  console.log(`\n✅ Status Code: ${res.statusCode}`);
  
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
