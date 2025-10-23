# Wallet-Based Authentication Migration Complete

This document summarizes the migration from Clerk SSO to wallet-based authentication using Web3 wallets.

## Overview

The application has been successfully migrated from Clerk authentication to a wallet-based authentication system. Users now sign in by connecting their Web3 wallets (MetaMask, WalletConnect, etc.) instead of using traditional email/password authentication.

## Key Changes

### 1. Authentication Flow

**Before (Clerk):**
- Users signed in with email/password or OAuth providers
- Clerk handled session management and user identification via `clerk_id`

**After (Wallet-Based):**
- Users connect their Web3 wallet (MetaMask, WalletConnect, etc.)
- Authentication is based on wallet address
- Session management uses cookies with wallet address

### 2. Removed Dependencies

- `@clerk/nextjs` (v6.33.3) - Removed from dependencies
- `svix` - Moved from devDependencies (only used for Clerk webhooks)

### 3. New Components & Files

#### Authentication Context
- `/src/contexts/WalletAuthContext.tsx` - Provides authentication state using wallet connection

#### API Routes
- `/src/app/api/auth/session/route.ts` - Session management (create, read, delete)
- `/src/app/api/auth/user/route.ts` - User management based on wallet address

#### Helpers
- `/src/lib/auth-helpers.ts` - Helper functions for authentication in API routes

### 4. Updated Files

#### Core Application Files
- `/src/app/layout.tsx` - Removed ClerkProvider, added WalletAuthProvider
- `/src/middleware.ts` - Replaced Clerk middleware with custom wallet session validation
- `/src/app/page.tsx` - Removed Clerk hooks
- `/src/components/nav.tsx` - Updated to show wallet connection status

#### Authentication Pages
- `/src/app/sign-in/[[...sign-in]]/page.tsx` - Now shows wallet connection UI
- `/src/app/sign-up/[[...sign-up]]/page.tsx` - Deleted (wallet connection handles both)

#### Protected Pages
- `/src/app/dashboard/page.tsx` - Simplified (auth handled by middleware)
- `/src/app/portfolio/page.tsx` - Simplified (auth handled by middleware)
- `/src/app/ai-advisor/page.tsx` - Simplified (auth handled by middleware)
- `/src/app/portfolio/transactions/page.tsx` - Simplified

#### API Routes (Updated to use wallet auth)
- `/src/app/api/wallet/route.ts`
- `/src/app/api/chat/route.ts`
- `/src/app/api/portfolio/route.ts`
- `/src/app/api/portfolio/allocations/route.ts`
- `/src/app/api/portfolio/performance/route.ts`
- `/src/app/api/transactions/route.ts`
- `/src/app/api/execute-strategy/route.ts`
- `/src/app/api/emergency-rebalance/route.ts`
- `/src/app/api/ai/risk-assessment/route.ts`

#### Services
- `/src/lib/services/user-service.ts` - Added `getUserByWalletAddress()` method, kept legacy `getUserByClerkId()` for backwards compatibility

#### Database
- `/database-schema.sql` - Updated to use `wallet_address` as primary identifier

### 5. Deleted Files

- `/src/app/api/webhooks/clerk/route.ts` - No longer needed
- `/src/app/sign-up/[[...sign-up]]/page.tsx` - Wallet connection handles registration

## How It Works

### 1. User Authentication Flow

1. User visits the application
2. If not authenticated, they are redirected to `/sign-in`
3. User clicks "Connect Wallet" button
4. Wallet provider (MetaMask, etc.) prompts for connection approval
5. Once connected, the app:
   - Creates a session cookie with the wallet address
   - Creates or retrieves the user record in the database
   - Redirects to the intended page (dashboard, portfolio, etc.)

### 2. Session Management

Sessions are managed using HTTP-only cookies:
- Cookie name: `wallet_session`
- Contains: `{ walletAddress, createdAt }`
- Lifetime: 7 days
- HTTP-only: Yes
- Secure: Yes (in production)

