const { Client } = require('pg');

async function verifySubscriptionStatus() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'sevaq_db',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    const result = await client.query(`
      SELECT id, status FROM subscriptions WHERE id IN (2, 3, 4, 5) ORDER BY id
    `);
    
    console.log('\nSubscription Status Verification:');
    console.log('================================');
    result.rows.forEach(row => {
      console.log(`Subscription ${row.id}: status = '${row.status}'`);
    });
    
    // Check if all are now ACTIVE (uppercase)
    const allActive = result.rows.every(row => row.status === 'ACTIVE');
    console.log('\nAll subscriptions have uppercase ACTIVE status:', allActive ? 'YES ✓' : 'NO ✗');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

verifySubscriptionStatus();
