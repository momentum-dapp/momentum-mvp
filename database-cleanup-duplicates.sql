-- Cleanup script for duplicate users with the same wallet address
-- Run this to clean up existing duplicates before testing the fix

-- Step 1: Check for duplicate wallet addresses
SELECT 
    wallet_address,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY created_at) as user_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as created_dates
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Step 2: For each duplicate, keep the oldest and delete the rest
DO $$
DECLARE
    duplicate_record RECORD;
    keep_user_id UUID;
    delete_user_ids UUID[];
    user_to_delete UUID;
BEGIN
    -- Find duplicates
    FOR duplicate_record IN
        SELECT 
            wallet_address,
            ARRAY_AGG(id ORDER BY created_at) as user_ids
        FROM users
        GROUP BY wallet_address
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (oldest) user
        keep_user_id := duplicate_record.user_ids[1];
        delete_user_ids := duplicate_record.user_ids[2:array_length(duplicate_record.user_ids, 1)];
        
        RAISE NOTICE 'Wallet: %, Keeping user % (oldest), deleting %', 
            duplicate_record.wallet_address, keep_user_id, delete_user_ids;
        
        -- Migrate all related data to the kept user
        FOREACH user_to_delete IN ARRAY delete_user_ids
        LOOP
            -- Migrate portfolios
            UPDATE portfolios 
            SET user_id = keep_user_id 
            WHERE user_id = user_to_delete;
            
            -- Migrate transactions
            UPDATE transactions 
            SET user_id = keep_user_id 
            WHERE user_id = user_to_delete;
            
            -- Migrate chat messages
            UPDATE chat_messages 
            SET user_id = keep_user_id 
            WHERE user_id = user_to_delete;
            
            -- Delete the duplicate user
            DELETE FROM users WHERE id = user_to_delete;
            
            RAISE NOTICE 'Deleted duplicate user %', user_to_delete;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Cleanup complete!';
END $$;

-- Step 3: Verify no duplicates remain
SELECT 
    wallet_address,
    COUNT(*) as count
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- Step 4: Show final user count
SELECT COUNT(*) as total_users FROM users;

-- Step 5: Verify the unique constraint exists
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'users'::regclass
    AND contype = 'u'; -- 'u' = unique constraint

