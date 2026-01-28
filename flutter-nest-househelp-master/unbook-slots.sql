-- Unbook all slots for worker 2
UPDATE "slot" 
SET "isBooked" = false 
WHERE "workerId" = 2 AND "isBooked" = true;

-- Verify the changes
SELECT COUNT(*) AS "bookedSlots" 
FROM "slot" 
WHERE "workerId" = 2 AND "isBooked" = true;

SELECT COUNT(*) AS "availableSlots" 
FROM "slot" 
WHERE "workerId" = 2 AND "isBooked" = false;
