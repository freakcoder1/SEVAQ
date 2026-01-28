const axios = require('axios');
const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config();

async function resetAllTestUsersPasswords() {
  console.log('🔄 Resetting all test users passwords...');

  try {
    // Create PostgreSQL client
    const client = new Client({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'sevaq',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    await client.connect();
    console.log('✅ Connected to database');

    // Hash the new password
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Password hashed successfully');

    // Update all test users passwords
    const updateQuery = `
      UPDATE "user" 
      SET password = $1 
      WHERE email LIKE 'test.user%@example.com'
    `;

    const result = await client.query(updateQuery, [hashedPassword]);
    console.log(`✅ Password updated for ${result.rowCount} test user(s)`);

    // Verify the update
    const verifyQuery = `
      SELECT id, email, "firstName", "lastName", role 
      FROM "user" 
      WHERE email LIKE 'test.user%@example.com'
    `;

    const usersResult = await client.query(verifyQuery);
    console.log(`✅ Found ${usersResult.rows.length} test users in database`);

    for (const user of usersResult.rows) {
      console.log(`📋 User: ${user.firstName} ${user.lastName} - ${user.email} (${user.role})`);
    }

    await client.end();
    console.log('✅ Database connection closed');

    // Test login for each test user
    console.log('\n🔍 Testing login for each test user...');
    
    for (let i = 1; i <= usersResult.rows.length; i++) {
      const email = `test.user${i}@example.com`;
      try {
        const loginResponse = await axios.post('http://127.0.0.1:45357/auth/login', {
          email,
          password: newPassword
        });
        
        console.log(`✅ ${email} - Login successful (${loginResponse.status})`);
      } catch (error) {
        console.error(`❌ ${email} - Login failed: ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📝 Response status:', error.response.status);
      console.error('📝 Response data:', error.response.data);
    }
  }
}

resetAllTestUsersPasswords();