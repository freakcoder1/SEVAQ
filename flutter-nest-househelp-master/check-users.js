const { DataSource } = require('typeorm');

async function checkUsers() {
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

  const users = await dataSource.query(`
    SELECT id, email, "firstName", "lastName", role, latitude, longitude
    FROM "user"
    WHERE role = 'user'
    ORDER BY "firstName"
  `);
  console.log('Users:', JSON.stringify(users, null, 2));

  await dataSource.destroy();
}

checkUsers().catch(console.error);
