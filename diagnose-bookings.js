const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'sevaq_db',
});

async function diagnose() {
  try {
    await client.connect();
    console.log('Connected');

    // Check tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));

    // Check service table
    const services = await client.query(`SELECT * FROM service LIMIT 10`);
    console.log('Services:', services.rows);

    // Check service_profiles table
    const profiles = await client.query(`SELECT id, "serviceType" FROM service_profiles LIMIT 10`);
    console.log('Service Profiles:', profiles.rows);

    // Check subscriptions table for custom_plan_data
    const subs = await client.query(`SELECT id, "serviceProfileId", "custom_plan_data" FROM subscriptions LIMIT 5`);
    console.log('Subscriptions sample:', subs.rows);

    // Check bookings with null serviceId
    const bookings = await client.query(`SELECT id, "subscriptionId", "serviceId" FROM booking WHERE "serviceId" IS NULL LIMIT 5`);
    console.log('Bookings with null serviceId:', bookings.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

diagnose();
