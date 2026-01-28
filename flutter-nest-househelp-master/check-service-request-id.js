const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'sevaq_db'
});

async function checkServiceRequests() {
    try {
        await client.connect();
        
        // Check table schema
        const tableInfo = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'service_requests' 
            ORDER BY ordinal_position
        `);
        
        console.log('Service Requests Table Schema:');
        tableInfo.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });
        
        // Check data
        const data = await client.query(`
            SELECT id, "publicId", "assignmentStatus", "assignedWorkerId", "assignedSlotId" 
            FROM service_requests 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        console.log('\nLatest Service Requests:');
        data.rows.forEach(row => {
            console.log(`  id: ${row.id} (${typeof row.id}), publicId: ${row.publicId}, status: ${row.assignmentStatus}`);
        });
        
        await client.end();
    } catch (error) {
        console.error('Error:', error);
        await client.end();
    }
}

checkServiceRequests();
