const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'sevaq_db',
    user: 'postgres',
    password: 'admin'
});

async function checkBookingSchema() {
    try {
        await client.connect();
        console.log('✅ Connected to database');
        
        // Check booking table schema
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'booking'
            ORDER BY ordinal_position
        `);
        
        console.log('=== Booking Table Schema ===');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

checkBookingSchema();
