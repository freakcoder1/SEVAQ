-- Migration: Add performance indexes for slot entity
-- Created: 2026-02-01
-- Description: Adds composite indexes to optimize slot lookup queries for worker availability

-- Check if indexes already exist before creating
DO $$
BEGIN
    -- Index for slot lookup queries (worker + startTime + isBooked)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_slot_worker_starttime_isbooked'
    ) THEN
        CREATE INDEX idx_slot_worker_starttime_isbooked 
        ON slot ("workerId", "startTime", "isBooked");
    END IF;

    -- Index for date-based availability queries (worker + date + isBooked)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_slot_worker_date_isbooked'
    ) THEN
        CREATE INDEX idx_slot_worker_date_isbooked 
        ON slot ("workerId", date, "isBooked");
    END IF;

    -- Index for publicId lookups (used in API endpoints)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_slot_publicid'
    ) THEN
        CREATE INDEX idx_slot_publicid 
        ON slot ("publicId");
    END IF;

    -- Index for date range queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_slot_date'
    ) THEN
        CREATE INDEX idx_slot_date 
        ON slot (date);
    END IF;

    -- Index for availability checks
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_slot_isbooked'
    ) THEN
        CREATE INDEX idx_slot_isbooked 
        ON slot ("isBooked") 
        WHERE "isBooked" = false;
    END IF;
END $$;

-- Add comment to document the migration
COMMENT ON TABLE slot IS 'Slot table with performance indexes for worker availability queries';

-- Verify indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'slot'
ORDER BY indexname;
