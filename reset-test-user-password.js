const axios = require('axios');
const bcrypt = require('bcrypt');
const { Client } = require('pg');
require('dotenv').config();

async function resetTestUserPassword() {
  console.log('🔄 Resetting test user password...');

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

    // Update the test user's password
    const updateQuery = `
      UPDATE "user" 
      SET password = $1 
      WHERE email = 'test.user1@example.com'
    `;

    const result = await client.query(updateQuery, [hashedPassword]);
    console.log(`✅ Password updated for test.user1@example.com - ${result.rowCount} row(s) affected`);

    // Verify the update
    const verifyQuery = `
      SELECT id, email, "firstName", "lastName", role 
      FROM "user" 
      WHERE email = 'test.user1@example.com'
    `;

    const userResult = await client.query(verifyQuery);
    if (userResult.rows.length > 0) {
      console.log('✅ User found in database');
      console.log('📋 User details:', userResult.rows[0]);
    }

    await client.end();
    console.log('✅ Database connection closed');

    // Test the login
    console.log('\n🔍 Testing login with new credentials...');
    const loginResponse = await axios.post('http://127.0.0.1:45357/auth/login', {
      email: 'test.user1@example.com',
      password: newPassword
    });

    console.log('✅ Login successful!');
    console.log('📦 Response status:', loginResponse.status);
    console.log('🎯 Access token:', loginResponse.data.access_token);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📝 Response status:', error.response.status);
      console.error('📝 Response data:', error.response.data);
    }
  }
}

resetTestUserPassword();