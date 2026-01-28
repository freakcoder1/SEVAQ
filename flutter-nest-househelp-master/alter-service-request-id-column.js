const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'sevaq_db'
});

async function updateServiceRequestIdColumn() {
    try {
        await client.connect();
        console.log('Connected to database');
        
        // Check if there are any existing bookings
        const bookingsCountResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM booking 
            WHERE "serviceRequestId" IS NOT NULL
        `);
        
        const bookingCount = parseInt(bookingsCountResult.rows[0].count);
        console.log(`Found ${bookingCount} bookings with serviceRequestId`);
        
        if (bookingCount > 0) {
            console.log('WARNING: There are existing bookings with serviceRequestId');
            console.log('This operation will drop and recreate the column, which will lose data');
            
            // Ask for confirmation before proceeding
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            readline.question('Do you want to proceed? (y/N): ', async (answer) => {
                readline.close();
                
                if (answer.toLowerCase() !== 'y') {
                    console.log('Operation cancelled');
                    await client.end();
                    return;
                }
                
                await proceedWithUpdate();
            });
        } else {
            await proceedWithUpdate();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        await client.end();
    }
}

async function proceedWithUpdate() {
    try {
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

updateServiceRequestIdColumn();
