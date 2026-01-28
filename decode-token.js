const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU4NTYyNCwiZXhwIjoxNzcyMTc3NjI0fQ.q0DQB8Ql1r_RzgClnXiUUbhj7StnFNsYCQvXo_yon_k';
const secret = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2';

try {
  const decoded = jwt.decode(token);
  console.log('📄 Decoded Token:');
  console.log(JSON.stringify(decoded, null, 2));

  const verified = jwt.verify(token, secret);
  console.log('✅ Token Verified:');
  console.log(JSON.stringify(verified, null, 2));
} catch (error) {
  console.error('❌ Error decoding/verifying token:', error);
}
