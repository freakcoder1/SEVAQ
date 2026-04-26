async function start() {
  try {
    const runMigrations = require('./dist/run-migration.js');
    console.log('Starting database migrations...');
    await runMigrations();
    console.log('Migrations completed successfully. Starting NestJS application...');
    require('./dist/main.js');
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();
