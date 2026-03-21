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

    // Add all missing assignment-related columns
    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS assignmentType TEXT DEFAULT 'direct'
    `);
    console.log('Added assignmentState column');

    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS assignmentExpiresAt TIMESTAMP
    `);
    console.log('Added assignmentExpiresAt column');

    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS assignmentStartsAt TIMESTAMP
    `);
    console.log('Added assignmentStartsAt column');

    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS assignedWorkerId INTEGER
    `);
    console.log('Added assignedWorkerId column');

    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS assignmentReason TEXT
    `);
    console.log('Added assignmentReason column');

    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS reassignmentCount INTEGER DEFAULT 0
    `);
    console.log('Added reassignmentCount column');

    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS assignmentTimestamp TIMESTAMP
    `);
    console.log('Added assignmentTimestamp column');

    await dataSource.query(`
      ALTER TABLE booking
      ADD COLUMN IF NOT EXISTS assignmentMetadata TEXT
    `);
    console.log('Added assignmentMetadata column');

    await dataSource.destroy();
    console.log('Done - all assignment columns added');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
