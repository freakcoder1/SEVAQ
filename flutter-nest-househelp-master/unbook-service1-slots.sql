-- Unbook all slots for workers offering Service 1 on 2026-01-20
UPDATE "slot" 
SET "isBooked" = false 
FROM "worker" w
JOIN "service_worker" sw ON w.id = sw."worker_id"
WHERE "slot"."workerId" = w.id 
    AND sw."service_id" = 1 
    AND DATE("slot"."startTime") = '2026-01-20'
    AND "slot"."isBooked" = true;

-- Verify the changes
SELECT w.id, u."firstName", 
    SUM(CASE WHEN s."isBooked" = false THEN 1 ELSE 0 END) as available_slots,
    SUM(CASE WHEN s."isBooked" = true THEN 1 ELSE 0 END) as booked_slots
FROM "worker" w
JOIN "user" u ON w."userId" = u.id
JOIN "service_worker" sw ON w.id = sw."worker_id"
LEFT JOIN "slot" s ON w.id = s."workerId" 
    AND DATE(s."startTime") = '2026-01-20'
WHERE sw."service_id" = 1 AND w."isActive" = true AND w."isAvailable" = true
GROUP BY w.id, u."firstName"
ORDER BY w.id;
