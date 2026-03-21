-- Add version column to slot table for TypeORM @VersionColumn
ALTER TABLE slot ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
