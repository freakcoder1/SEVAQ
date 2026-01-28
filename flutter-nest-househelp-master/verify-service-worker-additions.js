const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

async function verifyServiceWorkerAdditions() {
    try {
        console.log('✅ Database connection successful');

        // Check service-worker associations for workers 6,7,8
        const workers = [6, 7, 8];
        for (const workerId of workers) {
            const result = await pool.query(`
                SELECT s.id, s.name
                FROM "service_worker" sw
                JOIN "service" s ON sw."service_id" = s.id
                WHERE sw."worker_id" = $1
                ORDER BY s.id
            `, [workerId]);

            console.log(`\n=== Worker ${workerId} Services ===`);
            result.rows.forEach(row => {
                console.log(`Service ${row.id}: ${row.name}`);
            });
        }

        // Check if Service 1 is now available with workers
        const service1WorkersResult = await pool.query(`
            SELECT w.id, u."firstName", COUNT(s.id) as available_slots
            FROM "worker" w
            JOIN "user" u ON w."userId" = u.id
            JOIN "service_worker" sw ON w.id = sw."worker_id"
            LEFT JOIN "slot" s ON w.id = s."workerId" 
                AND DATE(s."startTime") = '2026-01-20' 
                AND s."isBooked" = false
            WHERE sw."service_id" = 1 AND w."isActive" = true AND w."isAvailable" = true
            GROUP BY w.id, u."firstName"
            ORDER BY w.id
        `);

        console.log('\n=== Service 1 Workers with Available Slots ===');
        service1WorkersResult.rows.forEach(row => {
            console.log(`Worker ${row.id}: ${row.firstName} - ${row.available_slots} available slots`);
        });

        await pool.end();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyServiceWorkerAdditions();
