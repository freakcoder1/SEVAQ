// Migration script to add assignedWorkerId column to subscriptions table
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sevaq_househelp'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'assignedWorkerId'
    `);

    if (checkResult.rows.length === 0) {
      console.log('Adding assignedWorkerId column to subscriptions table...');
      
      await client.query(`
        ALTER TABLE subscriptions
        ADD COLUMN "assignedWorkerId" INTEGER
      `);

      console.log('Column added successfully!');
    } else {
      console.log('Column assignedWorkerId already exists');
    }

    // Add foreign key constraint
    console.log('Adding foreign key constraint...');
    await client.query(`
      ALTER TABLE subscriptions
      DROP CONSTRAINT IF EXISTS fk_assigned_worker;
      
      ALTER TABLE subscriptions
      ADD CONSTRAINT fk_assigned_worker
      FOREIGN KEY ("assignedWorkerId")
      REFERENCES worker(id)
      ON DELETE SET NULL
    `);

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
