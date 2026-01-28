-- Create service_profiles table
CREATE TABLE IF NOT EXISTS "service_profiles" (
  "id" SERIAL PRIMARY KEY,
  "publicId" VARCHAR(255) NOT NULL UNIQUE,
  "serviceType" VARCHAR(50) NOT NULL,
  "profileName" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "scopeDefinition" TEXT,
  "maxCapacityHint" VARCHAR(255),
  "internalRules" JSONB,
  "monthlyPrice" DECIMAL(10, 2) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "publicId" VARCHAR(255) NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "serviceProfileId" INTEGER NOT NULL REFERENCES "service_profiles"(id) ON DELETE CASCADE,
  "frequency" VARCHAR(50) NOT NULL,
  "timeWindowStart" TIME,
  "timeWindowEnd" TIME,
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "status" VARCHAR(50) DEFAULT 'ACTIVE',
  "billingCycle" VARCHAR(50) DEFAULT 'MONTHLY',
  "monthlyPriceSnapshot" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for service_profiles
CREATE INDEX idx_service_profiles_service_type ON "service_profiles"("serviceType");
CREATE INDEX idx_service_profiles_is_active ON "service_profiles"("isActive");

-- Create index for subscriptions
CREATE INDEX idx_subscriptions_user_id ON "subscriptions"("userId");
CREATE INDEX idx_subscriptions_service_profile_id ON "subscriptions"("serviceProfileId");
CREATE INDEX idx_subscriptions_status ON "subscriptions"("status");

-- Insert predefined service profiles for cooking
INSERT INTO "service_profiles" ("publicId", "serviceType", "profileName", "description", "scopeDefinition", "maxCapacityHint", "internalRules", "monthlyPrice", "isActive") VALUES
('cook-basic', 'COOK', 'BASIC', 'Basic cooking service including breakfast and dinner', 'Prepares 2 meals per day (breakfast and dinner) with basic menu items. Includes serving and basic cleaning of utensils used for cooking.', '1-2 people', '{"mealCount": 2, "cuisine": ["North Indian", "South Indian"], "prepTime": 30, "cleanup": true}', 3500.00, true),
('cook-standard', 'COOK', 'STANDARD', 'Standard cooking service with 3 meals per day', 'Prepares 3 meals per day (breakfast, lunch, and dinner) with varied menu options. Includes serving and complete cleaning of cooking utensils.', '2-4 people', '{"mealCount": 3, "cuisine": ["North Indian", "South Indian", "Chinese"], "prepTime": 45, "cleanup": true, "menuVariety": "moderate"}', 5500.00, true),
('cook-extended', 'COOK', 'EXTENDED', 'Extended cooking service with 3 meals per day and special requests', 'Prepares 3 meals per day with customized menu options based on dietary preferences. Includes serving, complete cleaning, and basic kitchen maintenance.', '4-6 people', '{"mealCount": 3, "cuisine": ["North Indian", "South Indian", "Chinese", "Continental"], "prepTime": 60, "cleanup": true, "menuVariety": "high", "specialRequests": true}', 8000.00, true);

-- Insert predefined service profiles for cleaning
INSERT INTO "service_profiles" ("publicId", "serviceType", "profileName", "description", "scopeDefinition", "maxCapacityHint", "internalRules", "monthlyPrice", "isActive") VALUES
('cleaning-compact', 'CLEANING', 'COMPACT', 'Compact cleaning service for small homes', 'Basic cleaning of living room, kitchen, and 1 bathroom. Includes dusting, sweeping, mopping, and wiping surfaces.', '1 BHK', '{"rooms": 2, "bathrooms": 1, "frequency": "daily", "tasks": ["dusting", "sweeping", "mopping"]}', 3000.00, true),
('cleaning-standard', 'CLEANING', 'STANDARD', 'Standard cleaning service for average-sized homes', 'Comprehensive cleaning of living room, kitchen, 2 bathrooms, and bedrooms. Includes dusting, sweeping, mopping, wiping surfaces, and basic organization.', '2 BHK', '{"rooms": 4, "bathrooms": 2, "frequency": "daily", "tasks": ["dusting", "sweeping", "mopping", "surface cleaning"]}', 5000.00, true),
('cleaning-extended', 'CLEANING', 'EXTENDED', 'Extended cleaning service for large homes', 'Deep cleaning of all rooms including living room, kitchen, 3 bathrooms, bedrooms, and balconies. Includes dusting, sweeping, mopping, wiping surfaces, organization, and window cleaning.', '3+ BHK', '{"rooms": 6, "bathrooms": 3, "frequency": "daily", "tasks": ["dusting", "sweeping", "mopping", "surface cleaning", "window cleaning"]}', 8000.00, true);
