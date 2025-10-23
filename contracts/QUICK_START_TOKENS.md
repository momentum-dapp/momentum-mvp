# Quick Start: Mock Tokens Deployment

## TL;DR - Fast Track

```bash
cd contracts

# 1. Deploy all mock tokens (takes ~2 minutes)
forge script script/DeployMockTokens.s.sol --rpc-url base-sepolia --broadcast --verify

# 2. Copy addresses to .env (from script output)
# Add MOCK_WETH=0x..., MOCK_USDC=0x..., etc.

# 3. Whitelist all tokens (takes ~1 minute)
forge script script/WhitelistTokens.s.sol --rpc-url base-sepolia --broadcast

# 4. Mint test tokens for yourself (10,000 of each token)
forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# Or mint to specific address
MINT_RECIPIENT=0xYourAddress forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast
```

## What You Get

✅ **10 Mock Tokens:**
- WETH, USDC, cbETH, cbBTC, WBTC, DAI, AERO, BRETT, DEGEN, TOSHI

✅ **Mapped to Asset Categories:**
- **WBTC Category:** WBTC, cbBTC
- **BIG_CAPS:** WETH, cbETH
- **MID_LOWER_CAPS:** AERO, BRETT, DEGEN, TOSHI
- **STABLECOINS:** USDC, DAI

✅ **Features:**
- Free minting via `faucet()` (up to 1000 tokens)
- Unlimited minting via `mint(address, amount)`
- All whitelisted in your vault
- Ready for testing deposits/withdrawals/rebalancing

## Asset Category Breakdown

### For WBTC Allocation (Bitcoin exposure)
```
WBTC  (8 decimals)  - 21,000 supply
cbBTC (8 decimals)  - 10,000 supply
```

### For BIG_CAPS Allocation (Major cryptos)
```
WETH  (18 decimals) - 1,000,000 supply
cbETH (18 decimals) - 100,000 supply
```

### For MID_LOWER_CAPS Allocation (Emerging)
```
AERO  (18 decimals) - 1,000,000 supply
BRETT (18 decimals) - 10,000,000,000 supply (meme)
DEGEN (18 decimals) - 37,000,000,000 supply
TOSHI (18 decimals) - 1,000,000,000 supply
```

### For STABLECOINS Allocation (Stable value)
```
USDC (6 decimals)  - 10,000,000 supply (primary)
DAI  (18 decimals) - 10,000,000 supply (backup)
```

## Common Commands

### Mint Tokens (Recommended)
```bash
# Mint 10,000 of each token to yourself
forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# Mint to specific address
MINT_RECIPIENT=0xAddress forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# Mint custom amount (e.g., 50,000 of each)
MINT_AMOUNT=50000 forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast
```

### Alternative: Use Faucet (Max 1000 per token)
```bash
# USDC (6 decimals = 1000 USDC)
cast send $MOCK_USDC "faucet(uint256)" 1000000000 --rpc-url base-sepolia --private-key $PRIVATE_KEY

# WETH (18 decimals = 1000 WETH)
cast send $MOCK_WETH "faucet(uint256)" 1000000000000000000000 --rpc-url base-sepolia --private-key $PRIVATE_KEY

# WBTC (8 decimals = 1000 WBTC)
cast send $MOCK_WBTC "faucet(uint256)" 100000000000 --rpc-url base-sepolia --private-key $PRIVATE_KEY
```

### Check Balance
```bash
cast call $MOCK_USDC "balanceOf(address)(uint256)" $YOUR_ADDRESS --rpc-url base-sepolia
```

### Test Deposit
```bash
# Approve
cast send $MOCK_USDC "approve(address,uint256)" $VAULT_PROXY 1000000000 --rpc-url base-sepolia --private-key $PRIVATE_KEY

# Deposit
cast send $VAULT_PROXY "deposit(address,uint256)" $MOCK_USDC 1000000000 --rpc-url base-sepolia --private-key $PRIVATE_KEY
```

## Environment Variables Template

Add to your `.env` after deployment:

```env
# Mock Token Addresses (Base Sepolia)
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

## Testing Checklist

1. ✅ Deploy mock tokens
2. ✅ Update `.env` with addresses
3. ✅ Whitelist in vault
4. ✅ Mint test tokens
5. ✅ Test deposit (approve + deposit)
6. ✅ Verify balance in vault
7. ✅ Test withdrawal
8. ✅ Test rebalancing between tokens

## Need Help?

See detailed guide: `MOCK_TOKENS_GUIDE.md`

