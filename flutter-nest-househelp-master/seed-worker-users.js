/**
 * Add user records for existing workers that don't have them
 * Run with: cd flutter-nest-househelp-master && node seed-worker-users.js
 */

const { DataSource } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

async function seedWorkerUsers() {
  console.log('🌱 Adding user records for existing workers...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'househelp',
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log('✅ Connected to database');

  // Get all workers without user records
  const workers = await dataSource.query(`
    SELECT w.id, w."userId", w."user_id" 
    FROM worker w 
    WHERE w."userId" IS NULL OR w."user_id" IS NULL
  `);

  console.log(`Found ${workers.length} workers without user records`);

  const workerNames = ['Priya', 'Anita', 'Sunita', 'Meera', 'Renu', 'Sangeeta'];
  
  // Pre-hashed password (same as bcrypt hash for 'worker123')
  const hashedPassword = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8HzPwZSTQI/6mC';

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    const name = workerNames[i % workerNames.length];
    const email = `worker.auto.${worker.id}@sevaq.local`;
    
    console.log(`\n👷 Processing worker ID: ${worker.id}`);
    console.log(`   Email: ${email}`);

    try {
      // Check if user already exists with this email
      const existingUser = await dataSource.query(
        `SELECT id FROM "user" WHERE email = $1`,
        [email]
      );

      if (existingUser.length > 0) {
        console.log(`   ⚠️  User already exists with ID: ${existingUser[0].id}`);
        const userDbId = existingUser[0].id;
        
        // Update worker with user_id
        await dataSource.query(`
          UPDATE worker SET "userId" = $1, "user_id" = $1 WHERE id = $2
        `, [userDbId, worker.id]);
        
        console.log(`   ✅ Worker updated with user reference`);
        continue;
      }

      // Create user with hashed password
      const userPublicId = uuidv4();
      
      await dataSource.query(`
        INSERT INTO "user" (id, "publicId", email, password, "firstName", "lastName", role, latitude, longitude, "preferredLat", "preferredLng", "hasCompletedLocationSetup", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'worker', 28.6139, 77.2090, 28.6139, 77.2090, true, NOW(), NOW())
      `, [userPublicId, userPublicId, email, hashedPassword, name, 'Worker']);
      
      console.log(`   ✅ User created with ID: ${userPublicId}`);

      // Update worker with user_id
      await dataSource.query(`
        UPDATE worker SET "userId" = $1, "user_id" = $1 WHERE id = $2
      `, [userPublicId, worker.id]);
      
      console.log(`   ✅ Worker ${worker.id} updated with user reference`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Also link workers that have userId but need user_id
  try {
    await dataSource.query(`
      UPDATE worker w
      SET "user_id" = w."userId"
      WHERE w."user_id" IS NULL AND w."userId" IS NOT NULL
    `);
    console.log('\n✅ Updated workers with missing user_id references');
  } catch (error) {
    console.error(`❌ Error updating user_id references: ${error.message}`);
  }

  console.log('\n✅ Worker user seeding completed!');
  await dataSource.destroy();
}

seedWorkerUsers().catch(console.error);
