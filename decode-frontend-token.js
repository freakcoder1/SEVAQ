const jwt = require('jsonwebtoken');

// Token from frontend log: eyJhbGciOiJIUzI1NiIs... (truncated)
// Let's assume the full token is the one we just got from the test:
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU4NDM2MiwiZXhwIjoxNzcyMTc2MzYyfQ.J7a_g7Z4h6vLZNdmNgI9XNH25OBBesCZVGDBsbEp2RI';

try {
  const decoded = jwt.decode(token);
  console.log('📄 Decoded Token:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('❌ Error decoding token:', error);
}
