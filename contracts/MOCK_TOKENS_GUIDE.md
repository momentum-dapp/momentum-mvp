# Mock Tokens Deployment & Whitelisting Guide

## Overview

This guide covers deploying mock ERC-20 tokens for testing on Base Sepolia testnet and whitelisting them in the MomentumVault contract.

## Mock Tokens List

All 10 mock tokens simulate real tokens on Base Mainnet:

1. **WETH** - Wrapped Ether (18 decimals)
2. **USDC** - USD Coin (6 decimals) - Primary stablecoin
3. **cbETH** - Coinbase Wrapped Staked ETH (18 decimals)
4. **cbBTC** - Coinbase Wrapped BTC (8 decimals)
5. **WBTC** - Wrapped Bitcoin (8 decimals)
6. **DAI** - Dai Stablecoin (18 decimals)
7. **AERO** - Aerodrome Finance (18 decimals)
8. **BRETT** - Base meme coin (18 decimals)
9. **DEGEN** - Degen token (18 decimals)
10. **TOSHI** - Base ecosystem token (18 decimals)

## Prerequisites

### 1. Environment Setup

Ensure you have:
- Foundry installed (`forge`, `cast`)
- Base Sepolia ETH for gas (get from [Coinbase Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet))
- Private key with ETH
- Deployed MomentumVault contract

### 2. Configure Environment Variables

Create or update `contracts/.env`:

```env
# Deployment
PRIVATE_KEY=0x... # Your private key (DO NOT COMMIT)
BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Existing contracts (from previous deployment)
VAULT_PROXY=0x... # Your MomentumVault proxy address
PORTFOLIO_MANAGER_PROXY=0x...
AI_ORACLE_PROXY=0x...
SWAP_MANAGER_PROXY=0x...

# Mock token addresses (will be filled after deployment)
MOCK_WETH=0x...
MOCK_USDC=0x...
MOCK_CBETH=0x...
MOCK_CBBTC=0x...
MOCK_WBTC=0x...
MOCK_DAI=0x...
MOCK_AERO=0x...
MOCK_BRETT=0x...
MOCK_DEGEN=0x...
MOCK_TOSHI=0x...
```

## Step 1: Deploy Mock Tokens

### Option A: Using Forge Script (Recommended)

```bash
cd contracts

# Deploy all mock tokens at once
forge script script/DeployMockTokens.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify \
  -vvvv

# The script will output all deployed addresses
# Copy these addresses to your .env file
```

**Expected Output:**
```
== Logs ==
  Deploying mock tokens with deployer: 0x...
  Mock WETH deployed at: 0x123...
  Mock USDC deployed at: 0x456...
  Mock cbETH deployed at: 0x789...
  ... (and so on)

=== DEPLOYMENT SUMMARY ===
Mock WETH: 0x123...
Mock USDC: 0x456...
...
```

### Option B: Manual Deployment (Individual Tokens)

If you prefer to deploy tokens one by one:

```bash
cd contracts

# Deploy Mock WETH
forge create src/mocks/MockERC20.sol:MockERC20 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "Wrapped Ether (Mock)" \
    "WETH" \
    18 \
    1000000000000000000000000 \
  --verify

# Deploy Mock USDC
forge create src/mocks/MockERC20.sol:MockERC20 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "USD Coin (Mock)" \
    "USDC" \
    6 \
    10000000000000 \
  --verify

# Repeat for other tokens...
```

### Verify Deployment

Check that tokens are deployed correctly:

```bash
# Check token name
cast call $MOCK_WETH "name()(string)" --rpc-url base-sepolia

# Check token symbol
cast call $MOCK_WETH "symbol()(string)" --rpc-url base-sepolia

# Check decimals
cast call $MOCK_WETH "decimals()(uint8)" --rpc-url base-sepolia

# Check total supply
cast call $MOCK_WETH "totalSupply()(uint256)" --rpc-url base-sepolia
```

