const jwt = require('jsonwebtoken');

// Token from frontend
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTUzODg2OSwiZXhwIjoxNzY5NTQyNDY5fQ.0w7Kzwf1SI81OT-jJIlBV64iuAtLViya4jpaLnzf_5M';

// Secret from backend's .env file
const secret = 'your_jwt_secret_key_here';

console.log('Testing JWT Validation:');
console.log('========================');
console.log('Token:', token);
console.log('Secret:', secret);
console.log('========================');

try {
  const decoded = jwt.verify(token, secret);
  console.log('✅ Token is valid');
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (err) {
  console.log('❌ Token is invalid');
  console.log('Error:', err.message);
}