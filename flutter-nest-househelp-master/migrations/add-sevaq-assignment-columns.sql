-- Migration: Add SEVAQ Assignment Columns
-- Run this to add the required columns for the SEVAQ assignment system
-- Columns already defined in Booking entity but may not exist in database

-- Add assignmentType column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentType TEXT;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column assignmentType already exists in booking';
END $$;

-- Add assignmentExpiresAt column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentExpiresAt TIMESTAMP;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column assignmentExpiresAt already exists in booking';
END $$;

-- Add assignmentStartsAt column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentStartsAt TIMESTAMP;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column assignmentStartsAt already exists in booking';
END $$;

-- Add assignmentState column if it doesn't exist (update enum)
DO $$ BEGIN
    ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentState TEXT DEFAULT 'pending';
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column assignmentState already exists in booking';
END $$;

-- Add the new assignment states to the enum if using native enum
-- This is PostgreSQL-specific. If using TEXT column, no action needed.

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'booking'
  AND column_name IN ('assignmentType', 'assignmentExpiresAt', 'assignmentStartsAt', 'assignmentState')
ORDER BY column_name;

-- Add indexes for better query performance on the new columns
CREATE INDEX IF NOT EXISTS idx_booking_assignment_type ON booking(assignmentType);
CREATE INDEX IF NOT EXISTS idx_booking_assignment_state ON booking(assignmentState);
CREATE INDEX IF NOT EXISTS idx_booking_assignment_expires ON booking(assignmentExpiresAt);
CREATE INDEX IF NOT EXISTS idx_booking_assignment_starts ON booking(assignmentStartsAt);
