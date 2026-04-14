const { Client } = require('pg');

// FORCE DATABASE WIPE - RAILWAY PRODUCTION POSTGRESQL
// THIS SCRIPT WILL DELETE ALL DATA PERMANENTLY BUT KEEP TABLE SCHEMA INTACT
// SAFE WIPE: TRUNCATE ALL TABLES, RESPECT FK CONSTRAINTS, RESET SEQUENCES

const DATABASE_URL = "postgresql://postgres:XYZsmjqpLzpwLMxDqebMOsNNNTkxthIE@crossover.proxy.rlwy.net:54076/railway";

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

console.log('====================================================');
console.log('⚠️  RAILWAY PRODUCTION DATABASE WIPE INITIATED');
console.log('====================================================');
console.log('✅ Connecting directly to PostgreSQL database...');
console.log(`✅ Target: ${DATABASE_URL.split('@')[1] || 'Railway production database'}`);
console.log('');
console.log('⚠️  THIS OPERATION IS PERMANENT AND IRREVERSIBLE');
console.log('⚠️  ALL DATA WILL BE DELETED, TABLE SCHEMA WILL REMAIN');
console.log('');

const wipeDatabase = async () => {
  let client = null;
  
  try {
    // Railway PostgreSQL always requires SSL
    const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    client = new Client({
      connectionString: DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });
    await client.connect();
    
    console.log('✅ Connected successfully to Railway PostgreSQL database');
    console.log('');
    
    // Step 1: Terminate all other active connections
    console.log('🔹 Step 1: Terminating all other active database connections...');
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid()
      AND datname = current_database();
    `);
    console.log('✅ All external connections terminated');
    console.log('');

    // Step 2: Get all tables in correct dependency order
    console.log('🔹 Step 2: Retrieving all public tables...');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
      ORDER BY tablename;
    `);
    
    const tables = tablesResult.rows.map(r => r.tablename);
    console.log(`✅ Found ${tables.length} tables in database`);
    tables.forEach(t => console.log(`   - ${t}`));
    console.log('');

    // Step 3: Disable foreign key constraints temporarily
    console.log('🔹 Step 3: Disabling foreign key constraints for this session...');
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    await client.query('SET session_replication_role = replica');
    console.log('✅ Foreign key checks disabled safely');
    console.log('');

    // Step 4: Truncate all tables
    console.log('🔹 Step 4: Truncating all tables (deleting ALL data)...');
    const wipeStats = [];
    
    for (const table of tables) {
      const countBefore = await client.query(`SELECT count(*) as cnt FROM "${table}"`);
      const rowCount = parseInt(countBefore.rows[0].cnt);
      
      await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
      
      wipeStats.push({ table, rowsDeleted: rowCount });
      console.log(`   ✅ Truncated ${table}: ${rowCount} rows removed`);
    }
    console.log('');

    // Step 5: Reset all sequences
    console.log('🔹 Step 5: Resetting all database sequences...');
    const sequencesResult = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);
    
    for (const row of sequencesResult.rows) {
      await client.query(`ALTER SEQUENCE "${row.sequence_name}" RESTART WITH 1`);
      console.log(`   ✅ Reset sequence: ${row.sequence_name}`);
    }
    console.log(`✅ ${sequencesResult.rows.length} sequences reset to 1`);
    console.log('');

    // Step 6: Re-enable foreign key constraints
    console.log('🔹 Step 6: Re-enabling foreign key constraints...');
    await client.query('SET session_replication_role = DEFAULT');
    await client.query('SET CONSTRAINTS ALL IMMEDIATE');
    console.log('✅ Foreign key checks restored');
    console.log('');

    // Step 7: Run ANALYZE to update statistics
    console.log('🔹 Step 7: Running database ANALYZE...');
    await client.query('ANALYZE');
    console.log('✅ Database statistics updated');
    console.log('');

    // Step 8: Verify empty tables
    console.log('🔹 Step 8: Verifying all tables are empty...');
    console.log('');
    console.log('╔════════════════════════════════════════════════╦═══════════╗');
    console.log('║ Table Name                                     ║ Row Count ║');
    console.log('╠════════════════════════════════════════════════╬═══════════╣');
    
    let verificationPassed = true;
    const finalCounts = [];
    
    for (const table of tables) {
      const countAfter = await client.query(`SELECT count(*) as cnt FROM "${table}"`);
      const finalCount = parseInt(countAfter.rows[0].cnt);
      finalCounts.push({ table, count: finalCount });
      
      const status = finalCount === 0 ? '✅' : '❌';
      const paddedTable = table.padEnd(44);
      const paddedCount = finalCount.toString().padStart(7);
      
      console.log(`║ ${paddedTable} ║ ${paddedCount} ${status} ║`);
      
      if (finalCount !== 0) {
        verificationPassed = false;
      }
    }
    
    console.log('╚════════════════════════════════════════════════╩═══════════╝');
    console.log('');

    // Step 9: Final summary report
    console.log('====================================================');
    console.log('✅ DATABASE WIPE OPERATION COMPLETED');
    console.log('====================================================');
    console.log('');
    console.log('📊 WIPE SUMMARY:');
    console.log(`   Total tables processed: ${tables.length}`);
    console.log(`   Total rows deleted: ${wipeStats.reduce((sum, s) => sum + s.rowsDeleted, 0)}`);
    console.log(`   Sequences reset: ${sequencesResult.rows.length}`);
    console.log('');
    
    if (verificationPassed) {
      console.log('✅ VERIFICATION PASSED: All tables are completely empty');
    } else {
      console.log('⚠️  VERIFICATION WARNING: Some tables still contain records');
      finalCounts.filter(f => f.count > 0).forEach(f => {
        console.log(`   ❌ ${f.table}: ${f.count} rows remaining`);
      });
    }
    
    console.log('');
    console.log('✅ Database schema remains intact');
    console.log('✅ Foreign key constraints restored');
    console.log('✅ All sequences reset to starting values');
    console.log('✅ Ready for fresh data seeding');
    console.log('');
    console.log('====================================================');
    
    await client.end();
    
    process.exit(verificationPassed ? 0 : 2);
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR DURING DATABASE WIPE:');
    console.error(error.message);
    console.error(error.stack);
    
    if (client) {
      // Always attempt to re-enable foreign keys even on failure
      try {
        await client.query('SET session_replication_role = DEFAULT');
        await client.end();
      } catch (e) {}
    }
    
    process.exit(1);
  }
};

// Execute after 5 second warning with countdown
console.log('⚠️  WARNING: ALL PRODUCTION DATA WILL BE PERMANENTLY DELETED!');
console.log('⚠️  Press Ctrl+C NOW to abort!');
console.log('');

let countdown = 5;
const countdownTimer = setInterval(() => {
  console.log(`⏱️  Starting wipe in ${countdown} seconds...`);
  countdown--;
  if (countdown === 0) {
    clearInterval(countdownTimer);
    console.log('');
    console.log('🔥 Executing database wipe...');
    console.log('');
    wipeDatabase();
  }
}, 1000);
