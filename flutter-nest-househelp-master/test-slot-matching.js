const { Pool } = require('pg');

// PostgreSQL connection details
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

async function testSlotMatching() {
    try {
        console.log('✅ Database connection successful');

        // Get current date (or tomorrow since that's when most slots are)
        const targetDate = '2026-01-20';
        console.log(`\n=== Testing Slot Matching on ${targetDate} ===`);

        // Step 1: Find all available slots on target date
        const slotsResult = await pool.query(`
            SELECT s.id, s."workerId", s."startTime", s."endTime", s."isBooked", 
                   w.id as worker_id, w."isActive", w."isAvailable"
            FROM "slot" s
            LEFT JOIN "worker" w ON s."workerId" = w.id
            WHERE DATE(s."startTime") = $1 AND s."isBooked" = false
        `, [targetDate]);

        console.log(`Total available slots found: ${slotsResult.rows.length}`);
        
        if (slotsResult.rows.length > 0) {
            console.log('\n=== Available Slots ===');
            slotsResult.rows.forEach(row => {
                console.log(`- Worker ${row.workerId} (Active: ${row.isActive}, Available: ${row.isAvailable}): ` +
                    `${new Date(row.startTime).toISOString().split('T')[1]} - ${new Date(row.endTime).toISOString().split('T')[1]}`);
            });
        }

        // Step 2: Check if there are active and available workers with slots
        const activeWorkersResult = await pool.query(`
            SELECT DISTINCT w.id, w."isActive", w."isAvailable", u.name
            FROM "worker" w
            JOIN "slot" s ON w.id = s."workerId"
            LEFT JOIN "user" u ON w."userId" = u.id
            WHERE DATE(s."startTime") = $1 AND s."isBooked" = false AND w."isActive" = true AND w."isAvailable" = true
        `, [targetDate]);

        console.log(`\nActive & available workers with slots: ${activeWorkersResult.rows.length}`);
        
        if (activeWorkersResult.rows.length > 0) {
            console.log('\n=== Active Workers with Slots ===');
            activeWorkersResult.rows.forEach(row => {
                console.log(`- Worker ${row.id}: ${row.name} (Active: ${row.isActive}, Available: ${row.isAvailable})`);
            });
        }

        // Step 3: Check if workers offer services (service_worker join table)
        const workersWithServicesResult = await pool.query(`
            SELECT DISTINCT w.id, u.name, COUNT(sw."serviceId") as service_count
            FROM "worker" w
            JOIN "service_worker" sw ON w.id = sw."workerId"
            JOIN "slot" s ON w.id = s."workerId"
            LEFT JOIN "user" u ON w."userId" = u.id
            WHERE DATE(s."startTime") = $1 AND s."isBooked" = false AND w."isActive" = true AND w."isAvailable" = true
            GROUP BY w.id, u.name
        `, [targetDate]);

        console.log(`\nWorkers with services and available slots: ${workersWithServicesResult.rows.length}`);
        
        if (workersWithServicesResult.rows.length > 0) {
            console.log('\n=== Workers with Services ===');
            workersWithServicesResult.rows.forEach(row => {
                console.log(`- Worker ${row.id}: ${row.name} (Services: ${row.service_count})`);
            });
        }

        // Step 4: Find what services these workers offer
        const servicesResult = await pool.query(`
            SELECT w.id as worker_id, u.name, s.id as service_id, s.name
            FROM "worker" w
            JOIN "service_worker" sw ON w.id = sw."workerId"
            JOIN "service" s ON sw."serviceId" = s.id
            JOIN "slot" sl ON w.id = sl."workerId"
            LEFT JOIN "user" u ON w."userId" = u.id
            WHERE DATE(sl."startTime") = $1 AND sl."isBooked" = false AND w."isActive" = true AND w."isAvailable" = true
            ORDER BY w.id, s.id
        `, [targetDate]);

        console.log(`\n=== Services Offered by Workers ===`);
        const workerServices = {};
        servicesResult.rows.forEach(row => {
            if (!workerServices[row.worker_id]) {
                workerServices[row.worker_id] = {
                    name: row.name,
                    services: []
                };
            }
            workerServices[row.worker_id].services.push({ id: row.service_id, name: row.name });
        });

        Object.entries(workerServices).forEach(([workerId, data]) => {
            console.log(`\nWorker ${workerId}: ${data.name}`);
            data.services.forEach(service => {
                console.log(`  - Service ${service.id}: ${service.name}`);
            });
        });

        // Step 5: Test time zone issues
        console.log('\n=== Time Zone Analysis ===');
        const timeResult = await pool.query(`
            SELECT s.id, s."workerId", 
                   s."startTime" AT TIME ZONE 'UTC' AS utc_time,
                   s."startTime" AT TIME ZONE 'Asia/Kolkata' AS ist_time,
                   s."isBooked"
            FROM "slot" s
            WHERE DATE(s."startTime") = $1 AND s."isBooked" = false
            LIMIT 5
        `, [targetDate]);

        console.log('\nFirst 5 slots time conversion:');
        timeResult.rows.forEach(row => {
            console.log(`- Slot ${row.id} (Worker ${row.workerId}):`);
            console.log(`  UTC: ${new Date(row.utc_time).toISOString()}`);
            console.log(`  IST: ${new Date(row.ist_time).toISOString()}`);
        });

        await pool.end();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testSlotMatching();
