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
    console.log('🔄 Verifying subscription data...\n');
    
    // 1. Verify subscription exists
    console.log('1. Checking subscription for user d4fc9e66-be02-48c2-9c1d-1521bbd44b16...');
    const verify = await client.query(`
      SELECT id, "userId", "monthlyPriceSnapshot", status, "startDate", "billingCycle"
      FROM subscriptions 
      WHERE "userId" = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16'
    `);
    
    if (verify.rows.length === 0) {
      console.log('❌ No subscription found for this user!');
    } else {
      console.log('✅ Subscription found:', JSON.stringify(verify.rows[0], null, 2));
      console.log('\n🎉 Subscription successfully created!');
      console.log('📱 Now test the Flutter app to see the subscription price!');
    }
    
    // 2. Show table schema
    console.log('\n2. Current table schema:');
    const columns = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      ORDER BY ordinal_position
    `);
    console.table(columns.rows);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
  
  await client.end();
}

main();
