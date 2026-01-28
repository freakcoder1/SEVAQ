const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'admin',
  port: 5432,
});

async function createTable() {
  console.log('Connecting to PostgreSQL...');
  
  try {
    const client = await pool.connect();
    
    console.log('Connected successfully!');
    
    // Enable UUID extension if not already enabled
    const enableUuidExtensionQuery = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";';
    console.log('Enabling UUID extension...');
    await client.query(enableUuidExtensionQuery);
    
    // Drop existing table if it has the wrong column type
    const dropTableQuery = 'DROP TABLE IF EXISTS service_requests CASCADE;';
    console.log('Dropping existing service_requests table...');
    await client.query(dropTableQuery);
    
    // Create service_requests table with correct column types
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS service_requests (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "userId" int NOT NULL,
        "serviceId" int NOT NULL,
        date date NOT NULL,
        "timeWindow" character varying(20) NOT NULL CHECK ("timeWindow" IN ('morning', 'afternoon', 'evening')),
        "priceSnapshot" numeric(10,2) NOT NULL,
        "assignmentStatus" character varying(20) DEFAULT 'REQUESTED' NOT NULL CHECK ("assignmentStatus" IN ('REQUESTED', 'ASSIGNED', 'FAILED_TO_ASSIGN')),
        "assignedWorkerId" int,
        "assignedSlotId" int,
        "failureReason" text,
        metadata json,
        "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
        "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
      );
    `;
    
    console.log('Creating service_requests table...');
    await client.query(createTableQuery);
    console.log('Table created successfully!');
    
    // Create indexes
    const createIndex1Query = 'CREATE INDEX IF NOT EXISTS "IDX_service_requests_userId_createdAt" ON service_requests ("userId", "createdAt");';
    const createIndex2Query = 'CREATE INDEX IF NOT EXISTS "IDX_service_requests_assignmentStatus_createdAt" ON service_requests ("assignmentStatus", "createdAt");';
    
    console.log('Creating indexes...');
    await client.query(createIndex1Query);
    await client.query(createIndex2Query);
    console.log('Indexes created successfully!');
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createTable();
