const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

async function checkService1WorkersSlots() {
    try {
        console.log('✅ Database connection successful');

        const targetDate = '2026-01-20';

        // Check which workers offering Service 1 have slots on target date
        const workersWithSlotsResult = await pool.query(`
            SELECT w.id, u."firstName", COUNT(s.id) as slot_count
            FROM "worker" w
            JOIN "user" u ON w."userId" = u.id
            JOIN "service_worker" sw ON w.id = sw."worker_id"
            LEFT JOIN "slot" s ON w.id = s."workerId" 
                AND DATE(s."startTime") = $1 
                AND s."isBooked" = false
            WHERE sw."service_id" = 1 AND w."isActive" = true AND w."isAvailable" = true
            GROUP BY w.id, u."firstName"
            ORDER BY w.id
        `, [targetDate]);

        console.log('=== Service 1 Workers with Slots ===');
        workersWithSlotsResult.rows.forEach(row => {
            console.log(`Worker ${row.id}: ${row.firstName} - ${row.slot_count} available slots`);
        });

        // Show details of slots for these workers
        console.log('\n=== Slot Details ===');
        for (let workerId = 1; workerId <= 5; workerId++) {
            const slotsResult = await pool.query(`
                SELECT id, "startTime", "endTime", "isBooked"
                FROM "slot" 
                WHERE "workerId" = $1 AND DATE("startTime") = $2
                ORDER BY "startTime"
            `, [workerId, targetDate]);

            if (slotsResult.rows.length > 0) {
                console.log(`\nWorker ${workerId} slots:`);
                slotsResult.rows.forEach(slot => {
                    console.log(`  Slot ${slot.id}: ${new Date(slot.startTime).toISOString()} - ${new Date(slot.endTime).toISOString()} - ${slot.isBooked ? 'Booked' : 'Available'}`);
                });
            }
        }

        // Check worker 15 as well
        const worker15SlotsResult = await pool.query(`
            SELECT id, "startTime", "endTime", "isBooked"
            FROM "slot" 
            WHERE "workerId" = 15 AND DATE("startTime") = $1
            ORDER BY "startTime"
        `, [targetDate]);

        if (worker15SlotsResult.rows.length > 0) {
            console.log(`\nWorker 15 slots:`);
            worker15SlotsResult.rows.forEach(slot => {
                console.log(`  Slot ${slot.id}: ${new Date(slot.startTime).toISOString()} - ${new Date(slot.endTime).toISOString()} - ${slot.isBooked ? 'Booked' : 'Available'}`);
            });
        }

        await pool.end();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkService1WorkersSlots();
