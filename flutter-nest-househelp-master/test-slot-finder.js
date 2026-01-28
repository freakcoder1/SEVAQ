const { createConnection } = require('typeorm');

async function findSlots() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'sevaq_db',
      entities: [
        {
          name: 'Slot',
          tableName: 'slot',
          columns: [
            { name: 'id', type: 'int', isPrimary: true },
            { name: 'workerId', type: 'int' },
            { name: 'startTime', type: 'timestamp' },
            { name: 'endTime', type: 'timestamp' },
            { name: 'isBooked', type: 'boolean' },
          ],
        },
      ],
      synchronize: false,
      logging: false,
    });

    console.log('✅ Database connection established');

    const queryRunner = connection.createQueryRunner();
    const slots = await queryRunner.query(
      'SELECT * FROM slot WHERE "workerId" = 1 AND "startTime"::date = $1',
      ['2026-01-20']
    );

    console.log(`\n📊 Slots for worker 1 on 2026-01-20:`);
    slots.forEach((slot) => {
      console.log(`ID: ${slot.id}, Start: ${new Date(slot.startTime)}, End: ${new Date(slot.endTime)}, Booked: ${slot.isBooked}`);
    });

    await connection.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findSlots();
