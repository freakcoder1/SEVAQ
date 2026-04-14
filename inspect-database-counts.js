const { Client } = require('pg');

async function inspectDatabase() {
    console.log('🔍 Using public Railway PostgreSQL proxy URL...');
    
    // Public proxy URL provided for external access
    const dbUrl = "postgresql://postgres:XYZsmjqpLzpwLMxDqebMOsNNNTkxthIE@crossover.proxy.rlwy.net:54076/railway";
    
    console.log('✅ Using public database connection URL');

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully to Railway PostgreSQL');
        console.log('\n📊 Database Table Counts:\n');

        // Get all public tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        const tables = tablesResult.rows.map(r => r.table_name);
        const counts = [];
        let totalRecords = 0;

        for (const table of tables) {
            const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`);
            const count = parseInt(countResult.rows[0].count);
            totalRecords += count;
            counts.push({ table, count });
            
            const status = count === 0 ? '✅ EMPTY' : count > 0 ? `⚠️  ${count} records` : '❓';
            console.log(`  ${table.padEnd(35)} | ${count.toString().padStart(6)} rows  ${status}`);
        }

        console.log('\n' + '═'.repeat(60));
        console.log(`📋 Total tables: ${tables.length}`);
        console.log(`📈 Total records in database: ${totalRecords}`);
        
        const nonEmptyTables = counts.filter(c => c.count > 0);
        console.log(`🔴 Tables with data: ${nonEmptyTables.length}`);
        
        if (nonEmptyTables.length > 0) {
            console.log('\n⚠️  TABLES THAT STILL CONTAIN DATA:');
            nonEmptyTables.forEach(({ table, count }) => {
                console.log(`   - ${table}: ${count} records`);
            });
        } else {
            console.log('\n✅ DATABASE IS COMPLETELY EMPTY - Wipe was successful');
        }

        console.log('\n📅 Timestamp:', new Date().toISOString());

    } catch (err) {
        console.error('❌ Database error:', err.message);
        console.error(err.stack);
    } finally {
        await client.end();
    }
}

inspectDatabase();
