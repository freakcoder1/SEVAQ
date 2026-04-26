const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'sevaq_db'
});

async function updateSubscription() {
  try {
    await client.connect();
    console.log('Connected to database: sevaq_db');
    
    // Check all subscriptions
    const all = await client.query('SELECT id, "monthlyPriceSnapshot", "publicId" FROM subscriptions');
    console.log('All subscriptions in DB:', all.rows);
    
    // Update subscription by publicId (336c068f-8243-465b-924d-28d84313b385)
    const result = await client.query(
      "UPDATE subscriptions SET \"monthlyPriceSnapshot\" = 5299 WHERE \"publicId\" = '336c068f-8243-465b-924d-28d84313b385' RETURNING *"
    );
    
    if (result.rows.length > 0) {
      console.log('Updated subscription:', result.rows[0]);
    } else {
      console.log('No subscription found with publicId=336c068f-8243-465b-924d-28d84313b385');
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

updateSubscription();
