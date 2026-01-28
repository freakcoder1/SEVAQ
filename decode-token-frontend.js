const jwt = require('jsonwebtoken');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTUzODg2OSwiZXhwIjoxNzY5NTQyNDY5fQ.0w7Kzwf1SI81OT-jJIlBV64iuAtLViya4jpaLnzf_5M';

console.log('Decoding token:', token);

const decoded = jwt.decode(token);
console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
