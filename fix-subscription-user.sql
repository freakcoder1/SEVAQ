-- Check current subscriptions
SELECT id, userId, monthly_price_snapshot, status FROM subscriptions WHERE userId = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16';

-- If no subscription exists for this user, create one
-- First check if service profile 1 exists
SELECT id, profile_name, price FROM service_profiles WHERE id = 1;

-- Insert a subscription for the correct user if it doesn't exist
INSERT INTO subscriptions (
    public_id,
    user_id,
    service_profile_id,
    preferred_time_window,
    start_date,
    status,
    billing_cycle,
    monthly_price_snapshot,
    created_at,
    updated_at
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
    SELECT 1 FROM subscriptions WHERE user_id = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16'
);

-- Verify the subscription was created
SELECT id, user_id, monthly_price_snapshot, status FROM subscriptions WHERE user_id = 'd4fc9e66-be02-48c2-9c1d-1521bbd44b16';
