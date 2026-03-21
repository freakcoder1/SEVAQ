-- Add missing columns to user table in sev_aq database
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "publicId" uuid;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "fcmToken" text;
