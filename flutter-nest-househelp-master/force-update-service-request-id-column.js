const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'sevaq_db'
});

async function forceUpdateServiceRequestIdColumn() {
    try {
        await client.connect();
        console.log('Connected to database');
        
        // Drop existing column
        console.log('Dropping existing serviceRequestId column...');
        await client.query(`
            ALTER TABLE booking DROP COLUMN "serviceRequestId";
        `);
        
        // Add new column as UUID
        console.log('Adding new serviceRequestId column as UUID...');
        await client.query(`
            ALTER TABLE booking ADD COLUMN "serviceRequestId" uuid;
        `);
        
        console.log('✅ Successfully updated serviceRequestId column type to UUID');
        
        // Check the table schema again
        const tableInfo = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'booking' 
            ORDER BY ordinal_position
        `);
        
        console.log('\nUpdated Booking Table Schema:');
        tableInfo.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });
        
        await client.end();
    } catch (error) {
        console.error('❌ Error:', error);
        await client.end();
    }
}

forceUpdateServiceRequestIdColumn();
