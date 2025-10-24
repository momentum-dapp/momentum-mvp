-- Migration: Update users table for wallet-based authentication
-- This migration makes clerk_id nullable and ensures wallet_address is the primary identifier

-- Step 1: Make clerk_id nullable (if it isn't already)
ALTER TABLE users ALTER COLUMN clerk_id DROP NOT NULL;

-- Step 2: Ensure wallet_address has proper constraints
-- Add NOT NULL constraint to wallet_address if not exists
DO $$ 
BEGIN
    -- Try to add NOT NULL constraint if it doesn't exist
    BEGIN
        ALTER TABLE users ALTER COLUMN wallet_address SET NOT NULL;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'wallet_address is already NOT NULL or constraint failed';
    END;
END $$;

-- Step 3: Add unique constraint to wallet_address if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_wallet_address_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);
    END IF;
END $$;

-- Step 4: Create index on wallet_address for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Step 5: Update any existing users without wallet_address (optional cleanup)
-- This is commented out - only run if you know what you're doing
-- UPDATE users SET wallet_address = '0x' || md5(random()::text) WHERE wallet_address IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

