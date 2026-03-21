const { Client } = require('pg');

async function fixSubscription() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'househelp',
    user: 'postgres',
    password: 'admin'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Update subscription 1 to belong to test.user1@example.com
    const result = await client.query(
      'UPDATE subscriptions SET "userId" = $1 WHERE id = $2',
      ['d4fc9e66-be02-48c2-9c1d-1521bbd44b16', 1]
    );

    console.log('Updated:', result.rowCount, 'row(s)');

    // Verify the update
    const verify = await client.query(
      'SELECT id, "monthlyPriceSnapshot", status, "userId" FROM subscriptions WHERE id = 1'
    );
    console.log('Subscription after update:', verify.rows[0]);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixSubscription();
