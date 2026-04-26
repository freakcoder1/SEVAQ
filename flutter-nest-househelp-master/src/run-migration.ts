import { AppDataSource } from './database/data-source';
import { MigrationExecutor } from 'typeorm';

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const migrationExecutor = new MigrationExecutor(AppDataSource);
    const migrations = await migrationExecutor.getPendingMigrations();

    if (migrations.length > 0) {
      console.log(
        `Found ${migrations.length} pending migrations. Running migrations...`,
      );
      await migrationExecutor.executePendingMigrations();
      console.log('Migrations have been executed successfully!');
    } else {
      console.log('No pending migrations found.');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

export = runMigrations;
