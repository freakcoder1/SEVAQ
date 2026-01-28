const { Pool } = require('pg');
require('dotenv').config();

console.log('Connecting to PostgreSQL...');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'admin',
  port: 5432,
});

async function installExtensionAndCreateTable() {
  console.log('Connecting to PostgreSQL...');
  
  try {
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    // Install uuid-ossp extension
    console.log('Installing uuid-ossp extension...');
    const extensionResult = await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('Extension install result:', extensionResult.command);
    
    // Create service_requests table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS service_requests (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "userId" uuid NOT NULL,
        "serviceId" uuid NOT NULL,
        date date NOT NULL,
        "timeWindow" character varying(20) NOT NULL CHECK ("timeWindow" IN ('morning', 'afternoon', 'evening')),
        "priceSnapshot" numeric(10,2) NOT NULL,
        "assignmentStatus" character varying(20) DEFAULT 'REQUESTED' NOT NULL CHECK ("assignmentStatus" IN ('REQUESTED', 'ASSIGNED', 'FAILED_TO_ASSIGN')),
        "assignedWorkerId" uuid,
        "assignedSlotId" uuid,
        "failureReason" text,
        metadata json,
        "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
      );
    `;
    
    console.log('Creating service_requests table...');
    const tableResult = await client.query(createTableQuery);
    console.log('Table create result:', tableResult.command);
    
    // Create indexes
    const createIndex1Query = 'CREATE INDEX IF NOT EXISTS "IDX_service_requests_userId_createdAt" ON service_requests ("userId", "createdAt");';
    const createIndex2Query = 'CREATE INDEX IF NOT EXISTS "IDX_service_requests_assignmentStatus_createdAt" ON service_requests ("assignmentStatus", "createdAt");';
    
    console.log('Creating indexes...');
    const index1Result = await client.query(createIndex1Query);
    console.log('Index 1 create result:', index1Result.command);
    
    const index2Result = await client.query(createIndex2Query);
    console.log('Index 2 create result:', index2Result.command);
    
    client.release();
    console.log('All operations completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

installExtensionAndCreateTable().catch(err => {
  console.error('Top-level error:', err);
});
