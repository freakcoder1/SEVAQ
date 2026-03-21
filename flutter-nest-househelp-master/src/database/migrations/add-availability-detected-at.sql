-- Migration: Add availabilityDetectedAt column to subscriptions
-- This enables the availability notification feature

ALTER TABLE subscriptions ADD COLUMN availabilityDetectedAt TIMESTAMP DEFAULT NULL;

-- Create index for faster queries on availability detection
CREATE INDEX IF NOT EXISTS idx_subscriptions_availability_detected 
ON subscriptions(availabilityDetectedAt) WHERE availabilityDetectedAt IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND column_name = 'availabilityDetectedAt';
