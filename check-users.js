const { Client } = require('pg');

async function checkUsers() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    const usersResult = await client.query('SELECT id, email, role FROM "user"');
    
    console.log(`👥 Found ${usersResult.rows.length} users`);
    console.log('📋 User list:');
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('✅ Disconnected from database');
  }
}

checkUsers();
