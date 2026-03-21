-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create service_profiles table
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
    "userId" UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "serviceProfileId" INTEGER REFERENCES service_profiles(id),
    location JSONB,
    "preferredtimewindow" VARCHAR(100) NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    "billingCycle" VARCHAR(50) NOT NULL DEFAULT 'monthly',
    "monthlyPriceSnapshot" DECIMAL(10,2) NOT NULL,
    "assignedWorkerId" UUID REFERENCES worker(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_publicId ON subscriptions("publicId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_assignedWorkerId ON subscriptions("assignedWorkerId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions("status");
