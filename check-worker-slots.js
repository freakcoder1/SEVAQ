const { createConnection } = require('typeorm');
const { Slot } = require('./flutter-nest-househelp-master/src/slots/entities/slot.entity');
const { Worker } = require('./flutter-nest-househelp-master/src/workers/entities/worker.entity');

async function checkSlots() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'sevaq_db',
      entities: [Slot, Worker],
      synchronize: false,
    });

    console.log('✅ Connected to database');

    // Get all workers with active services
    const workers = await connection.getRepository(Worker).find({
      where: {
        services: { id: 1 },
        isActive: true,
        isAvailable: true
      }
    });

    console.log(`\n🔍 Found ${workers.length} active workers for service 1:`);
    workers.forEach((worker, index) => {
      console.log(`${index + 1}. Worker ${worker.id}`);
    });

    // Check slots for each worker for the requested dates
    const requestedDates = [
      new Date('2026-01-19'),
      new Date('2026-01-20'),
      new Date('2026-01-21')
    ];

    for (const date of requestedDates) {
      console.log(`\n📅 Checking slots for date: ${date.toISOString().split('T')[0]}`);
      
      for (const worker of workers) {
        const slots = await connection.getRepository(Slot).createQueryBuilder('slot')
          .where('slot."workerId" = :workerId', { workerId: worker.id })
          .andWhere('slot."startTime" >= :startDate', { startDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()) })
          .andWhere('slot."startTime" < :endDate', { endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1) })
          .orderBy('slot."startTime"', 'ASC')
          .getMany();

        console.log(`\nWorker ${worker.id} has ${slots.length} slots:`);
        slots.forEach((slot, index) => {
          const startTime = new Date(slot.startTime);
          const endTime = new Date(slot.endTime);
          const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')} - ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
          console.log(`  ${timeStr} (Booked: ${slot.isBooked})`);
        });
      }
    }

    await connection.close();
    console.log('\n✅ Disconnected from database');

  } catch (error) {
