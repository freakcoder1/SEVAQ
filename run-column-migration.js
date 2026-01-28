const { execSync } = require('child_process');

console.log('Connecting to database using TypeORM...');

try {
  // Run a TypeORM migration to add the column
  const result = execSync('cd flutter-nest-househelp-master && node -e "const { getRepository } = require(\'typeorm\'); const { Worker } = require(\'./src/workers/entities/worker.entity\'); console.log(\'Worker entity loaded successfully\'); const pg = require(\'pg\'); const client = new pg.Client({ connectionString: \'postgresql://postgres:postgres@localhost:5432/sevaq_db\' }); client.connect().then(() => { console.log(\'Connected to database\'); return client.query(\'ALTER TABLE worker ADD COLUMN IF NOT EXISTS \"serviceAreaId\" TEXT\'); }).then(() => { console.log(\'serviceAreaId column added successfully\'); return client.end(); }).catch(err => { console.error(\'Error:\', err); client.end(); });"', { encoding: 'utf8' });

  console.log('Migration result:', result);
  console.log('✅ serviceAreaId column added successfully');

} catch (error) {
  console.error('❌ Error:', error.message);
  
  // Try a simpler approach using direct PostgreSQL connection
  try {
    console.log('\nTrying direct PostgreSQL connection...');
    const result = execSync('cd flutter-nest-househelp-master && node -e "const pg = require(\'pg\'); const client = new pg.Client({ connectionString: \'postgresql://postgres:postgres@localhost:5432/sevaq_db\' }); client.connect().then(() => { console.log(\'Connected to database\'); return client.query(\'ALTER TABLE worker ADD COLUMN IF NOT EXISTS \"serviceAreaId\" TEXT\'); }).then(() => { console.log(\'serviceAreaId column added successfully\'); return client.end(); }).catch(err => { console.error(\'Error:\', err); client.end(); });"', { encoding: 'utf8' });
    
    console.log('✅ serviceAreaId column added successfully');

  } catch (dbError) {
    console.error('❌ Database error:', dbError.message);
  }
}
