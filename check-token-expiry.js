const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTUzODg2OSwiZXhwIjoxNzY5NTQyNDY5fQ.0w7Kzwf1SI81OT-jJIlBV64iuAtLViya4jpaLnzf_5M';
const jwt = require('jsonwebtoken');

const decoded = jwt.decode(token);

console.log('Token issued at (iat):', new Date(decoded.iat * 1000));
console.log('Token expires at (exp):', new Date(decoded.exp * 1000));
console.log('Current time:', new Date());
console.log('Token is expired:', Date.now() > decoded.exp * 1000);