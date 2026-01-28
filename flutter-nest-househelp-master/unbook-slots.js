const { createConnection } = require('typeorm');

async function unbookSlots() {
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
    const result = await queryRunner.query(
      'UPDATE slot SET "isBooked" = false WHERE id IN (49, 51)'
    );

    console.log(`✅ Updated ${result.rowCount} slots`);

    await connection.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

unbookSlots();
