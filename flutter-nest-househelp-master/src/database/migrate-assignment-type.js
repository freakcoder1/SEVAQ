const { DataSource } = require('typeorm');
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'househelp',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});

async function runMigration() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS assignmentType VARCHAR(255) DEFAULT NULL
    `);
    console.log('Added assignmentType column to booking table');

    await dataSource.destroy();
    console.log('Done');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
