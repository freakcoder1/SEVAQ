-- Add publicId column to booking table
ALTER TABLE booking 
ADD COLUMN "publicId" UUID NOT NULL DEFAULT uuid_generate_v4();

-- Create unique index on publicId
CREATE UNIQUE INDEX idx_booking_publicid ON booking ("publicId");

-- Update existing records with UUIDs (if needed)
UPDATE booking 
SET "publicId" = uuid_generate_v4() 
WHERE "publicId" IS NULL;
