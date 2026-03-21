-- Migration script to convert user.id from integer to UUID
-- This script handles all dependent tables

-- Step 1: Create a new UUID column
ALTER TABLE "user" ADD COLUMN new_id uuid;

-- Step 2: Generate UUIDs for existing records (using gen_random_uuid())
UPDATE "user" SET new_id = gen_random_uuid();

-- Step 3: Set new_id as primary key and drop old id
ALTER TABLE "user" DROP CONSTRAINT user_pkey;
ALTER TABLE "user" ALTER COLUMN new_id SET NOT NULL;
ALTER TABLE "user" ADD PRIMARY KEY (new_id);

-- Step 4: Rename new_id to id
ALTER TABLE "user" RENAME COLUMN new_id TO id;

-- Step 5: Update publicId if it's NULL
UPDATE "user" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
