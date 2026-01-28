const { createConnection } = require('typeorm');
const { Slot } = require('./src/slots/entities/slot.entity');

async function checkSlots() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'sevaq_db',
      entities: [Slot],
      synchronize: false,
    });

    console.log('Connected to database');

    const slotsRepository = connection.getRepository(Slot);
    
    // Get all slots for worker 1
    const slots = await slotsRepository.createQueryBuilder('slot')
      .where('slot.workerId = :workerId', { workerId: 1 })
      .andWhere('slot.date >= :today', { today: new Date().toISOString().split('T')[0] })
      .orderBy('slot.startTime', 'ASC')
      .getMany();

    console.log(`Found ${slots.length} slots for worker 1:`);
    slots.forEach((slot, index) => {
      console.log(`${index + 1}. ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()} (Booked: ${slot.isBooked})`);
    });

    await connection.close();
    console.log('Disconnected from database');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSlots();
