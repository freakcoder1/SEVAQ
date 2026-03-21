-- Migration: Change subscriptions.userId from integer to uuid
-- This fixes the type mismatch between subscriptions.userId and user.id
-- Executed: 2026-02-09

-- Step 1: Add temporary column for UUID values
ALTER TABLE "subscriptions" ADD COLUMN "userId_uuid" uuid;

-- Step 2: Update the temporary column with actual user UUIDs
-- This joins with user table to get the correct UUID for each subscription
UPDATE "subscriptions" s
SET "userId_uuid" = u.id
FROM "user" u
WHERE s."userId" = u.id::integer;

-- Step 3: Drop the foreign key constraint (if exists)
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK subscriptions.userId";

-- Step 4: Drop the old integer column
ALTER TABLE "subscriptions" DROP COLUMN "userId";

-- Step 5: Rename the temporary column
ALTER TABLE "subscriptions" RENAME COLUMN "userId_uuid" TO "userId";

-- Step 6: Add foreign key constraint
ALTER TABLE "subscriptions" 
ADD CONSTRAINT "FK_subscriptions_userId" 
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;

-- Verification query (run after migration)
-- SELECT data_type FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'userId';
-- SELECT s.id, s."userId", u.id, u."publicId" FROM "subscriptions" s JOIN "user" u ON s."userId" = u.id LIMIT 5;
