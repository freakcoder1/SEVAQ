const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'sevaq_db',
});

async function normalizePhoneNumbers() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all users with phone numbers
    const result = await client.query('SELECT id, phone FROM "user" WHERE phone IS NOT NULL');
    console.log(`Total users with phone numbers: ${result.rows.length}\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const user of result.rows) {
      const originalPhone = user.phone;
      
      // Extract digits only
      const digitsOnly = originalPhone.replace(/[^0-9]/g, '');
      
      // Get last 10 digits (assuming Indian phone number)
      const last10Digits = digitsOnly.slice(-10);
      
      // Skip if we don't have 10 digits
      if (last10Digits.length !== 10) {
        console.log(`⚠️  Skipping user ${user.id}: Invalid phone number length (${last10Digits.length} digits) - ${originalPhone}`);
        continue;
      }
      
      // Create consistent format
      const consistentPhone = `+91${last10Digits}`;
      
      // Skip if already in consistent format
      if (originalPhone === consistentPhone) {
        console.log(`✅ User ${user.id}: Phone already normalized - ${consistentPhone}`);
        continue;
      }
      
      // Check if another user already has this normalized phone
      const existingUser = await client.query(
        'SELECT id FROM "user" WHERE phone = $1 AND id != $2',
        [consistentPhone, user.id]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`❌ User ${user.id}: Normalized phone ${consistentPhone} already exists for user ${existingUser.rows[0].id} - skipping`);
        errorCount++;
        continue;
      }
      
      // Update the phone number
      await client.query(
        'UPDATE "user" SET phone = $1 WHERE id = $2',
        [consistentPhone, user.id]
      );
      
      console.log(`✅ User ${user.id}: Updated phone from ${originalPhone} to ${consistentPhone}`);
      updatedCount++;
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total users processed: ${result.rows.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors/Skipped: ${errorCount}`);
    console.log(`Already normalized: ${result.rows.length - updatedCount - errorCount}`);

  } catch (err) {
    console.error('❌ Database error:', err.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

normalizePhoneNumbers();
