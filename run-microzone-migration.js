const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function runMigration() {
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    const sqlCommands = [
      "ALTER TABLE micro_zone ADD COLUMN IF NOT EXISTS \"centerLat\" decimal(10,7)",
      "ALTER TABLE micro_zone ADD COLUMN IF NOT EXISTS \"centerLng\" decimal(10,7)",
      "ALTER TABLE micro_zone ADD COLUMN IF NOT EXISTS \"radiusKm\" decimal(5,2)",
      "ALTER TABLE micro_zone ADD COLUMN IF NOT EXISTS \"zoneType\" text DEFAULT 'static'",
      "ALTER TABLE micro_zone ADD COLUMN IF NOT EXISTS \"boundaries\" json"
    ];

    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql}`);
      const result = await client.query(sql);
      console.log('Success');
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await client.end();
  }
}

runMigration();
