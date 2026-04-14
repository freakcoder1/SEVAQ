const { Client } = require('pg');

async function verifyDatabaseState() {
  console.log('🔍 Railway PostgreSQL Database Verification\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Railway database');

    // List all tables
    console.log('\n📋 Listing all tables in public schema:');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('   ❗ NO TABLES FOUND - Database is empty');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.tablename}`);
      });
    }

    // Count records for specified tables
    console.log('\n🔢 Record counts for main tables:');
    const targetTables = ['bookings', 'users', 'workers', 'addresses', 'assignments'];
    
    for (const table of targetTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`   ${table}: ${countResult.rows[0].count} records`);
      } catch (err) {
        if (err.code === '42P01') {
          console.log(`   ${table}: ❌ TABLE DOES NOT EXIST`);
        } else {
          console.log(`   ${table}: ⚠️ ERROR - ${err.message}`);
        }
      }
    }

    // Total table count
    console.log(`\n📊 Summary: ${tablesResult.rows.length} total tables present in database`);

  } catch (error) {
    console.error('\n❌ Database connection error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Verification completed, connection closed');
  }
}

verifyDatabaseState();
