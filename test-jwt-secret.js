const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Test 1: Try to read JWT_SECRET from .env file
const envPath = path.join(__dirname, '.env');
console.log('Looking for .env file at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('.env file found');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    let jwtSecret = null;
    
    for (const line of lines) {
        if (line.trim().startsWith('JWT_SECRET=')) {
            jwtSecret = line.split('=')[1].trim();
            break;
        }
    }
    
    if (jwtSecret) {
        console.log('JWT_SECRET from .env:', jwtSecret.substring(0, 20) + '...');
    } else {
        console.log('JWT_SECRET not found in .env file');
    }
} else {
    console.log('.env file NOT found');
}

console.log('---');

// Test 2: Try to generate a new token with different secrets
const testPayload = { email: 'test.user1@example.com', sub: 18, role: 'user' };
console.log('Test payload:', testPayload);

// Test with secret from .env
const dotenvSecret = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2';
try {
    const token1 = jwt.sign(testPayload, dotenvSecret, { expiresIn: '30d' });
    console.log('Token generated with dotenv secret:', token1);
    console.log('Token length:', token1.length);
} catch (error) {
    console.error('Error generating token with dotenv secret:', error);
}

console.log('---');

// Test with default secret from NestJS (if it falls back)
const nestDefaultSecret = 'secret';
try {
    const token2 = jwt.sign(testPayload, nestDefaultSecret, { expiresIn: '30d' });
    console.log('Token generated with default secret:', token2);
    console.log('Token length:', token2.length);
} catch (error) {
    console.error('Error generating token with default secret:', error);
}

console.log('---');

// Test decoding the current token to verify it matches our payload
const currentToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU4NTYyNCwiZXhwIjoxNzcyMTc3NjI0fQ.q0DQB8Ql1r_RzgClnXiUUbhj7StnFNsYCQvXo_yon_k';
try {
    const decoded = jwt.decode(currentToken);
    console.log('Current token decoded payload:', decoded);
} catch (error) {
    console.error('Error decoding current token:', error);
}
