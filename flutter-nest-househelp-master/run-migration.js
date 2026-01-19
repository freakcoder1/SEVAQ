const { execSync } = require('child_process');
const { DataSource } = require('typeorm');

async function runMigration() {
    try {
        console.log('Setting up database connection...');
        
        const dataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'househelp',
            entities: ['dist/**/*.entity{.ts,.js}'],
            synchronize: false,
            logging: false
        });

        await dataSource.initialize();
        console.log('Database connection established');

        // Update existing workers with default location data
        console.log('Updating existing workers with default location data...');
        await dataSource.query(`
            UPDATE "worker"
            SET
                "latitude" = 28.5804579,
                "longitude" = 77.4392951,
                "currentLat" = 28.5804579,
                "currentLng" = 77.4392951
            WHERE "latitude" IS NULL OR "longitude" IS NULL
        `);
        
        // Run the migration to add yearsOfExperience column
        console.log('Running migration to add yearsOfExperience column...');
        await dataSource.runMigrations();
        console.log('Migration completed successfully!');

        await dataSource.destroy();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();