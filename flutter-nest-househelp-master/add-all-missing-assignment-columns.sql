-- Add all missing assignment columns for SEVAQ assignment system
-- Run this to fix the database schema for assignment-related errors

-- Add assignmentState column (tracks assignment workflow state)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentState TEXT DEFAULT 'pending';

-- Add assignmentType column (PROVISIONAL for one-time, PRIMARY for subscriptions)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentType TEXT;

-- Add assignmentExpiresAt column (for provisional assignments - payment timeout)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentExpiresAt TIMESTAMP;

-- Add assignmentStartsAt column (for primary assignments - subscription start)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentStartsAt TIMESTAMP;

-- Add assignedWorkerId column (explicit worker assignment tracking)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignedWorkerId INTEGER;

-- Add assignmentReason column (reason for assignment/reassignment)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentReason TEXT;

-- Add reassignmentCount column (tracks number of reassignments)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS reassignmentCount INTEGER DEFAULT 0;

-- Add assignmentTimestamp column (when assignment occurred)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentTimestamp TIMESTAMP;

-- Add assignmentMetadata column (JSON metadata for assignment details)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentMetadata TEXT;

-- Verify columns were added successfully
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'booking'
  AND column_name LIKE 'assignment%'
ORDER BY column_name;
