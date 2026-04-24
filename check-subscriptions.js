const { Client } = require('pg');

async function checkSubscriptions() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sevaq'
  });
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Check subscriptions 27 and 19
    const subs = await client.query(`
      SELECT id, user_id, service_profile_id, assigned_worker_id, status, start_date 
      FROM subscriptions 
      WHERE id IN (27, 19)
    `);
    console.log('Subscriptions 27 & 19:');
    console.log(subs.rows);
    console.log('');
    
    // Check all bookings for these subscriptions
    const bookings = await client.query(`
      SELECT b.id, b.user_id, b.subscription_id, b.status, b.type, b.worker_id, b.assigned_worker_id, b.date, b.start_time
      FROM booking b
      WHERE b.subscription_id IN (27, 19)
      ORDER BY b.subscription_id, b.date
    `);
    console.log('Bookings for subs 27 & 19:');
    console.log(bookings.rows);
    console.log('');
    
    // Check all unassigned on-demand/subscription bookings
    const unassigned = await client.query(`
      SELECT id, user_id, subscription_id, status, type, worker_id, assigned_worker_id, date
      FROM booking
      WHERE worker_id IS NULL 
        AND type IN ('on_demand', 'subscription')
        AND status IN ('requested', 'confirmed')
      ORDER BY date
    `);
    console.log('Unassigned on-demand/subscription bookings (worker_id IS NULL):');
    console.log(unassigned.rows);
    console.log('');
    
    // Check all bookings with assigned_worker_id set
    const assigned = await client.query(`
      SELECT id, subscription_id, status, type, worker_id, assigned_worker_id
      FROM booking
      WHERE assigned_worker_id IS NOT NULL
      ORDER BY date DESC LIMIT 5
    `);
    console.log('Recent bookings with assigned_worker_id set:');
    console.log(assigned.rows);
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSubscriptions();
