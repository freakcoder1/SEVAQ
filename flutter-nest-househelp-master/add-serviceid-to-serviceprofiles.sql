-- Add service_id (UUID) column to service_profiles
ALTER TABLE "service_profiles" ADD COLUMN IF NOT EXISTS "serviceId" uuid REFERENCES "service"(id);

-- First, let's see what services exist
SELECT id, name, category FROM "service";

-- Get the UUIDs for services by category
-- Map: COOK -> Cooking service, CLEANING -> Cleaning service

-- Update service_profiles with proper service UUIDs based on category matching
UPDATE "service_profiles" sp
SET "serviceId" = (
  SELECT s.id FROM "service" s 
  WHERE s.category = sp."serviceType" 
  LIMIT 1
)
WHERE sp."serviceId" IS NULL;

-- For any that still don't have a service, default to the first service
UPDATE "service_profiles"
SET "serviceId" = (SELECT id FROM "service" LIMIT 1)
WHERE "serviceId" IS NULL;

-- Verify the mapping
SELECT sp.id, sp."serviceType", sp."profileName", sp."serviceId", s.name as service_name
FROM "service_profiles" sp
LEFT JOIN "service" s ON sp."serviceId" = s.id;
