-- Fix column naming issue: PostgreSQL lowercased unquoted identifiers
-- This script renames lowercase columns to proper camelCase

-- Drop the lowercase columns first (they may have data)
ALTER TABLE booking DROP COLUMN IF EXISTS assignmentstate;
ALTER TABLE booking DROP COLUMN IF EXISTS assignmenttype;
ALTER TABLE booking DROP COLUMN IF EXISTS assignmentexpiresat;
ALTER TABLE booking DROP COLUMN IF EXISTS assignmentstartsat;
ALTER TABLE booking DROP COLUMN IF EXISTS assignmenttimestamp;
ALTER TABLE booking DROP COLUMN IF EXISTS assignmentmetadata;
ALTER TABLE booking DROP COLUMN IF EXISTS assignmentreason;

-- Recreate columns with proper naming (using quoted identifiers for exact case)
ALTER TABLE booking ADD COLUMN "assignmentState" TEXT DEFAULT 'pending';
ALTER TABLE booking ADD COLUMN "assignmentType" TEXT;
ALTER TABLE booking ADD COLUMN "assignmentExpiresAt" TIMESTAMP;
ALTER TABLE booking ADD COLUMN "assignmentStartsAt" TIMESTAMP;
ALTER TABLE booking ADD COLUMN "assignmentTimestamp" TIMESTAMP;
ALTER TABLE booking ADD COLUMN "assignmentMetadata" TEXT;
ALTER TABLE booking ADD COLUMN "assignmentReason" TEXT;

-- Verify the columns were created correctly
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'booking'
  AND column_name LIKE 'assignment%'
ORDER BY column_name;
