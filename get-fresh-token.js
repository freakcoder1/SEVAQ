const http = require('http');

const data = JSON.stringify({ email: 'test.user1@example.com', password: 'password123' });

const req = http.request({
  hostname: '127.0.0.1',
  port: 45357,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      if (json.access_token) {
        console.log('NEW_TOKEN:', json.access_token);
      } else {
        console.log('Login failed:', body);
      }
    } catch (e) {
      console.log('Error:', body);
    }
  });
});
req.write(data);
req.end();
