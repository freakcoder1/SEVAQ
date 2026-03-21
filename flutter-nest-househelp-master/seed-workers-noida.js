/**
 * Seed workers near Noida/Delhi (within 5-10km of 28.6139, 77.2090)
 * Run with: cd flutter-nest-househelp-master && node seed-workers-noida.js
 */

const { DataSource } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

async function seedWorkers() {
  console.log('🌱 Seeding workers near Noida/Delhi (28.6139, 77.2090)...');
  
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

  // Workers data - locations within 5-10km of user location (28.6139, 77.2090)
  const workers = [
    { firstName: 'Priya', lastName: 'Gupta', lat: 28.6180, lng: 77.2150, emailId: 50 },
    { firstName: 'Anita', lastName: 'Sharma', lat: 28.6100, lng: 77.2050, emailId: 51 },
    { firstName: 'Sunita', lastName: 'Kumari', lat: 28.6200, lng: 77.2200, emailId: 52 },
    { firstName: 'Meera', lastName: 'Devi', lat: 28.6080, lng: 77.2000, emailId: 53 },
    { firstName: 'Renu', lastName: 'Verma', lat: 28.6220, lng: 77.2250, emailId: 54 },
    { firstName: 'Sangeeta', lastName: 'Yadav', lat: 28.6150, lng: 77.2100, emailId: 55 },
    { firstName: 'Pushpa', lastName: 'Rani', lat: 28.6050, lng: 77.1950, emailId: 56 },
    { firstName: 'Kavita', lastName: 'Singh', lat: 28.6250, lng: 77.2300, emailId: 57 },
    { firstName: 'Geeta', lastName: 'Bala', lat: 28.6120, lng: 77.2020, emailId: 58 },
    { firstName: 'Sarita', lastName: 'Kaur', lat: 28.6190, lng: 77.2180, emailId: 59 },
  ];

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    const email = `worker.${worker.emailId}@sevaq.local`;
    
    console.log(`\n👷 Creating worker ${i + 1}: ${worker.firstName} ${worker.lastName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Location: ${worker.lat}, ${worker.lng}`);

    try {
      // Get user
      const existingUser = await dataSource.query(
        `SELECT id, latitude, longitude FROM "user" WHERE email = $1`,
        [email]
      );

      if (existingUser.length === 0) {
        console.log(`   ❌ User not found, skipping`);
        continue;
      }

      const userDbId = existingUser[0].id;
      console.log(`   📧 User ID: ${userDbId}`);

      // Check if worker record already exists for this user
      const existingWorker = await dataSource.query(
        `SELECT id FROM worker WHERE "user_id" = $1`,
        [userDbId]
      );

      if (existingWorker.length > 0) {
        console.log(`   ⚠️  Worker record already exists, skipping`);
        continue;
      }

      // Create worker record with currentLat/currentLng
      await dataSource.query(`
        INSERT INTO worker (id, "userId", "user_id", "yearsOfExperience", rating, "reviewCount", latitude, longitude, "currentLat", "currentLng", "isActive", "isAvailable", "isVerified", "isTrained", "isMonitored", "serviceRadiusKm", "createdAt", "updatedAt")
        VALUES ($1, $2, $2, 3, 4.5, 10, $3, $4, $3, $4, true, true, true, true, true, 15, NOW(), NOW())
      `, [uuidv4(), userDbId, worker.lat, worker.lng]);

      console.log(`   ✅ Worker record created`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Worker seeding completed!');
  await dataSource.destroy();
}

seedWorkers().catch(console.error);