## Step 2: Update Environment File

After deployment, update your `.env` file with all mock token addresses:

```env
# Mock token addresses (from deployment output)
MOCK_WETH=0x123...
MOCK_USDC=0x456...
MOCK_CBETH=0x789...
MOCK_CBBTC=0xabc...
MOCK_WBTC=0xdef...
MOCK_DAI=0x111...
MOCK_AERO=0x222...
MOCK_BRETT=0x333...
MOCK_DEGEN=0x444...
MOCK_TOSHI=0x555...
```

## Step 3: Whitelist Tokens in Vault

### Option A: Using Forge Script (Recommended)

```bash
cd contracts

# Make sure all MOCK_* addresses are in .env
# Then run the whitelisting script
forge script script/WhitelistTokens.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  -vvvv

# The script will whitelist all tokens and verify
```

**Expected Output:**
```
== Logs ==
  Whitelisting tokens in vault at: 0x...
  Whitelisting Mock WETH: 0x123...
  Whitelisting Mock USDC: 0x456...
  ...

=== WHITELISTING COMPLETE ===
All 10 mock tokens have been whitelisted in the vault

=== VERIFICATION ===
Mock WETH whitelisted: true
Mock USDC whitelisted: true
...
```

### Option B: Manual Whitelisting (Individual Tokens)

```bash
# Whitelist Mock WETH
cast send $VAULT_PROXY \
  "setTokenWhitelist(address,bool)" \
  $MOCK_WETH \
  true \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY

# Whitelist Mock USDC
cast send $VAULT_PROXY \
  "setTokenWhitelist(address,bool)" \
  $MOCK_USDC \
  true \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY

# Repeat for all tokens...
```

### Verify Whitelisting

```bash
# Check if tokens are whitelisted
cast call $VAULT_PROXY \
  "whitelistedTokens(address)(bool)" \
  $MOCK_WETH \
  --rpc-url base-sepolia

# Should return: true

# Get all supported tokens
cast call $VAULT_PROXY \
  "getSupportedTokens()(address[])" \
  --rpc-url base-sepolia
```

## Step 4: Mint Test Tokens

Each mock token has a `faucet()` function that allows anyone to claim up to 1000 tokens:

```bash
# Claim Mock USDC (6 decimals = 1000 USDC)
cast send $MOCK_USDC \
  "faucet(uint256)" \
  1000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY

# Claim Mock WETH (18 decimals = 1000 WETH)
cast send $MOCK_WETH \
  "faucet(uint256)" \
  1000000000000000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY

# Claim Mock WBTC (8 decimals = 1000 WBTC)
cast send $MOCK_WBTC \
  "faucet(uint256)" \
  100000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

Or use the `mint()` function for larger amounts (no limit):

```bash
# Mint 10,000 Mock USDC to your address
cast send $MOCK_USDC \
  "mint(address,uint256)" \
  $YOUR_ADDRESS \
  10000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

### Check Your Token Balance

```bash
# Check Mock USDC balance
cast call $MOCK_USDC \
  "balanceOf(address)(uint256)" \
  $YOUR_ADDRESS \
  --rpc-url base-sepolia

# Convert to human-readable (for 6 decimals)
# Result / 1000000 = USDC amount
```

## Step 5: Map Tokens to Asset Categories

For your portfolio strategies, map tokens to asset types:

### Create Token Configuration File

Create `contracts/token-config.json`:

