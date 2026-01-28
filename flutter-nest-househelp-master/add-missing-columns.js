const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'sevaq_db'
});

async function addMissingColumns() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add address column to user table if it doesn't exist
    console.log('Adding address column to user table...');
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "address" varchar NULL;
    `);

    // Add preferredZoneId column to user table if it doesn't exist
    console.log('Adding preferredZoneId column to user table...');
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "preferredZoneId" integer NULL;
    `);

    // Add locationHistory column to user table if it doesn't exist
    console.log('Adding locationHistory column to user table...');
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "locationHistory" json NULL;
    `);

    // Add yearsOfExperience column to worker table if it doesn't exist
    console.log('Adding yearsOfExperience column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "yearsOfExperience" integer NOT NULL DEFAULT 0;
    `);

    // Add homesServedInArea column to worker table if it doesn't exist
    console.log('Adding homesServedInArea column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "homesServedInArea" integer NOT NULL DEFAULT 0;
    `);

    // Add reassuranceText column to service table if it doesn't exist
    console.log('Adding reassuranceText column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "reassuranceText" text NULL;
    `);

    // Add whatWillHappen column to service table if it doesn't exist
    console.log('Adding whatWillHappen column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "whatWillHappen" text NULL;
    `);

    // Add whatWillNotHappen column to service table if it doesn't exist
    console.log('Adding whatWillNotHappen column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "whatWillNotHappen" text NULL;
    `);

    // Add ifSomethingGoesWrong column to service table if it doesn't exist
    console.log('Adding ifSomethingGoesWrong column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "ifSomethingGoesWrong" text NULL;
    `);

    // Add amount column to booking table if it doesn't exist
    console.log('Adding amount column to booking table...');
    await client.query(`
      ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "amount" numeric NOT NULL DEFAULT 0;
    `);

    // Add isPaid column to booking table if it doesn't exist
    console.log('Adding isPaid column to booking table...');
    await client.query(`
      ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "isPaid" boolean NOT NULL DEFAULT false;
    `);

    // Add subcategory column to service table if it doesn't exist
    console.log('Adding subcategory column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "subcategory" varchar NULL;
    `);

    // Add reliabilityStreak column to worker table if it doesn't exist
    console.log('Adding reliabilityStreak column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "reliabilityStreak" integer NOT NULL DEFAULT 0;
    `);

    // Add isVerified column to worker table if it doesn't exist
    console.log('Adding isVerified column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "isVerified" boolean NOT NULL DEFAULT false;
    `);

    // Add isTrained column to worker table if it doesn't exist
    console.log('Adding isTrained column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "isTrained" boolean NOT NULL DEFAULT false;
    `);

    // Add isMonitored column to worker table if it doesn't exist
    console.log('Adding isMonitored column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "isMonitored" boolean NOT NULL DEFAULT false;
    `);

    // Add isAvailable column to service table if it doesn't exist
    console.log('Adding isAvailable column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "isAvailable" boolean NOT NULL DEFAULT true;
    `);

    // Add isFastBooking column to service table if it doesn't exist
    console.log('Adding isFastBooking column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "isFastBooking" boolean NOT NULL DEFAULT false;
    `);

    // Add estimatedWaitTime column to service table if it doesn't exist
    console.log('Adding estimatedWaitTime column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "estimatedWaitTime" integer NOT NULL DEFAULT 0;
    `);

    // Add workerCount column to service table if it doesn't exist
    console.log('Adding workerCount column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "workerCount" integer NOT NULL DEFAULT 0;
    `);

    // Add imageUrl column to service table if it doesn't exist
    console.log('Adding imageUrl column to service table...');
    await client.query(`
      ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "imageUrl" varchar NULL;
    `);

    // Add latitude and longitude columns to worker table if they don't exist
    console.log('Adding latitude column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "latitude" numeric NULL;
    `);

    console.log('Adding longitude column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "longitude" numeric NULL;
    `);

    console.log('Columns added successfully!');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await client.end();
  }
}

addMissingColumns();