### 3. Middleware Protection

The middleware (`/src/middleware.ts`) checks for a valid session cookie on all protected routes:
- If no valid session → redirect to `/sign-in`
- If valid session → add `x-wallet-address` header to request for API routes

### 4. API Authentication

API routes use the `getCurrentUser()` helper from `/src/lib/auth-helpers.ts`:
```typescript
import { getCurrentUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // User is authenticated, proceed with logic
}
```

## Database Schema Changes

### Users Table

**Before:**
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  wallet_address TEXT,
  ...
);
```

**After:**
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  clerk_id TEXT UNIQUE, -- Legacy support
  ...
);
```

### Migration Steps (if needed)

If you have existing users with `clerk_id`, you can migrate them:

```sql
-- Add wallet_address to existing users
-- This assumes you have their wallet addresses from another source
UPDATE users 
SET wallet_address = 'their_wallet_address'
WHERE clerk_id = 'their_clerk_id';

-- After all users have wallet addresses, you can:
-- 1. Make wallet_address NOT NULL
-- 2. Remove clerk_id column (if no longer needed)
```

## Environment Variables

### Removed
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=...
NEXT_PUBLIC_CLERK_SIGN_UP_URL=...
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=...
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=...
```

### Still Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI
OPENAI_API_KEY=...

# Web3 (already configured)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
```

## Testing

### Manual Testing Steps

1. **Sign In Flow:**
   - Visit `/sign-in`
   - Connect wallet
   - Verify redirection to dashboard

2. **Protected Routes:**
   - Try accessing `/dashboard`, `/portfolio`, `/ai-advisor` without authentication
   - Should redirect to `/sign-in`

3. **API Routes:**
   - Make API calls without session cookie
   - Should receive 401 Unauthorized

4. **Sign Out:**
   - Click logout button in navigation
   - Should disconnect wallet and clear session
   - Should redirect to home page

### Automated Testing

Update your tests to:
1. Mock wallet connection instead of Clerk authentication
2. Set session cookie for authenticated requests
3. Test middleware redirection logic

## Backwards Compatibility

The system maintains some backwards compatibility:

1. **UserService:** Legacy `getUserByClerkId()` method still exists
2. **Database:** `clerk_id` column retained for migration period
3. **RLS Policies:** Support both `wallet_address` and `clerk_id` (fallback)

These can be removed once all users are migrated to wallet-based authentication.

## Benefits of Wallet-Based Authentication

1. **Web3 Native:** Seamless integration with blockchain interactions
2. **No Password Management:** Users don't need to remember passwords
3. **Self-Sovereign Identity:** Users control their own identity
4. **Lower Costs:** No third-party authentication service fees
5. **Better UX for Web3 Apps:** Users already have wallets for transactions

## Potential Considerations

1. **Wallet Requirement:** Users must have a Web3 wallet installed
2. **Account Recovery:** Limited recovery options if wallet is lost
3. **Multi-Device:** Users need to use the same wallet across devices
4. **Email Notifications:** May need alternative method to collect email addresses

## Next Steps

1. ✅ Remove Clerk from dependencies
2. ✅ Update all API routes to use wallet authentication
3. ✅ Update UI to show wallet connection status
4. ✅ Test authentication flow
5. 🔄 Deploy to staging environment
6. 🔄 Test in staging
7. 🔄 Migrate existing users (if any)
8. 🔄 Deploy to production
9. 🔄 Remove legacy `clerk_id` references after migration

## Support

For questions or issues with the new authentication system, please refer to:
- Web3Provider documentation: `/src/components/Web3Provider.tsx`
- Authentication helpers: `/src/lib/auth-helpers.ts`
- Wagmi documentation: https://wagmi.sh/

---

**Migration completed on:** October 23, 2025
**Last updated:** October 23, 2025

