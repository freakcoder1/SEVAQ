
const { createConnection } = require('typeorm');
const { Slot } = require('./src/slots/entities/slot.entity');
const { Worker } = require('./src/workers/entities/worker.entity');

async function debugSlotSearch() {
    try {
        // Create connection
        const connection = await createConnection({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'newsevaq_user',
            password: 'newsevaq_password',
            database: 'newsevaq_db',
            entities: [Slot, Worker],
            synchronize: false,
            logging: false
        });

        console.log('✅ Database connection successful');

        // Get slots repository
        const slotsRepository = connection.getRepository(Slot);

        // Get current date (or tomorrow since that's when most slots are)
        const targetDate = new Date('2026-01-20');
        const tomorrow = new Date(targetDate);
        tomorrow.setDate(targetDate.getDate() + 1);

        console.log(`\n=== Searching for slots on ${targetDate.toISOString().split('T')[0]} ===`);

        // Find all slots for tomorrow
        const slots = await slotsRepository.find({
            where: {
                date: targetDate
            },
            relations: ['worker']
        });

        console.log(`Total slots found: ${slots.length}`);
        
        // Show available slots
        const availableSlots = slots.filter(slot => !slot.isBooked);
        console.log(`Available slots: ${availableSlots.length}`);
        
        if (availableSlots.length > 0) {
            console.log('\n=== Available Slots ===');
            availableSlots.forEach(slot => {
                console.log(`- Worker ${slot.worker?.id} (${slot.worker?.user?.name || 'Unknown'}): ${slot.startTime.toISOString().split('T')[1]} - ${slot.endTime.toISOString().split('T')[1]}`);
            });
        }

        // Debug findAvailableSlotFlexible logic
        console.log('\n=== Testing Time Matching Logic ===');
        
        // Test worker 6 (who has available slots)
        const testWorkerId = 6;
        const testStartTime = new Date('2026-01-20T10:00:00+05:30');
        const testEndTime = new Date('2026-01-20T13:00:00+05:30');
        
        console.log(`\nTest parameters: Worker ${testWorkerId}`);
        console.log(`Start: ${testStartTime.toISOString()}`);
        console.log(`End: ${testEndTime.toISOString()}`);

        // Find slots for this worker
        const workerSlots = slots.filter(slot => slot.worker?.id === testWorkerId);
        console.log(`\nWorker ${testWorkerId} slots: ${workerSlots.length}`);
        workerSlots.forEach(slot => {
            console.log(`- ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}, Booked: ${slot.isBooked}`);
        });

        // Check if any slot matches with flexibility
        const flexibilityMinutes = 30;
        const startTimeWindow = {
            start: new Date(testStartTime.getTime() - flexibilityMinutes * 60000),
            end: new Date(testStartTime.getTime() + flexibilityMinutes * 60000)
        };

        console.log(`\nTime window (±30 mins):`);
        console.log(`Start: ${startTimeWindow.start.toISOString()}`);
        console.log(`End: ${startTimeWindow.end.toISOString()}`);

        // Find slots within window
        const slotsInWindow = workerSlots.filter(slot => 
            !slot.isBooked && 
            slot.startTime >= startTimeWindow.start && 
            slot.startTime <= startTimeWindow.end
        );

        console.log(`\nSlots in window: ${slotsInWindow.length}`);
        slotsInWindow.forEach(slot => {
            console.log(`- ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}`);
        });

        // Cleanup
        await connection.close();
        console.log('\n✅ Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugSlotSearch();
