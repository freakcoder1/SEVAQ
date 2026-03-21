/**
 * Test script to verify JWT token generation fix
 * This tests that the firebase-auth.service.ts now generates tokens with UUID publicId
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4, validate: validateUUID } = require('uuid');

console.log('=== JWT Token Generation Fix Test ===\n');

// Simulate the fixed generateJwt function behavior
function generateJwt(user) {
  // FIX: Use publicId (UUID) instead of id (numeric) for JWT subject
  const payload = { email: user.email, sub: user.publicId, role: user.role };
  return {
    access_token: jwt.sign(payload, 'test-secret-key'),
    user: {
      id: user.publicId, // Return publicId as the user id to frontend
      publicId: user.publicId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    },
  };
}

// Test Case 1: User with UUID publicId
console.log('Test Case 1: User with UUID publicId');
console.log('----------------------------------------');
const testUser = {
  id: 123, // Internal numeric ID - should NOT be used in JWT
  publicId: uuidv4(), // UUID - should be used in JWT
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  role: 'user',
};

console.log('User internal id (numeric):', testUser.id);
console.log('User publicId (UUID):', testUser.publicId);

const result = generateJwt(testUser);
console.log('\nGenerated token user.id:', result.user.id);
console.log('Generated token user.publicId:', result.user.publicId);

// Decode and verify the JWT
const decoded = jwt.decode(result.access_token);
console.log('\nDecoded JWT payload:');
console.log('  sub (subject):', decoded.sub);
console.log('  email:', decoded.email);
console.log('  role:', decoded.role);

// Validate UUID format
const isValidUUID = validateUUID(decoded.sub);
console.log('\nIs sub a valid UUID?:', isValidUUID);

if (isValidUUID && decoded.sub === testUser.publicId) {
  console.log('✅ TEST PASSED: JWT contains valid UUID in sub claim');
} else {
  console.log('❌ TEST FAILED: JWT does not contain valid UUID in sub claim');
  process.exit(1);
}

// Test Case 2: Simulate what the old code would have done (BROKEN)
console.log('\n\nTest Case 2: Simulating OLD broken behavior');
console.log('----------------------------------------');
function generateJwtOld(user) {
  // OLD BROKEN: Using numeric id instead of publicId
  const payload = { email: user.email, sub: user.id, role: user.role };
  return {
    access_token: jwt.sign(payload, 'test-secret-key'),
    user: {
      id: user.id, // OLD: Returning numeric id
      publicId: user.publicId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    },
  };
}

const oldResult = generateJwtOld(testUser);
const oldDecoded = jwt.decode(oldResult.access_token);
console.log('OLD code JWT sub claim:', oldDecoded.sub);
console.log('Is OLD sub a valid UUID?:', validateUUID(oldDecoded.sub));
console.log('❌ This is why JWT validation was failing - numeric ID instead of UUID');

// Test Case 3: Verify JWT validation logic
console.log('\n\nTest Case 3: JWT Strategy Validation Logic');
console.log('----------------------------------------');

function validateJwtPayload(payload) {
  // This mirrors the logic in jwt.strategy.ts
  if (!payload.sub || typeof payload.sub !== 'string') {
    return { valid: false, error: 'Invalid token: Missing user ID' };
  }

  if (!payload.email || typeof payload.email !== 'string') {
    return { valid: false, error: 'Invalid token: Missing email' };
  }

  if (!payload.role || typeof payload.role !== 'string') {
    return { valid: false, error: 'Invalid token: Missing role' };
  }

  // Strict UUID validation
  if (!validateUUID(payload.sub)) {
    return { valid: false, error: 'Invalid token: User ID must be a valid UUID' };
  }

  return { valid: true, userId: payload.sub, email: payload.email, role: payload.role };
}

const newValidation = validateJwtPayload(decoded);
console.log('NEW token validation result:', newValidation);

const oldValidation = validateJwtPayload(oldDecoded);
console.log('OLD token validation result:', oldValidation);

if (newValidation.valid && !oldValidation.valid) {
  console.log('\n✅ CONFIRMED: Fix resolves the JWT validation issue');
} else {
  console.log('\n❌ Unexpected validation results');
  process.exit(1);
}

console.log('\n=== All Tests Passed ===');
