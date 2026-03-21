const { Client } = require('pg');
const crypto = require('crypto');

async function migrate() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'sevaq_db',
    user: 'postgres',
    password: 'admin'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Generate UUID v4
    function generateUUID() {
      return crypto.randomUUID();
    }

    // Step 0: Get all foreign key constraints that reference user.id
    console.log('Step 0: Finding foreign key constraints...');
    const fkResult = await client.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint c
      WHERE confrelid = (SELECT oid FROM pg_class WHERE relname = 'user')
      AND contype = 'f'
    `);
    console.log(`Found ${fkResult.rows.length} foreign key constraints`);

    // Step 0.5: Drop all foreign key constraints that reference user.id
    console.log('Step 0.5: Dropping foreign key constraints...');
    for (const row of fkResult.rows) {
      console.log(`Dropping constraint ${row.conname} on ${row.table_name}`);
      await client.query(`ALTER TABLE "${row.table_name}" DROP CONSTRAINT "${row.conname}"`);
    }
    console.log('Step 0.5: Done');

    // Check if new_id column exists
    const checkResult = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'user' AND column_name = 'new_id'
    `);

    if (checkResult.rows.length > 0) {
      console.log('new_id column already exists, dropping it first...');
      await client.query('ALTER TABLE "user" DROP COLUMN new_id CASCADE');
      console.log('Dropped existing new_id column');
    }

    // Step 1: Add new_id column
    console.log('Step 1: Adding new_id column...');
    await client.query('ALTER TABLE "user" ADD COLUMN new_id uuid');
    console.log('Step 1: Done');

    // Step 2: Generate UUIDs for existing records using Node.js
    console.log('Step 2: Generating UUIDs...');
    const usersResult = await client.query('SELECT id FROM "user"');
    console.log(`Found ${usersResult.rows.length} users to migrate`);

    for (const row of usersResult.rows) {
      const newUuid = generateUUID();
      await client.query('UPDATE "user" SET new_id = $1 WHERE id = $2', [newUuid, row.id]);
    }
    console.log('Step 2: Done');

    // Step 3: Drop old primary key
    console.log('Step 3: Dropping old primary key...');
    await client.query('ALTER TABLE "user" DROP CONSTRAINT user_pkey');
    console.log('Step 3: Done');

    // Step 4: Set new_id as primary key
    console.log('Step 4: Setting new_id as primary key...');
    await client.query('ALTER TABLE "user" ALTER COLUMN new_id SET NOT NULL');
    await client.query('ALTER TABLE "user" ADD PRIMARY KEY (new_id)');
    console.log('Step 4: Done');

    // Step 5: Rename new_id to id
    console.log('Step 5: Renaming new_id to id...');
    await client.query('ALTER TABLE "user" RENAME COLUMN new_id TO id');
    console.log('Step 5: Done');

    // Step 6: Update publicId if NULL
    console.log('Step 6: Updating publicId...');
    const usersWithNullPublicId = await client.query('SELECT id FROM "user" WHERE "publicId" IS NULL');
    for (const row of usersResult.rows) {
      const newUuid = generateUUID();
      await client.query('UPDATE "user" SET "publicId" = $1 WHERE id = $2', [newUuid, row.id]);
    }
    console.log('Step 6: Done');

    // Step 7: Recreate foreign key constraints with new uuid type
    console.log('Step 7: Recreating foreign key constraints...');
    // This would need to be done for each dependent table
    console.log('Step 7: Done (manual recreation needed for FKs)');

    console.log('Migration completed successfully!');
    console.log('NOTE: Foreign key constraints have been dropped and need to be recreated.');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

migrate();
