# Mint Mock Tokens Guide

## Overview

This guide explains how to mint mock tokens to any address using the `MintMockTokens.s.sol` script.

## Quick Start

### Mint to Yourself (Default)

```bash
cd contracts

# Mints 10,000 of each token to your address (deployer)
forge script script/MintMockTokens.s.sol \
  --rpc-url base-sepolia \
  --broadcast
```

### Mint to Specific Address

```bash
# Set recipient address in .env
echo "MINT_RECIPIENT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" >> .env

# Run minting script
forge script script/MintMockTokens.s.sol \
  --rpc-url base-sepolia \
  --broadcast
```

### Mint Custom Amount

```bash
# Set custom amount (in human-readable units)
echo "MINT_AMOUNT=50000" >> .env  # Mints 50,000 of each token

# Run minting script
forge script script/MintMockTokens.s.sol \
  --rpc-url base-sepolia \
  --broadcast
```

## Environment Variables

Add to your `contracts/.env`:

```env
# Required - Already should be set
PRIVATE_KEY=0x...
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

# Optional - For custom minting
MINT_RECIPIENT=0x...    # Address to receive tokens (defaults to deployer)
MINT_AMOUNT=10000       # Amount per token in human units (defaults to 10,000)
```

## What Gets Minted

The script mints tokens with correct decimals:

| Token | Decimals | Default Amount | Actual Raw Amount |
|-------|----------|----------------|-------------------|
| WETH | 18 | 10,000 | 10,000 × 10¹⁸ |
| USDC | 6 | 10,000 | 10,000 × 10⁶ |
| cbETH | 18 | 10,000 | 10,000 × 10¹⁸ |
| cbBTC | 8 | 10,000 | 10,000 × 10⁸ |
| WBTC | 8 | 10,000 | 10,000 × 10⁸ |
| DAI | 18 | 10,000 | 10,000 × 10¹⁸ |
| AERO | 18 | 10,000 | 10,000 × 10¹⁸ |
| BRETT | 18 | 10,000 | 10,000 × 10¹⁸ |
| DEGEN | 18 | 10,000 | 10,000 × 10¹⁸ |
| TOSHI | 18 | 10,000 | 10,000 × 10¹⁸ |

## Use Cases

### 1. Mint to Your Test Wallet

```bash
# Add your test wallet to .env
MINT_RECIPIENT=0xYourTestWalletAddress
MINT_AMOUNT=10000

# Mint
forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast
```

### 2. Mint to Multiple Users

```bash
# Mint to first user
MINT_RECIPIENT=0xUser1Address forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# Mint to second user
MINT_RECIPIENT=0xUser2Address forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# And so on...
```

### 3. Mint Large Amounts for Testing

```bash
# Mint 1,000,000 tokens for heavy testing
MINT_AMOUNT=1000000 forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast
```

### 4. Mint to Contract Address

```bash
# Mint to a smart contract (e.g., liquidity pool)
MINT_RECIPIENT=0xContractAddress MINT_AMOUNT=100000 \
  forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast
```

## Alternative: Use Cast Commands

If you prefer manual control, use `cast send`:

### Mint Single Token

```bash
# Mint 10,000 USDC (6 decimals)
cast send $MOCK_USDC \
  "mint(address,uint256)" \
  0xRecipientAddress \
  10000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY

# Mint 10,000 WETH (18 decimals)
cast send $MOCK_WETH \
  "mint(address,uint256)" \
  0xRecipientAddress \
  10000000000000000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

### Use Faucet Function (Max 1000 per call)

```bash
# Claim 1000 USDC
cast send $MOCK_USDC \
  "faucet(uint256)" \
  1000000000 \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

## Verify Balances

After minting, verify the balances:

