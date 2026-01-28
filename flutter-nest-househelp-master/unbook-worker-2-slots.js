const { createConnection } = require('typeorm');
const { Slot } = require('./src/slots/entities/slot.entity');
const { Worker } = require('./src/workers/entities/worker.entity');
require('dotenv').config();

async function unbookWorker2Slots() {
    try {
        console.log('Connecting to database...');
        const connection = await createConnection({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'password',
            database: 'sevaq_db',
            entities: [Slot, Worker],
            synchronize: false,
        });

        console.log('Database connection successful');

        const slotRepository = connection.getRepository(Slot);
        const workerRepository = connection.getRepository(Worker);

        // Find worker 2
        const worker = await workerRepository.findOne({ where: { id: 2 } });
        if (!worker) {
            console.log('Worker 2 not found');
            await connection.close();
            return;
        }

        console.log('Found worker:', worker.name);

        // Find all slots for worker 2 that are booked
        const bookedSlots = await slotRepository.find({
            where: {
                worker: { id: 2 },
                isBooked: true,
            },
        });

        console.log(`Found ${bookedSlots.length} booked slots for worker 2`);

        // Unbook all slots for worker 2
        for (const slot of bookedSlots) {
            slot.isBooked = false;
            await slotRepository.save(slot);
        }

        console.log(`Successfully unbooked ${bookedSlots.length} slots for worker 2`);

        // Check available slots for worker 2
        const availableSlots = await slotRepository.find({
            where: {
                worker: { id: 2 },
                isBooked: false,
            },
        });

        console.log(`Now worker 2 has ${availableSlots.length} available slots`);

        await connection.close();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error unbooking slots:', error);
    }
}

unbookWorker2Slots();
