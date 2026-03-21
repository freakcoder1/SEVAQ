-- Add missing columns for SEVAQ assignment system
-- Run this to fix the database schema

-- Add assignmentType column to booking table
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentType VARCHAR(50);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentExpiresAt TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentStartsAt TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentReason TEXT;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS reassignmentCount INTEGER DEFAULT 0;

-- Update subscription entity references (fix property name)
-- The scheduler is looking for "serviceProfile" but entity has "serviceProfileId"
