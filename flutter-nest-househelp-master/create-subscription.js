const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function main() {
  await client.connect();
  
  try {
    // First check if subscription exists for this user (using correct column name userId)
    console.log('Checking for existing subscription...');
    const check = await client.query(
      "SELECT id, \"userId\", \"monthlyPriceSnapshot\", status FROM subscriptions WHERE \"userId\" = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16'"
    );
    console.log('Existing subscription:', JSON.stringify(check.rows, null, 2));
    
    if (check.rows.length === 0) {
      // Insert a new subscription for the correct user
      console.log('Creating new subscription for user...');
      const insert = await client.query(
        `INSERT INTO subscriptions (
          "publicId", "userId", "serviceProfileId", "preferredTimeWindow",
          "startDate", status, "billingCycle", "monthlyPriceSnapshot",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16', 1, 'MORNING',
          CURRENT_DATE, 'ACTIVE', 'MONTHLY', 8000.00,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id, "userId", "monthlyPriceSnapshot", status`
      );
      console.log('Created subscription:', JSON.stringify(insert.rows, null, 2));
    }
    
    // Verify
    const verify = await client.query(
      "SELECT id, \"userId\", \"monthlyPriceSnapshot\", status FROM subscriptions WHERE \"userId\" = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16'"
    );
    console.log('Final subscription:', JSON.stringify(verify.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await client.end();
  console.log('Done!');
}

main();
