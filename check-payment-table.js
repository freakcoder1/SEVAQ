const { Client } = require('pg');

async function checkPaymentTable() {
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

    // Check payment table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'payment' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('\nPayment table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? '(nullable)' : '(not nullable)'} ${row.column_default ? `= ${row.column_default}` : ''}`);
    });

    // Check if there are any payment records
    const paymentCount = await client.query('SELECT COUNT(*) FROM payment');
    console.log(`\nNumber of payment records: ${paymentCount.rows[0].count}`);

    if (parseInt(paymentCount.rows[0].count) > 0) {
      const samplePayment = await client.query('SELECT * FROM payment LIMIT 1');
      console.log('\nSample payment record:', samplePayment.rows[0]);
    }

    // Check if publicId column exists
    const hasPublicId = tableInfo.rows.some(row => row.column_name === 'publicId');
    if (!hasPublicId) {
      console.log('\n❌ publicId column does NOT exist in payment table');
      
      // Add publicId column to payment table with UUID default
      console.log('Adding publicId column to payment table...');
      await client.query(`
        ALTER TABLE payment 
        ADD COLUMN "publicId" uuid DEFAULT gen_random_uuid() NOT NULL
      `);
      console.log('✅ publicId column added successfully');
    } else {
      console.log('\n✅ publicId column exists in payment table');
      
      // Check if there are any null values in publicId column
      const nullPublicIdCount = await client.query(`
        SELECT COUNT(*) FROM payment WHERE "publicId" IS NULL
      `);
      
      if (parseInt(nullPublicIdCount.rows[0].count) > 0) {
        console.log(`⚠️ Found ${nullPublicIdCount.rows[0].count} records with null publicId`);
        
        // Update records with null publicId
        console.log('Updating records with null publicId...');
        const updateResult = await client.query(`
          UPDATE payment 
          SET "publicId" = gen_random_uuid() 
          WHERE "publicId" IS NULL
        `);
        console.log(`✅ Updated ${updateResult.rowCount} records`);
      } else {
        console.log('✅ All payment records have publicId');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n✅ Disconnected from database');
  }
}

checkPaymentTable();
