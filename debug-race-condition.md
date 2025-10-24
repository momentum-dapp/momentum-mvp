# Debug: Race Condition Creating 4 Duplicate Users

## The Problem

Even with check-then-insert and error handling, 4 duplicate rows are still being created.

## Root Cause Analysis

### Timeline of What's Happening:

```
Time 0ms: User connects wallet
├─ Sign-in page useEffect fires (Request 1)
├─ WalletAuthContext useEffect fires (Request 2)
├─ React StrictMode doubles both → (Request 3, Request 4)
│
├─ All 4 requests hit /api/auth/user simultaneously
│  
├─ Request 1: getUserByWalletAddress() → returns null
├─ Request 2: getUserByWalletAddress() → returns null  
├─ Request 3: getUserByWalletAddress() → returns null
├─ Request 4: getUserByWalletAddress() → returns null
│  
├─ All pass the "if (!user)" check
│  
├─ Request 1: INSERT → succeeds ✓
├─ Request 2: INSERT → should fail with 23505... but doesn't?
├─ Request 3: INSERT → should fail with 23505... but doesn't?
├─ Request 4: INSERT → should fail with 23505... but doesn't?
```

## Why the Unique Constraint Isn't Working

**Hypothesis 1: The unique constraint doesn't exist in the actual database**

Check:
```sql
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass;
```

**Hypothesis 2: The wallet addresses being inserted have slight differences**

- Maybe not all being normalized to lowercase?
- Check the actual inserted values

**Hypothesis 3: Transaction isolation levels**

- Multiple INSERTs in parallel transactions might all see "no row exists" before any commits
- Need serializable isolation or explicit locking

## Immediate Solution

Instead of check-then-insert, use PostgreSQL's `INSERT ... ON CONFLICT`:

```sql
INSERT INTO users (wallet_address, email, clerk_id, created_at, updated_at)
VALUES ($1, $2, $3, NOW(), NOW())
ON CONFLICT (wallet_address) 
DO UPDATE SET updated_at = NOW()
RETURNING *;
```

This is **atomic** - handled entirely by PostgreSQL in a single operation, no race condition possible.

## Implementation

Change the Supabase query to use upsert:

```typescript
const { data, error } = await supabaseAdmin
  .from('users')
  .upsert(normalizedData, {
    onConflict: 'wallet_address',
    ignoreDuplicates: false
  })
  .select()
  .single();
```

## Debug Steps

1. **Check database constraints:**
   ```bash
   psql $DATABASE_URL -c "\d users"
   ```

2. **Check actual data:**
   ```sql
   SELECT wallet_address, COUNT(*), ARRAY_AGG(id), ARRAY_AGG(created_at)
   FROM users
   GROUP BY wallet_address
   HAVING COUNT(*) > 1;
   ```

3. **Enable query logging** to see what's actually hitting the database

4. **Add request ID** to each API call to track which requests are duplicating

## Long-term Fix

**Option 1: Use UPSERT (recommended)**
- Atomic operation
- No race conditions possible
- PostgreSQL handles everything

**Option 2: Application-level locking**
- Use Redis or similar to lock on wallet address
- More complex, not recommended

**Option 3: Reduce concurrent calls**
- Remove one of the call sites (sign-in OR context, not both)
- Doesn't solve the StrictMode doubling issue

## Verification

After implementing the fix:

1. Clear all duplicate users
2. Connect wallet
3. Check logs for "Unique constraint violation" messages
4. Verify only 1 user row exists

