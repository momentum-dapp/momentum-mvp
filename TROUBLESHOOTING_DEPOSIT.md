# Troubleshooting: Deposit Button Disabled

## Issue: "Deposit USDC" Button is Disabled/Grayed Out

### Why This Happens

The deposit button is disabled when any of these conditions are NOT met:

1. ❌ **Amount entered** - You must enter an amount
2. ❌ **Wallet connected** - Your wallet must be connected
3. ❌ **Correct network** - You must be on Base Sepolia
4. ❌ **VaultService initialized** - Wallet client must be ready

### Quick Fix

**Most Common Issue**: VaultService not initialized because wallet client isn't ready on the correct chain.

#### Step 1: Check Your Wallet Network
1. Open your wallet (MetaMask, Coinbase Wallet, etc.)
2. Verify you're on **Base Sepolia** network
3. If not, switch to Base Sepolia

#### Step 2: Reconnect Wallet
1. Disconnect wallet from the app
2. Refresh the page
3. Reconnect wallet
4. Ensure you approve connection on Base Sepolia

#### Step 3: Check Console Logs
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for these messages:
   - ✅ `VaultService initialized with wallet client` - Good!
   - ⏳ `Waiting for wallet client...` - Not ready yet

### What the Button Shows

The button text tells you what's happening:

| Button Text | Meaning | Action |
|-------------|---------|--------|
| "Initializing..." | Waiting for wallet client | Wait a few seconds or reconnect |
| "Deposit USDC" | Ready to deposit | Click to proceed |
| "Processing..." | Transaction in progress | Wait for completion |

### Detailed Checklist

#### ✅ 1. Wallet Connection
```bash
# Check in console:
Connected Wallet: 0xF977...793c ← Should show your address
```

**Fix if broken:**
- Click "Connect Wallet"
- Approve connection in wallet popup
- Ensure on Base Sepolia

#### ✅ 2. Correct Network
```bash
# Verify in wallet:
Network: Base Sepolia (Chain ID: 84532)
```

**Fix if wrong:**
- Open wallet
- Switch network to "Base Sepolia"
- If not available, add it:
  - Network Name: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Currency: ETH
  - Explorer: https://sepolia.basescan.org

#### ✅ 3. Amount Entered
```bash
# In the UI:
Amount: 1000 ← Must be > 0
```

**Fix if wrong:**
- Type any positive number
- Use decimals if needed (e.g., 10.5)

#### ✅ 4. VaultService Initialized
```bash
# Check console logs:
✅ VaultService initialized with wallet client
```

**Fix if not showing:**
1. Ensure wallet connected on Base Sepolia
2. Refresh page
3. Reconnect wallet
4. Wait 2-3 seconds for initialization

### Common Error Messages

#### "Initializing vault service..."
**Cause**: Wallet client not ready yet  
**Fix**: 
- Wait 2-3 seconds
- If persists, disconnect and reconnect wallet
- Ensure on Base Sepolia network

#### Button stays disabled after connecting
**Cause**: Wrong network or wallet client issue  
**Fix**:
```bash
# Steps:
1. Open DevTools console
2. Check for errors
3. Verify network is Base Sepolia
4. Hard refresh page (Cmd+Shift+R or Ctrl+Shift+R)
5. Reconnect wallet
```

### Advanced Debugging

#### Check Wallet Client Status

Open console and run:
```javascript
// This will be logged automatically by the component
// Look for: "⏳ Waiting for wallet client..." or "✅ VaultService initialized"
```

#### Verify Contract Addresses

```bash
# Check if contracts are configured:
cd /Users/chidx/Documents/Learn/momentum-mvp
cat src/lib/contracts/addresses.ts | grep VAULT

# Should show:
# VAULT: '0x27325be0cf6c908c282b64565ba05b8c7d0642de'
```

#### Test Wallet Client Manually

```bash
# In browser console, after page loads:
# Check if wagmi is connected
localStorage.getItem('wagmi.wallet')
localStorage.getItem('wagmi.store')
```

### If Nothing Works

#### Nuclear Option: Full Reset
```bash
# 1. Clear browser cache
Settings → Privacy → Clear Browsing Data → Cached files

# 2. Clear wallet connection
In wallet: Settings → Connected Sites → Remove momentum-mvp

# 3. Restart browser
Close all tabs and restart

# 4. Start fresh
- Open app
- Connect wallet
- Select Base Sepolia
- Try deposit again
```

### For Developers

#### Add More Debug Info

In `Web3Actions.tsx`, add this temporary debug code:

```typescript
// After line 79, add:
useEffect(() => {
  console.log('🔍 Debug Info:', {
    address,
    isConnected,
    hasWalletClient: !!walletClient,
    hasPublicClient: !!publicClient,
    hasVaultService: !!vaultService,
    amount,
    selectedAsset
  });
}, [address, isConnected, walletClient, publicClient, vaultService, amount, selectedAsset]);
```

#### Check wagmi Configuration

Verify `src/components/Web3Provider.tsx` or similar has Base Sepolia configured:

```typescript
import { baseSepolia } from 'wagmi/chains';

const config = createConfig({
  chains: [baseSepolia], // ← Must include Base Sepolia
  // ... other config
});
```

### Expected Timeline

Normal initialization should take:
- Wallet connection: ~1-2 seconds
- VaultService init: ~500ms-1 second
- Total: ~2-3 seconds max

If it takes longer than 5 seconds, something is wrong.

### Success Indicators

You'll know it's working when:
1. ✅ Button text changes from "Initializing..." to "Deposit USDC"
2. ✅ Button is green (not grayed out)
3. ✅ Console shows "✅ VaultService initialized with wallet client"
4. ✅ Clicking button triggers wallet popup

### Still Having Issues?

Check these files for configuration issues:
1. `src/components/Web3Provider.tsx` - wagmi config
2. `src/lib/contracts/addresses.ts` - contract addresses
3. `src/lib/web3/vault-service.ts` - service initialization

### Quick Test Script

Run this in browser console after connecting wallet:

```javascript
// Check all conditions
console.log({
  'Wallet Connected': !!window.ethereum,
  'Chain ID': window.ethereum?.chainId,
  'Expected Chain': '0x14a34', // Base Sepolia in hex
  'Address': window.ethereum?.selectedAddress
});
```

Expected output:
```
{
  'Wallet Connected': true,
  'Chain ID': '0x14a34',
  'Expected Chain': '0x14a34', // ← Should match!
  'Address': '0xF977...793c'
}
```

## Summary

**Most likely cause**: Wallet client not ready on Base Sepolia network.

**Quick fix**: 
1. Ensure on Base Sepolia
2. Disconnect and reconnect wallet
3. Wait for "Initializing..." to change to "Deposit USDC"
4. Click and approve transaction

**Check console for**: `✅ VaultService initialized with wallet client`

