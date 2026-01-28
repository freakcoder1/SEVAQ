const jwt = require('jsonwebtoken');
const fs = require('fs');

// Read token from token.txt file
const token = fs.readFileSync('token.txt', 'utf8').trim();

try {
  const decoded = jwt.decode(token);
  console.log('📄 Decoded Token from Frontend:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('❌ Error decoding token:', error);
}
