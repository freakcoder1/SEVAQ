const { DataSource } = require('typeorm');

async function fixUserLocations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'househelp',
    synchronize: false,
  });

  await dataSource.initialize();

  // Get all users with their location status
  const users = await dataSource.query(`
    SELECT id, email, "firstName", "lastName", latitude, longitude, "hasCompletedLocationSetup"
    FROM "user"
    ORDER BY id
  `);
  console.log('Users and their locations:');
  users.forEach(u => {
    console.log(`  ${u.email}: lat=${u.latitude}, lng=${u.longitude}, setup=${u.hasCompletedLocationSetup}`);
  });

  // Update all users with location (28.6139, 77.2090 - Noida)
  const testUsers = users.filter(u => u.email && u.email.includes('test') || u.email === 'test@example.com');
  console.log('\nTest users:', testUsers.map(u => u.email));

  // Update first user with location
  if (users.length > 0) {
    const userId = users[0].id;
    await dataSource.query(`
      UPDATE "user"
      SET latitude = $1, longitude = $2, "hasCompletedLocationSetup" = true
      WHERE id = $3
    `, [28.6139, 77.2090, userId]);
    console.log(`\n✅ Updated user ${users[0].email} with location (28.6139, 77.2090)`);
  }

  // Update all users without location
  for (const user of users) {
    if (!user.latitude) {
      await dataSource.query(`
        UPDATE "user"
        SET latitude = $1, longitude = $2, "hasCompletedLocationSetup" = true
        WHERE id = $3
      `, [28.6139 + (Math.random() - 0.5) * 0.01, 77.2090 + (Math.random() - 0.5) * 0.01, user.id]);
      console.log(`✅ Updated user ${user.email} with location`);
    }
  }

  await dataSource.destroy();
  console.log('\n🎉 All users now have locations!');
}

fixUserLocations().catch(console.error);
