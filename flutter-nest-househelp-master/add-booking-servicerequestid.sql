-- Add serviceRequestId column to booking table
ALTER TABLE booking 
ADD COLUMN "serviceRequestId" INT;

-- Add foreign key constraint (if ServiceRequest table exists)
ALTER TABLE booking 
ADD CONSTRAINT "FK_booking_service_request" 
FOREIGN KEY ("serviceRequestId") 
REFERENCES "service_request" ("id") 
ON DELETE SET NULL;
