const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

async function checkWorker6Services() {
    try {
        console.log('✅ Database connection successful');

        // Check services for workers 6-14
        const workersResult = await pool.query(`
            SELECT w.id, u."firstName", s.id as service_id, s.name
            FROM "worker" w
            JOIN "user" u ON w."userId" = u.id
            JOIN "service_worker" sw ON w.id = sw."worker_id"
            JOIN "service" s ON sw."service_id" = s.id
            WHERE w.id BETWEEN 6 AND 14
            ORDER BY w.id, s.id
        `);

        const workerServices = {};
        workersResult.rows.forEach(row => {
            if (!workerServices[row.id]) {
                workerServices[row.id] = {
                    name: row.firstName,
                    services: []
                };
            }
            workerServices[row.id].services.push({ id: row.service_id, name: row.name });
        });

        console.log('=== Services Offered by Workers 6-14 ===');
        Object.entries(workerServices).forEach(([workerId, data]) => {
            console.log(`\nWorker ${workerId}: ${data.name}`);
            data.services.forEach(service => {
                console.log(`  - Service ${service.id}: ${service.name}`);
            });
        });

        // Check if any of these workers offer Service 1
        const service1WorkersResult = await pool.query(`
            SELECT w.id, u."firstName"
            FROM "worker" w
            JOIN "user" u ON w."userId" = u.id
            JOIN "service_worker" sw ON w.id = sw."worker_id"
            WHERE w.id BETWEEN 6 AND 14 AND sw."service_id" = 1
            ORDER BY w.id
        `);

        console.log(`\n=== Workers 6-14 Offering Service 1 ===`);
        if (service1WorkersResult.rows.length === 0) {
            console.log('❌ No workers 6-14 offer Service 1');
        } else {
            service1WorkersResult.rows.forEach(row => {
                console.log(`✅ Worker ${row.id}: ${row.firstName}`);
            });
        }

        await pool.end();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkWorker6Services();
