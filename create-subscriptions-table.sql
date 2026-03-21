-- Create subscriptions table with UUID foreign keys
CREATE TABLE subscriptions (
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
CREATE INDEX idx_subscriptions_userId ON subscriptions("userId");
CREATE INDEX idx_subscriptions_publicId ON subscriptions("publicId");
CREATE INDEX idx_subscriptions_assignedWorkerId ON subscriptions("assignedWorkerId");
CREATE INDEX idx_subscriptions_status ON subscriptions("status");
