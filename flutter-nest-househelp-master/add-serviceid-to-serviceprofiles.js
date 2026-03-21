const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'househelp',
});

async function runMigration() {
  try {
    console.log('Adding service_id column to service_profiles...');

    // Add the service_id column
    await pool.query(`
      ALTER TABLE "service_profiles"
      ADD COLUMN IF NOT EXISTS "service_id" INTEGER REFERENCES "services"(id)
    `);
    console.log('✅ Column added successfully');

    // Map service profiles to services based on serviceType
    // COOK profiles -> service ID 1
    // CLEANING profiles -> service ID 2
    await pool.query(`
      UPDATE "service_profiles"
      SET "service_id" = CASE
        WHEN "serviceType" = 'COOK' THEN 1
        WHEN "serviceType" = 'CLEANING' THEN 2
        WHEN "serviceType" = 'MAID' THEN 1
        ELSE 1
      END
      WHERE "service_id" IS NULL
    `);
    console.log('✅ Service profiles mapped to services');

    // Verify the mapping
    const result = await pool.query(`
      SELECT id, "serviceType", "profileName", "service_id"
      FROM "service_profiles"
    `);
    console.log('Service profiles after mapping:', JSON.stringify(result.rows, null, 2));

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
