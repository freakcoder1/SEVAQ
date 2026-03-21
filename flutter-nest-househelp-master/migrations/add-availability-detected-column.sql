-- Migration: Add availabilityDetectedAt column to subscriptions table
-- Run this in the PostgreSQL database (sevaq_db)

-- Add availabilityDetectedAt column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS availabilityDetectedAt TIMESTAMP DEFAULT NULL;

-- Verify the column was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name = 'availabilityDetectedAt';