```bash
# Check USDC balance
cast call $MOCK_USDC \
  "balanceOf(address)(uint256)" \
  0xRecipientAddress \
  --rpc-url base-sepolia

# Check WETH balance
cast call $MOCK_WETH \
  "balanceOf(address)(uint256)" \
  0xRecipientAddress \
  --rpc-url base-sepolia

# Check WBTC balance
cast call $MOCK_WBTC \
  "balanceOf(address)(uint256)" \
  0xRecipientAddress \
  --rpc-url base-sepolia
```

### Convert Raw Amounts to Human-Readable

```bash
# For 18 decimal tokens (WETH, DAI, etc.)
# Divide by 10^18
echo "scale=18; RESULT / 1000000000000000000" | bc

# For 6 decimal tokens (USDC)
# Divide by 10^6
echo "scale=6; RESULT / 1000000" | bc

# For 8 decimal tokens (WBTC, cbBTC)
# Divide by 10^8
echo "scale=8; RESULT / 100000000" | bc
```

## Common Scenarios

### Scenario 1: New User Testing

```bash
# User needs tokens for full portfolio test
MINT_RECIPIENT=0xNewUserAddress
MINT_AMOUNT=50000

forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# User now has 50,000 of each token
```

### Scenario 2: Integration Testing

```bash
# Multiple test accounts need tokens
for address in 0xUser1 0xUser2 0xUser3; do
  MINT_RECIPIENT=$address MINT_AMOUNT=10000 \
    forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast
done
```

### Scenario 3: Rebalancing Test

```bash
# Mint tokens to test complex rebalancing scenarios
MINT_RECIPIENT=0xTestAccount
MINT_AMOUNT=100000  # Large amount for extensive testing

forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast
```

## Troubleshooting

### Issue: "Transaction reverted"
**Cause:** Token address not set in `.env` or incorrect
**Solution:** Verify all `MOCK_*` addresses are set correctly

### Issue: "Insufficient gas"
**Cause:** Not enough ETH for gas fees
**Solution:** Get more Base Sepolia ETH from faucet

### Issue: "Invalid recipient address"
**Cause:** `MINT_RECIPIENT` has invalid format
**Solution:** Ensure address starts with `0x` and is 42 characters

### Issue: Script skips some tokens
**Cause:** Token addresses are zero or not set
**Solution:** Run `DeployMockTokens.s.sol` first, then update `.env`

## Best Practices

1. ✅ **Start with default amounts** (10,000) for initial testing
2. ✅ **Increase amounts gradually** as needed
3. ✅ **Keep track of minted addresses** in a spreadsheet
4. ✅ **Use same amount** for all users for fair testing
5. ✅ **Verify balances** after minting
6. ⚠️ **Don't mint excessive amounts** unnecessarily (wastes gas)

## Batch Minting Script (Bash)

Create `mint-to-multiple.sh`:

```bash
#!/bin/bash

# List of addresses to mint to
ADDRESSES=(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  "0x123456789abcdef123456789abcdef123456789a"
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
)

AMOUNT=10000

for addr in "${ADDRESSES[@]}"; do
  echo "Minting $AMOUNT tokens to $addr..."
  MINT_RECIPIENT=$addr MINT_AMOUNT=$AMOUNT \
    forge script script/MintMockTokens.s.sol \
    --rpc-url base-sepolia \
    --broadcast
  echo "Done!"
  sleep 2  # Wait between transactions
done

echo "All minting complete!"
```

Make executable and run:
```bash
chmod +x mint-to-multiple.sh
./mint-to-multiple.sh
```

## Summary

### Quick Commands

```bash
# Mint to yourself (default)
forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# Mint to specific address
MINT_RECIPIENT=0xAddress forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# Mint custom amount
MINT_AMOUNT=50000 forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast

# Both custom
MINT_RECIPIENT=0xAddress MINT_AMOUNT=50000 forge script script/MintMockTokens.s.sol --rpc-url base-sepolia --broadcast
```

### Environment Variables

```env
MINT_RECIPIENT=0x...  # Optional, defaults to deployer
MINT_AMOUNT=10000     # Optional, defaults to 10,000
```

That's it! You can now easily mint mock tokens to any address for testing. 🎉