```json
{
  "assetCategories": {
    "WBTC": [
      {
        "symbol": "WBTC",
        "address": "MOCK_WBTC_ADDRESS",
        "decimals": 8,
        "name": "Wrapped Bitcoin"
      },
      {
        "symbol": "cbBTC",
        "address": "MOCK_CBBTC_ADDRESS",
        "decimals": 8,
        "name": "Coinbase Wrapped BTC"
      }
    ],
    "BIG_CAPS": [
      {
        "symbol": "WETH",
        "address": "MOCK_WETH_ADDRESS",
        "decimals": 18,
        "name": "Wrapped Ether"
      },
      {
        "symbol": "cbETH",
        "address": "MOCK_CBETH_ADDRESS",
        "decimals": 18,
        "name": "Coinbase Wrapped Staked ETH"
      }
    ],
    "MID_LOWER_CAPS": [
      {
        "symbol": "AERO",
        "address": "MOCK_AERO_ADDRESS",
        "decimals": 18,
        "name": "Aerodrome Finance"
      },
      {
        "symbol": "BRETT",
        "address": "MOCK_BRETT_ADDRESS",
        "decimals": 18,
        "name": "Brett"
      },
      {
        "symbol": "DEGEN",
        "address": "MOCK_DEGEN_ADDRESS",
        "decimals": 18,
        "name": "Degen"
      },
      {
        "symbol": "TOSHI",
        "address": "MOCK_TOSHI_ADDRESS",
        "decimals": 18,
        "name": "Toshi"
      }
    ],
    "STABLECOINS": [
      {
        "symbol": "USDC",
        "address": "MOCK_USDC_ADDRESS",
        "decimals": 6,
        "name": "USD Coin"
      },
      {
        "symbol": "DAI",
        "address": "MOCK_DAI_ADDRESS",
        "decimals": 18,
        "name": "Dai Stablecoin"
      }
    ]
  }
}
```

## Step 6: Test Deposit Flow

Now test depositing mock tokens into the vault:

```bash
# 1. Approve vault to spend your Mock USDC
cast send $MOCK_USDC \
  "approve(address,uint256)" \
  $VAULT_PROXY \
  1000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY

# 2. Deposit Mock USDC into vault
cast send $VAULT_PROXY \
  "deposit(address,uint256)" \
  $MOCK_USDC \
  1000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY

# 3. Check your balance in vault
cast call $VAULT_PROXY \
  "getUserBalance(address,address)(uint256)" \
  $YOUR_ADDRESS \
  $MOCK_USDC \
  --rpc-url base-sepolia
```

## Troubleshooting

### Issue: "Insufficient gas"
**Solution:** Make sure you have enough Base Sepolia ETH. Get more from the faucet.

### Issue: "Token not whitelisted"
**Solution:** Run the whitelisting script again or manually whitelist the token.

### Issue: "Transaction reverted"
**Solution:** Check that:
- Contract addresses in `.env` are correct
- You have enough token balance
- You've approved the vault to spend tokens
- The vault is not paused

### Issue: Mock token deployment fails
**Solution:** 
- Verify your private key has ETH
- Check RPC URL is correct
- Try deploying one token at a time manually

## Verification Checklist

✅ All 10 mock tokens deployed  
✅ All addresses saved in `.env`  
✅ All tokens whitelisted in vault  
✅ Whitelisting verified (returns `true`)  
✅ Test tokens minted to your address  
✅ Approve + Deposit tested successfully  
✅ Balance shows in vault  

## Next Steps

After completing this guide:

1. ✅ Update frontend with mock token addresses
2. ✅ Test deposit flow from UI
3. ✅ Test custom allocations with multiple tokens
4. ✅ Test rebalancing between different tokens
5. ✅ Test withdrawal flow

## Additional Resources

- **Base Sepolia Block Explorer:** https://sepolia.basescan.org
- **Your Vault Contract:** `$VAULT_PROXY`
- **Faucet for Base Sepolia ETH:** https://www.coinbase.com/faucets/base-sepolia-faucet

## Support

If you encounter issues:
1. Check contract addresses are correct in `.env`
2. Verify transactions on block explorer
3. Check contract is not paused: `cast call $VAULT_PROXY "paused()(bool)"`
4. Review error messages in transaction details

---

**Note:** These are MOCK tokens for TESTING ONLY on Base Sepolia testnet. They have NO VALUE and should never be used on mainnet.

