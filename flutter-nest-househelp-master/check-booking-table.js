const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'sevaq_db'
});

async function checkBookingTable() {
    try {
        await client.connect();
        
        // Check table schema
        const tableInfo = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'booking' 
            ORDER BY ordinal_position
        `);
        
        console.log('Booking Table Schema:');
        tableInfo.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });
        
        await client.end();
    } catch (error) {
        console.error('Error:', error);
        await client.end();
    }
}

checkBookingTable();
