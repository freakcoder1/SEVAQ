-- Update the timeWindow check constraint to include early-morning
ALTER TABLE service_requests 
DROP CONSTRAINT IF EXISTS "service_requests_timeWindow_check";

ALTER TABLE service_requests 
ADD CONSTRAINT "service_requests_timeWindow_check" 
CHECK ("timeWindow" IN ('morning', 'afternoon', 'evening', 'early-morning'));

-- Verify the change
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'service_requests'::regclass 
AND conname = 'service_requests_timeWindow_check';