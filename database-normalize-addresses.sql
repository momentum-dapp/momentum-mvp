-- Migration: Normalize all wallet addresses to lowercase for case-insensitive comparison
-- This fixes the issue where the same wallet address with different casing creates duplicate users

-- Step 1: Show current wallet addresses (for reference)
SELECT id, wallet_address, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 2: Update all wallet addresses to lowercase
UPDATE users 
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);

-- Step 3: Find and handle duplicate wallet addresses (same address with different casing)
-- This will identify duplicates that now have the same lowercase address
SELECT 
    LOWER(wallet_address) as normalized_address,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY created_at) as user_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as created_dates
FROM users
GROUP BY LOWER(wallet_address)
HAVING COUNT(*) > 1;

-- Step 4: (Optional) Merge duplicate users - COMMENTED OUT FOR SAFETY
-- This is a manual step - you need to decide which user to keep and migrate their data
-- Example: Keep the oldest user and delete newer duplicates
/*
DO $$
DECLARE
    duplicate_record RECORD;
    keep_user_id UUID;
    delete_user_ids UUID[];
BEGIN
    -- Find duplicates
    FOR duplicate_record IN
        SELECT 
            LOWER(wallet_address) as normalized_address,
            ARRAY_AGG(id ORDER BY created_at) as user_ids
        FROM users
        GROUP BY LOWER(wallet_address)
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (oldest) user
        keep_user_id := duplicate_record.user_ids[1];
        delete_user_ids := duplicate_record.user_ids[2:array_length(duplicate_record.user_ids, 1)];
        
        RAISE NOTICE 'Keeping user % and will delete %', keep_user_id, delete_user_ids;
        
        -- Migrate portfolios to the kept user
        UPDATE portfolios 
        SET user_id = keep_user_id 
        WHERE user_id = ANY(delete_user_ids);
        
        -- Migrate transactions to the kept user
        UPDATE transactions 
        SET user_id = keep_user_id 
        WHERE user_id = ANY(delete_user_ids);
        
        -- Migrate chat messages to the kept user
        UPDATE chat_messages 
        SET user_id = keep_user_id 
        WHERE user_id = ANY(delete_user_ids);
        
        -- Delete duplicate users (CASCADE will handle related records)
        DELETE FROM users WHERE id = ANY(delete_user_ids);
    END LOOP;
END $$;
*/

-- Step 5: Verify no duplicates remain
SELECT 
    wallet_address,
    COUNT(*) as count
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- Step 6: (Optional) Add a constraint to ensure wallet addresses are always lowercase
-- This is optional - the application now handles normalization
-- ALTER TABLE users ADD CONSTRAINT wallet_address_lowercase 
--     CHECK (wallet_address = LOWER(wallet_address));

