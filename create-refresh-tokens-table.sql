-- Create refresh_tokens table for JWT refresh token mechanism
-- Run this script on your PostgreSQL database (sevaq_db)

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT FALSE,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint to users table
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY ("userId")
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create index on userId for faster lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens("userId");

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Create index on expiresAt for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens("expiresAt");
