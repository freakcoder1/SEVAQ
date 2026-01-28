const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
});

function findAvailableSlotFlexibleTest(workerId, requestedStartTime, requestedEndTime) {
    // Mocking the SlotsService.findAvailableSlotFlexible method logic
    
    console.log('=== findAvailableSlotFlexible Test ===');
    console.log(`Worker ID: ${workerId}`);
    console.log(`Requested Start: ${requestedStartTime.toISOString()} (${requestedStartTime.getHours()}:${requestedStartTime.getMinutes()})`);
    console.log(`Requested End: ${requestedEndTime.toISOString()}`);
    
    // Calculate time window with 30 minutes flexibility
    const flexibilityMinutes = 30;
    const startTimeWindow = {
        start: new Date(requestedStartTime.getTime() - flexibilityMinutes * 60000),
        end: new Date(requestedStartTime.getTime() + flexibilityMinutes * 60000)
    };
    
    console.log(`\nTime Window (±30 mins):`);
    console.log(`Start: ${startTimeWindow.start.toISOString()} (${startTimeWindow.start.getHours()}:${startTimeWindow.start.getMinutes()})`);
    console.log(`End: ${startTimeWindow.end.toISOString()} (${startTimeWindow.end.getHours()}:${startTimeWindow.end.getMinutes()})`);
    
    return startTimeWindow;
}

async function testSlotMatching() {
    try {
        console.log('✅ Database connection successful');

        const targetDate = '2026-01-20';
        
        // Get slots for worker 6
        const slotsResult = await pool.query(`
            SELECT id, "startTime", "endTime"
            FROM "slot" 
            WHERE "workerId" = $1 AND DATE("startTime") = $2 AND "isBooked" = false
            ORDER BY "startTime"
        `, [6, targetDate]);

        const slots = slotsResult.rows.map(row => ({
            id: row.id,
            startTime: new Date(row.startTime),
            endTime: new Date(row.endTime)
        }));

        console.log(`\n=== Available Slots for Worker 6 ===`);
        slots.forEach(slot => {
            console.log(`Slot ${slot.id}: ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}`);
        });

        // Test with typical IST times that frontend might send
        const testCases = [
            '2026-01-20T08:30:00+05:30', // 8:30 AM IST
            '2026-01-20T13:30:00+05:30', // 1:30 PM IST
            '2026-01-20T18:30:00+05:30'  // 6:30 PM IST
        ];

        testCases.forEach((testTime, index) => {
            console.log(`\n--- Test Case ${index + 1}: ${testTime} ---`);
            
            const startTime = new Date(testTime);
            const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // 3 hours later
            
            const window = findAvailableSlotFlexibleTest(6, startTime, endTime);
            
            // Check if any slot's startTime is within the window
            const matchingSlots = slots.filter(slot => {
                const slotStart = slot.startTime;
                return slotStart >= window.start && slotStart <= window.end;
            });
            
            console.log(`\nMatching slots found: ${matchingSlots.length}`);
            matchingSlots.forEach(slot => {
                console.log(`Slot ${slot.id}: ${slot.startTime.toISOString()}`);
            });
        });

        await pool.end();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testSlotMatching();
