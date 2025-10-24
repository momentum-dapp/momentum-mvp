# Wallet Reconnection Fix

## Problem
When refreshing the page, users were being kicked out of the app showing "wallet not connected", even though their wallet was actually connected via MetaMask.

## Root Cause
The issue was a **race condition** between wagmi's wallet reconnection and the authentication context:

1. On page refresh, all JavaScript state is cleared (this is normal browser behavior)
2. Wagmi needs to restore the connection from localStorage (this is called "reconnecting")
3. During this brief reconnection period, `isConnected` is temporarily `false`
4. The `WalletAuthContext` was checking `isConnected` immediately and clearing the user state
5. By the time wagmi finished reconnecting, the user was already logged out

## Solution
Modified `WalletAuthContext` to properly wait for wagmi's reconnection process:

### Key Changes

#### 1. Check Wagmi Connection Status
```typescript
const { address, isConnected, status } = useAccount();
```
Now we track wagmi's `status` which can be:
- `"connecting"` - Initial connection in progress
- `"reconnecting"` - Restoring connection from localStorage after page refresh
- `"connected"` - Fully connected
- `"disconnected"` - Not connected

#### 2. Wait for Reconnection to Complete
```typescript
// Wait for wagmi to finish initializing
if (status === 'connecting' || status === 'reconnecting') {
  console.log('Wagmi is reconnecting, waiting...');
  setIsLoading(true);
  return; // Don't clear user state yet!
}
```

#### 3. Use useAccountEffect Hook
```typescript
useAccountEffect({
  onConnect(data) {
    console.log('Wallet connected:', data.address);
  },
  onDisconnect() {
    console.log('Wallet disconnected');
    setUser(null);
    // Clean up refs
  },
});
```

#### 4. Check Session on Mount
```typescript
// Check existing session on mount
useEffect(() => {
  async function checkSession() {
    const response = await fetch('/api/auth/session');
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated) {
        console.log('Found existing session');
      }
    }
    setHasCheckedSession(true);
  }
  checkSession();
}, []);
```

## Why Wagmi Needs to Reconnect

This is **normal and expected behavior**:

1. **Page refresh clears all JavaScript memory** - React state, variables, everything
2. **But localStorage persists** - Wagmi stores connector info here
3. **MetaMask stays connected** - The browser extension maintains its state
4. **Wagmi "reconnects"** - Restores the connection object from localStorage

The reconnection is typically very fast (< 100ms) and happens automatically via:
```typescript
<WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
```

## Flow After Fix

### On Page Refresh:
1. ✅ Page refreshes → State clears
2. ✅ `WalletAuthContext` initializes with `isLoading=true`
3. ✅ Checks for existing session cookie
4. ✅ Wagmi status is `"reconnecting"`
5. ✅ Context waits (doesn't clear user)
6. ✅ Wagmi finishes reconnecting from localStorage
7. ✅ Context detects `isConnected=true` and `status="connected"`
8. ✅ Fetches user data and maintains session
9. ✅ User remains logged in! 🎉

### On Real Disconnect:
1. ✅ User clicks "Disconnect" button
2. ✅ `useAccountEffect.onDisconnect()` is called
3. ✅ User state is cleared
4. ✅ Session is deleted
5. ✅ User is redirected to home

## Testing

To verify the fix works:

1. **Connect your wallet** and navigate to any protected page (e.g., `/portfolio`)
2. **Refresh the page** (Cmd+R / Ctrl+R)
3. **Expected behavior**: 
   - Brief loading state
   - Page loads normally
   - Wallet remains connected
   - User stays logged in

4. **Click the logout button**
5. **Expected behavior**:
   - Wallet disconnects
   - Redirected to home
   - Can't access protected pages

## Files Modified

- `src/contexts/WalletAuthContext.tsx` - Added proper reconnection handling with timeout
- `src/components/Web3Provider.tsx` - Simplified to use built-in reconnection
- `src/lib/web3/config.ts` - Changed from `metaMask()` to `injected()` connector for better compatibility

## Technical Notes

### Wagmi Configuration
```typescript
export const wagmiConfig = createConfig({
  connectors: [injected()], // Use injected() instead of metaMask() for broader compatibility
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
  ssr: true, // Required for Next.js
})
```

The `storage` option tells wagmi where to persist connection state between page refreshes.

**Important:** Changed from `metaMask()` to `injected()` connector:
- `injected()` works with MetaMask, Coinbase Wallet, and other browser wallets
- More reliable for reconnection as it doesn't require MetaMask specifically
- Better compatibility across different wallet providers

### Session Persistence
The session cookie (`wallet_session`) persists for 7 days and survives page refreshes. The middleware checks this cookie to protect routes.

## Debugging

If you see issues, check the browser console for these logs:
- `"⏳ Wagmi status: reconnecting"` - Normal during page refresh (should complete < 2 seconds)
- `"✅ Wallet connected: 0x..."` - Connection restored successfully  
- `"📡 Fetching user for address: 0x..."` - User data being fetched
- `"✅ User session created successfully"` - User data fetched and session created
- `"⚠️ Reconnection timeout - stopping wait"` - Reconnection took too long (> 2 seconds), stopped waiting

### Common Issues

**Issue: Infinite "reconnecting" state**
- **Cause**: Wagmi can't find a wallet to reconnect to, or wrong connector
- **Solution**: 
  1. Changed to `injected()` connector for better compatibility
  2. Added 2-second timeout to prevent infinite waiting
  3. Clear localStorage if needed: `localStorage.clear()` in browser console

**Issue: Gets kicked out even with wallet connected**
- **Cause**: Race condition between wagmi reconnection and auth check
- **Solution**: Added status checks and timeout handling in `WalletAuthContext`

## References

- [Wagmi Reconnection Docs](https://wagmi.sh/react/api/WagmiProvider#reconnectonmount)
- [useAccount Hook](https://wagmi.sh/react/api/hooks/useAccount)
- [useAccountEffect Hook](https://wagmi.sh/react/api/hooks/useAccountEffect)

