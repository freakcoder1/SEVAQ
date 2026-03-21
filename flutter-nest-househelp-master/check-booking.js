const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'sevaq_db',
  schema: 'public',
});

async function main() {
  try {
    await dataSource.initialize();

    // Check booking table columns
    const columns = await dataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'booking'
    `);
    console.log('Booking table columns:');
    console.table(columns);

    // Check booking 206
    const booking = await dataSource.query(`
      SELECT *
      FROM booking
      WHERE id = 206
    `);

    console.log('\n=== Booking 206 ===');
    console.table(booking);

    await dataSource.destroy();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
