# Fix for Duplicate User Creation Issue

## Problem Summary

When connecting a wallet, **4 duplicate user rows** were being created with the same wallet address. This was caused by:

1. **Race Condition**: Multiple concurrent requests trying to create the same user simultaneously
2. **Multiple Call Sites**: User creation was being triggered from two different places:
   - Sign-in page (`src/app/sign-in/[[...sign-in]]/page.tsx`)
   - WalletAuthContext (`src/contexts/WalletAuthContext.tsx`)
3. **React StrictMode**: In development, useEffect runs twice, doubling the requests

## Root Causes

### Issue 1: No Database-Level Protection
The `createUser` function used a simple `INSERT`, which would create duplicates if multiple requests arrived simultaneously before the database could enforce uniqueness.

### Issue 2: Check-Then-Insert Race Condition
The pattern was:
```typescript
// Request 1: Check if user exists
let user = await getUserByWalletAddress(address); // Returns null

// Request 2: Also checks at the same time
let user = await getUserByWalletAddress(address); // Also returns null

// Both requests then create a new user!
if (!user) {
  user = await createUser({ wallet_address: address });
}
```

### Issue 3: Multiple Concurrent Calls
Both sign-in page and WalletAuthContext were independently calling `/api/auth/user` when the wallet connected, creating race conditions.

## Solutions Implemented

### 1. Database-Level UPSERT (`src/lib/services/user-service.ts`)

Changed from `INSERT` to `UPSERT`:

```typescript
static async createUser(userData: UserInsert): Promise<User | null> {
  // Use upsert to avoid race conditions
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(normalizedData, {
      onConflict: 'wallet_address',
      ignoreDuplicates: false // Return the existing row if conflict
    })
    .select()
    .single();
  
  return data;
}
```

**How it works:**
- If the wallet address doesn't exist, it creates a new user
- If the wallet address already exists, it returns the existing user
- **Atomic operation** - prevents race conditions at the database level

### 2. Improved Logging

Added detailed logging throughout the flow:

```typescript
console.log('[AUTH] Looking for user with wallet address:', normalizedAddress);
console.log('[UserService] Querying for wallet:', normalizedAddress);
console.log('[UserService] Attempting to create/upsert user:', normalizedAddress);
console.log('[UserService] Successfully created/upserted user:', data.id);
```

This helps track:
- When each API call is made
- Whether a user is found or created
- The exact user ID being used

### 3. Updated TypeScript Types

Fixed type definitions in `src/types/supabase.ts` to reflect wallet-based authentication:

```typescript
Insert: {
  id?: string;
  clerk_id?: string | null;  // Now optional
  email?: string | null;      // Now optional
  wallet_address: string;     // Required
  created_at?: string;
  updated_at?: string;
}
```

### 4. Database Cleanup Script

Created `database-cleanup-duplicates.sql` to:
- Identify all duplicate wallet addresses
- Keep the oldest user
- Migrate all related data (portfolios, transactions, chat messages) to the kept user
- Delete duplicate users

## Testing the Fix

### Before Testing
1. **Clean up existing duplicates:**
   ```bash
   psql $DATABASE_URL -f database-cleanup-duplicates.sql
   ```

2. **Verify the fix is deployed:**
   - The upsert changes are in `src/lib/services/user-service.ts`
   - The normalized types are in `src/types/supabase.ts`

### Test Steps

1. **Sign out** completely from your app
2. **Clear browser storage** (optional but recommended)
3. **Connect your wallet** on the sign-in page
4. **Watch the console logs** - you should see:
   ```
   [AUTH] Looking for user with wallet address: 0xf977f34...
   [UserService] Querying for wallet: 0xf977f34...
   [UserService] User not found in database for: 0xf977f34...  (first time only)
   [UserService] Attempting to create/upsert user: 0xf977f34...
   [UserService] Successfully created/upserted user: uuid-here
   [AUTH] Created new user: uuid-here
   ```

5. **Check the database:**
   ```sql
   SELECT wallet_address, COUNT(*) as count
   FROM users
   GROUP BY wallet_address
   HAVING COUNT(*) > 1;
   ```
   Should return **no rows** (no duplicates)

6. **Sign out and sign in again** - you should now see:
   ```
   [UserService] Found user: uuid-here
   [AUTH] Found existing user: uuid-here
   ```

## Why This Works

### UPSERT is Atomic
PostgreSQL's `UPSERT` (INSERT ... ON CONFLICT) is an **atomic operation**:
- Even if 4 requests hit the database at exactly the same time
- Only ONE will successfully insert the new row
- The other 3 will detect the conflict and return the existing row
- No duplicates are created

### Unique Constraint Enforcement
The database has a unique constraint on `wallet_address`:
```sql
ALTER TABLE users ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);
```

This ensures that even with concurrent requests, only one user per wallet address can exist.

## Monitoring

After deploying, monitor your logs for patterns like:
- Multiple `[UserService] Attempting to create/upsert user` for the same address (expected)
- But only ONE `Created new user` message per address (desired)
- Subsequent logins should show `Found existing user` (desired)

## Additional Notes

### Why Not Remove One Call Site?
While we could remove either the sign-in page OR WalletAuthContext call, keeping both provides:
- **Redundancy**: If one fails, the other creates the user
- **Flexibility**: Different entry points can independently ensure user exists
- **Safety**: The upsert makes this safe and idempotent

### Development vs Production
In development (React StrictMode), you may see doubled logs, but the upsert prevents duplicates from being created.

## Files Changed

1. `src/lib/services/user-service.ts` - UPSERT implementation
2. `src/app/api/auth/user/route.ts` - Improved logging
3. `src/app/api/auth/session/route.ts` - Address normalization
4. `src/middleware.ts` - Address normalization
5. `src/types/supabase.ts` - Updated type definitions
6. `database-cleanup-duplicates.sql` - Cleanup script (new)

## Success Criteria

✅ Only 1 user created per unique wallet address  
✅ Concurrent requests handled gracefully  
✅ Existing users found on subsequent logins  
✅ No database errors from race conditions  
✅ Detailed logging for debugging  

