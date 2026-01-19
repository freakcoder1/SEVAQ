require('dotenv').config();

const { DataSource } = require('typeorm');
const { User } = require('./dist/src/users/entities/user.entity');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');

    // Create database connection
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'sevaq_db',
      entities: [
        'dist/**/*.entity.js'
      ],
      synchronize: false,
      logging: false
    });

    await dataSource.initialize();
    console.log('✅ Database connection established');

    const userRepository = dataSource.getRepository(User);
    const users = await userRepository.find();

    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`${i+1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, FirstName: ${user.firstName}, LastName: ${user.lastName}`);
      console.log(`   Password hash starts with: ${user.password.substring(0, 10)}...`);
    });

    await dataSource.destroy();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUsers();