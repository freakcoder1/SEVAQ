-- Add serviceid UUID column to service_profiles table
ALTER TABLE service_profiles ADD COLUMN IF NOT EXISTS serviceid UUID;
