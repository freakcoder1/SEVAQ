-- Migration: Change booking.userId from integer to uuid
-- This fixes the type mismatch when creating subscription bookings
-- Executed: 2026-04-23

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "FK_336b3f4a235460dc93645fbf222";

-- Step 2: Alter the column type from integer to uuid
-- Since booking table is empty, we can directly alter the type
ALTER TABLE "booking" ALTER COLUMN "userId" TYPE uuid USING "userId"::text::uuid;

-- Step 3: Add foreign key constraint referencing user(publicId)
ALTER TABLE "booking" 
ADD CONSTRAINT "FK_336b3f4a235460dc93645fbf222" 
FOREIGN KEY ("userId") REFERENCES "user"("publicId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Verification queries (run after migration)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'booking' AND column_name = 'userId';
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'booking'::regclass AND contype = 'f' AND conname = 'FK_336b3f4a235460dc93645fbf222';
