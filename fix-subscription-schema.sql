-- Migration script to fix subscriptions table schema

-- 1. First check current column types
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Drop the existing foreign key constraint if it exists
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_user;

-- 3. Change userId from integer to uuid
ALTER TABLE subscriptions ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;

-- 4. Add the foreign key constraint back (optional, if users table has uuid id)
-- ALTER TABLE subscriptions ADD CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(publicId);

-- 5. Now insert a test subscription for the correct user
INSERT INTO subscriptions (
    "publicId",
    "userId",
    "serviceProfileId",
    "preferredTimeWindow",
    "startDate",
    status,
    "billingCycle",
    "monthlyPriceSnapshot",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    'd4fc9e66-be02-48c2-9c1d-1521bbd44b16',
    1,
    'MORNING',
    CURRENT_DATE,
    'ACTIVE',
    'MONTHLY',
    8000.00,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE "userId" = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16'
);

-- 6. Verify the subscription
SELECT id, "userId", "monthlyPriceSnapshot", status
FROM subscriptions
WHERE "userId" = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16';
