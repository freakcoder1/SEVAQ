-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create service_profiles table (referenced by subscriptions)
CREATE TABLE IF NOT EXISTS service_profiles (
    id SERIAL PRIMARY KEY,
    "publicId" UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    "serviceType" VARCHAR(100) NOT NULL,
    "profileName" VARCHAR(200) NOT NULL,
    description TEXT,
    "scopeDefinition" TEXT,
    "maxCapacityHint" INTEGER,
    "internalRules" TEXT,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "visitpattern" VARCHAR(50) NOT NULL,
    "maxvisitsperday" INTEGER NOT NULL,
    "defaulttimewindows" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    "publicId" UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    "userId" INTEGER NOT NULL REFERENCES "user"(id),
    "serviceProfileId" INTEGER REFERENCES service_profiles(id),
    location JSONB,
    "preferredtimewindow" VARCHAR(100) NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    "billingCycle" VARCHAR(50) NOT NULL DEFAULT 'monthly',
    "monthlyPriceSnapshot" DECIMAL(10,2) NOT NULL,
    "assignedWorkerId" INTEGER REFERENCES worker(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for userId
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscription_user;
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscription_user FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_publicId ON subscriptions("publicId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_assignedWorkerId ON subscriptions("assignedWorkerId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions("status");

-- Insert some sample service profiles for testing
INSERT INTO service_profiles ("serviceType", "profileName", description, "monthlyPrice", "visitpattern", "maxvisitsperday", "defaulttimewindows")
VALUES
('cleaning', 'Basic Cleaning', 'Standard home cleaning service', 2999.00, 'daily', 1, '["09:00-11:00", "14:00-16:00", "16:00-18:00"]'),
('cleaning', 'Premium Cleaning', 'Deep cleaning with premium products', 4999.00, 'daily', 1, '["08:00-10:00", "10:00-12:00", "14:00-16:00"]'),
('cooking', 'Basic Cooking', 'Standard meal preparation', 3999.00, 'alternate_days', 15, '["07:00-09:00", "17:00-19:00"]'),
('cooking', 'Full-Time Cooking', 'Complete kitchen management', 7999.00, 'daily', 1, '["06:00-08:00", "11:00-13:00", "17:00-19:00"]'),
('babysitting', 'Babysitting', 'Child care services', 5999.00, 'alternate_days', 15, '["07:00-10:00", "16:00-19:00", "19:00-22:00"]'),
('eldercare', 'Elder Care', 'Senior citizen assistance', 6999.00, 'daily', 1, '["08:00-12:00", "17:00-20:00"]')
ON CONFLICT DO NOTHING;
