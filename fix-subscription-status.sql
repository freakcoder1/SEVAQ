-- Fix subscription status case sensitivity
UPDATE subscription 
SET status = 'ACTIVE' 
WHERE id IN (2, 3, 4, 5) 
AND status = 'active';

-- Verify the update
SELECT id, status, "workerId", "serviceId", "userId" 
FROM subscription 
ORDER BY id;
