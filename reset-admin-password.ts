
const bcrypt = require('bcrypt');
const { AppDataSource } = require('./flutter-nest-househelp-master/dist/database/data-source');
const { User } = require('./flutter-nest-househelp-master/dist/users/entities/user.entity');

async function resetAdminPassword() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    console.log('Looking for admin user...');
    const userRepository = AppDataSource.getRepository(User);
    let adminUser = await userRepository.findOne({ where: { role: 'admin' } });

    if (!adminUser) {
      console.log('No admin user found, creating default admin account...');
      adminUser = new User();
      adminUser.email = 'admin@sevaq.com';
      adminUser.firstName = 'Admin';
      adminUser.lastName = 'User';
      adminUser.role = 'admin';
      adminUser.phone = '+919876543210';
    }

    const plainPassword = 'Admin@123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    adminUser.password = hashedPassword;
    await userRepository.save(adminUser);

    console.log('\n✅ Admin password reset successfully!');
    console.log('-------------------------------------');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${plainPassword}`);
    console.log(`Password Hash: ${hashedPassword}`);
    console.log('-------------------------------------\n');

    // Verify password hash matches
    const isMatch = await bcrypt.compare(plainPassword, adminUser.password);
    console.log(`Password hash verification: ${isMatch ? '✅ VALID' : '❌ INVALID'}`);

    await AppDataSource.destroy();
    console.log('\nOperation completed.');

  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
