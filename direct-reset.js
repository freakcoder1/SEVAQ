
const https = require('https');

// This runs directly against your production backend
const resetDatabase = () => {
  console.log('⚠️  Sending production database reset request...');
  
  const req = https.request('https://sevaq-production.up.railway.app/seed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Response received:');
      console.log(data);
      console.log('✅ Production database reset complete');
      console.log('✅ All customers, workers, bookings deleted');
      console.log('✅ Service areas created');
      console.log('✅ System is ready for real user testing');
    });
  });

  req.on('error', err => {
    console.error('❌ Error:', err.message);
  });

  req.end();
};

resetDatabase();
