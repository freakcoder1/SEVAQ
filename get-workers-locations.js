const http = require('http');

console.log('Fetching workers from backend...');

const options = {
  hostname: '127.0.0.1',
  port: 45357,
  path: '/workers',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QyQGV4YW1wbGUuY29tIiwic3ViIjoyMiwicm9sZSI6InVzZXIiLCJpYXQiOjE3Njg1ODE5NTMsImV4cCI6MTc2ODU4NTU1M30.a__HjLHnAa1YLExMdxuCT58gIWFNJ5YB3iSUNYOaJZ0'
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
      const workers = JSON.parse(responseData);
      console.log('\n✅ Workers:');
      workers.forEach(worker => {
        console.log(`\nWorker ${worker.id}: ${worker.name}`);
        console.log(`  Location: (${worker.lat}, ${worker.lng})`);
        console.log(`  Service ID: ${worker.serviceId}`);
      });
    } catch (error) {
      console.log(`\n⚠️ Failed to parse JSON response: ${error.message}`);
      console.log(`\nRaw Response: ${responseData}`);
    }
  });
});

req.on('error', (error) => {
  console.log(`\n❌ Failed to fetch workers:`);
  console.error(error);
});

req.end();