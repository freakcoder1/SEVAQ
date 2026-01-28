const { Pool } = require('pg');

// PostgreSQL connection details
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

async function checkWorkerServices() {
    try {
        console.log('✅ Database connection successful');

        const targetDate = '2026-01-20';
        console.log(`\n=== Checking Worker-Service Associations on ${targetDate} ===`);

        // Check which workers have slots on the target date
        const workersWithSlotsResult = await pool.query(`
            SELECT DISTINCT w.id as worker_id, w."isActive", w."isAvailable"
            FROM "worker" w
            JOIN "slot" s ON w.id = s."workerId"
            WHERE DATE(s."startTime") = $1 AND s."isBooked" = false AND w."isActive" = true AND w."isAvailable" = true
        `, [targetDate]);

        console.log(`Workers with active slots: ${workersWithSlotsResult.rows.length}`);
        console.log('Worker IDs:', workersWithSlotsResult.rows.map(row => row.worker_id));

        // Check which of these workers have service associations
        const workersWithServicesResult = await pool.query(`
            SELECT DISTINCT w.id as worker_id, COUNT(sw."service_id") as service_count
            FROM "worker" w
            JOIN "slot" s ON w.id = s."workerId"
            LEFT JOIN "service_worker" sw ON w.id = sw."worker_id"
            WHERE DATE(s."startTime") = $1 AND s."isBooked" = false AND w."isActive" = true AND w."isAvailable" = true
            GROUP BY w.id
        `, [targetDate]);

        console.log(`\n=== Worker Service Associations ===`);
        workersWithServicesResult.rows.forEach(row => {
            console.log(`Worker ${row.worker_id}: ${row.service_count} services`);
        });

        // Check what services are available
        const servicesResult = await pool.query(`
            SELECT id, name FROM "service" ORDER BY id
        `);

        console.log(`\n=== Available Services ===`);
        servicesResult.rows.forEach(row => {
            console.log(`Service ${row.id}: ${row.name}`);
        });

        // Check service-worker associations for a specific worker
        const workerId = 6;
        const workerServicesResult = await pool.query(`
            SELECT s.id, s.name
            FROM "service" s
            JOIN "service_worker" sw ON s.id = sw."service_id"
            WHERE sw."worker_id" = $1
        `, [workerId]);

        console.log(`\n=== Services for Worker ${workerId} ===`);
        workerServicesResult.rows.forEach(row => {
            console.log(`Service ${row.id}: ${row.name}`);
        });

        await pool.end();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkWorkerServices();
