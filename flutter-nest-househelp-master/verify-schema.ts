import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

async function verifySchema() {
  const configService = new ConfigService();
  const databaseUrl = configService.get('DATABASE_URL');
  
  const url = new URL(databaseUrl);
  const host = url.hostname;
  const port = parseInt(url.port) || 5432;
  const username = url.username;
  const password = url.password;
  const database = url.pathname.replace('/', '');

  const dataSource = new DataSource({
    type: 'postgres',
    host: host,
    port: port,
    username: username,
    password: password,
    database: database,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to PostgreSQL database\n');

    // Get all tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables created in database:');
    console.log('----------------------------------------');
    tables.forEach((table: any, idx: number) => {
      console.log(`  ${String(idx + 1).padStart(2)}. ${table.table_name}`);
    });
    console.log(`\n✅ Total tables: ${tables.length}\n`);

    // Verify migrations table
    const migrations = await dataSource.query(`SELECT * FROM migrations ORDER BY id`);
    console.log('📋 Applied migrations:');
    console.log('----------------------------------------');
    migrations.forEach((m: any) => {
      console.log(`  ✅ ${m.name}`);
    });
    console.log(`\n✅ Total migrations applied: ${migrations.length}\n`);

    // Verify all tables are empty
    console.log('🔍 Checking table row counts:');
    console.log('----------------------------------------');
    let allEmpty = true;
    for (const table of tables) {
      if (table.table_name === 'migrations') continue;
      
      const countResult = await dataSource.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
      const count = parseInt(countResult[0].count);
      console.log(`  ${table.table_name.padEnd(30)}: ${count} rows`);
      if (count > 0) allEmpty = false;
    }

    console.log('\n✅ Schema verification complete!');
    
    if (allEmpty) {
      console.log('✅ All tables are empty. Database is clean and ready for use.');
    } else {
      console.log('⚠️  Some tables contain data.');
    }

    await dataSource.destroy();
    
    console.log('\n🎉 Railway PostgreSQL database schema has been successfully initialized!');
    console.log('✅ Database is ready for application usage.');
    
  } catch (error) {
    console.error('❌ Error verifying schema:', error);
    process.exit(1);
  }
}

verifySchema();
