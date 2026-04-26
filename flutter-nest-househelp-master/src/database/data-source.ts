import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

// Support both DATABASE_URL (Railway) and individual DB_* variables
const databaseUrl = configService.get('DATABASE_URL');

let host = '';
let port = 5432;
let username = '';
let password = '';
let database = '';

// Always try to parse valid DATABASE_URL first when provided
// Fallback to individual DB_* variables only if parsing fails
if (databaseUrl) {
  // Parse DATABASE_URL (format: postgres://user:pass@host:port/database)
  try {
    const url = new URL(databaseUrl);
    host = url.hostname;
    port = parseInt(url.port) || 5432;
    username = url.username;
    password = url.password;
    // Handle both path-based and socket-based URLs
    let dbPath = url.pathname.replace('/', '');
    if (dbPath && !dbPath.includes('.')) {
      database = dbPath;
    } else {
      // Fall back to DB_NAME env or default
      database = configService.get('DB_NAME', 'railway');
    }
  } catch (e) {
    // If URL parsing fails, use fallback
    database = configService.get('DB_NAME', 'railway');
    host = configService.get('DB_HOST', 'localhost');
  }
}
// Fallback to individual DB_* variables only if no DATABASE_URL was provided or parsing failed
if (!host || !database) {
  host = configService.get('DB_HOST', 'localhost');
  port = configService.get<number>('DB_PORT', 5432);
  username = configService.get('DB_USERNAME', 'sevaq_user');
  password = configService.get('DB_PASSWORD', 'sevaq_password');
  database = configService.get('DB_NAME', 'sevaq_db');
}

// Connection retry configuration
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const CONNECTION_TIMEOUT_MS = 10000;

/**
 * Calculate exponential backoff delay with jitter
 * @param attempt - Current retry attempt (0-based)
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt),
    MAX_RETRY_DELAY_MS,
  );
  // Add jitter (±25% randomness)
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  return Math.max(100, exponentialDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Initialize DataSource with connection retry logic and exponential backoff
 */
export async function createAppDataSourceWithRetry(): Promise<DataSource> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateRetryDelay(attempt - 1);
        console.log(
          `[Database] Retry attempt ${attempt}/${MAX_RETRIES - 1}, waiting ${Math.round(delay)}ms before reconnecting...`,
        );
        await sleep(delay);
      }

      console.log(
        `[Database] Attempting connection (attempt ${attempt + 1}/${MAX_RETRIES})...`,
      );

      const dataSource = new DataSource({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'sevaq_user'),
        password: configService.get('DB_PASSWORD', 'sevaq_password'),
        database: configService.get('DB_NAME', 'sevaq_db'),
        entities: ['src/**/*.entity.ts'],
        migrations: ['src/database/migrations/*.ts'],
        // Connection pool settings
        extra: {
          connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
          max: 20, // Maximum number of connections in pool
          idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        },
        // Enable connection error logging
        logging: ['error', 'warn'],
      });

      await dataSource.initialize();

      // Set up connection pool monitoring
      setupConnectionMonitoring(dataSource);

      console.log('[Database] Successfully connected to database');
      return dataSource;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Database] Connection attempt ${attempt + 1} failed: ${lastError.message}`,
      );
    }
  }

  console.error(
    `[Database] Failed to connect after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`,
  );
  throw new Error(
    `Database connection failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
  );
}

/**
 * Set up connection pool monitoring and automatic reconnection
 */
function setupConnectionMonitoring(dataSource: DataSource): void {
  // Log pool status periodically
  const poolStatusInterval = setInterval(async () => {
    try {
      if (dataSource.isInitialized) {
        const queryRunner = dataSource.createQueryRunner();
        try {
          const result = await queryRunner.query(`
            SELECT 
              count(*) as total_connections,
              count(*) FILTER (WHERE state = 'active') as active_connections,
              count(*) FILTER (WHERE state = 'idle') as idle_connections,
              count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction_connections
            FROM pg_stat_activity 
            WHERE datname = current_database()
          `);
          console.log('[Database Pool Status]', result[0]);
        } finally {
          await queryRunner.release();
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('[Database Pool Status] Error checking pool status:', errorMessage);
    }
  }, 60000); // Check every 60 seconds

  // Prevent the interval from keeping the process alive
  if (poolStatusInterval.unref) {
    poolStatusInterval.unref();
  }
}

// Export the async factory function for use in the application
export { createAppDataSourceWithRetry as createDataSource };

// Keep backward compatibility - export a basic DataSource for migrations
export const AppDataSource = new DataSource({
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  migrationsRun: false,
  ssl: process.env.RAILWAY_ENVIRONMENT_ID || databaseUrl ? { rejectUnauthorized: false } : false,
  extra: process.env.RAILWAY_ENVIRONMENT_ID || databaseUrl ? {
    ssl: { rejectUnauthorized: false }
  } : {}
});
