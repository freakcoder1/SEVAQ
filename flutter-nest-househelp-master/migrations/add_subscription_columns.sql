-- Migration: Add new subscription and service_profile columns
-- Run this in the PostgreSQL database (sevaq_db)

-- ============================================
-- Update service_profiles table
-- ============================================

-- Add visitPattern column
ALTER TABLE service_profiles
ADD COLUMN IF NOT EXISTS visitPattern VARCHAR DEFAULT 'DAILY';

-- Add maxVisitsPerDay column
ALTER TABLE service_profiles
ADD COLUMN IF NOT EXISTS maxVisitsPerDay INTEGER DEFAULT 1;

-- Add defaultTimeWindows column (JSON)
ALTER TABLE service_profiles
ADD COLUMN IF NOT EXISTS defaultTimeWindows JSONB;

-- ============================================
-- Update subscriptions table
-- ============================================

-- Add preferredTimeWindow column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS preferredTimeWindow VARCHAR;

-- Drop old columns that are no longer needed
-- Note: These are commented out to preserve data during migration
-- Uncomment if you're sure you want to drop them after data migration

-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS frequency;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS timeWindowStart;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS timeWindowEnd;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS customDays;

-- ============================================
-- Verify the changes
-- ============================================

-- Check service_profiles columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_profiles'
AND column_name IN ('visitPattern', 'maxVisitsPerDay', 'defaultTimeWindows');

-- Check subscriptions columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name IN ('preferredTimeWindow', 'frequency', 'timeWindowStart', 'timeWindowEnd');
