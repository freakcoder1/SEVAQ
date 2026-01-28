const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

async function testTimezoneMatching() {
    try {
        console.log('✅ Database connection successful');

        // Target date is tomorrow
        const targetDate = '2026-01-20';
        
        // Let's see what slots exist for worker 6
        const slotsResult = await pool.query(`
            SELECT id, "startTime", "endTime", "isBooked"
            FROM "slot" 
            WHERE "workerId" = $1 AND DATE("startTime") = $2 AND "isBooked" = false
            ORDER BY "startTime"
        `, [6, targetDate]);

        console.log(`\n=== Slots for Worker 6 on ${targetDate} ===`);
        slotsResult.rows.forEach(slot => {
            console.log(`Slot ${slot.id}: ${new Date(slot.startTime).toISOString()} - ${new Date(slot.endTime).toISOString()}`);
        });

        // Test what happens with timezone conversion
        console.log('\n=== Timezone Conversion Test ===');
        
        // Let's say frontend is sending a time like "2026-01-20T08:30:00+05:30" (IST)
        const frontendTime = '2026-01-20T08:30:00+05:30';
        console.log('Frontend IST time:', frontendTime);
        
        const dateObj = new Date(frontendTime);
        console.log('Date object:', dateObj);
        console.log('ISO string:', dateObj.toISOString());
        console.log('UTC time:', dateObj.toISOString().split('T')[1]);

        // Calculate time difference
        const utcHour = dateObj.getUTCHours();
        const istHour = dateObj.getHours();
        console.log(`UTC hour: ${utcHour}, IST hour: ${istHour}`);

        // What's the actual time in UTC for IST 8:30 AM?
        console.log('');
        const testTimes = [
            '2026-01-20T08:30:00+05:30', // 8:30 AM IST
            '2026-01-20T13:30:00+05:30', // 1:30 PM IST
            '2026-01-20T18:30:00+05:30'  // 6:30 PM IST
        ];

        testTimes.forEach(time => {
            const d = new Date(time);
            console.log(`${time} (IST) = ${d.toISOString()} (UTC)`);
        });

        await pool.end();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testTimezoneMatching();
