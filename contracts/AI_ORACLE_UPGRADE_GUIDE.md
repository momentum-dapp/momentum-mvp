# MomentumAIOracle v2.0.0 Upgrade Guide

## Overview

This guide covers upgrading the MomentumAIOracle contract from v1.0.0 to v2.0.0, which adds support for multiple token price updates.

## What's New in v2.0.0

### New Features

1. **Multiple Token Price Support**
   - Store and update prices for unlimited tokens
   - Track last update timestamp for each token
   - Automatic token registration when prices are updated

2. **New Functions**

   **Update Functions:**
   - `updateTokenPrices(string[] symbols, uint256[] prices)` - Update multiple token prices
   - `updateMarketDataAndPrices(...)` - Update market data and all token prices in one call (most gas efficient)

   **View Functions:**
   - `getTokenPrice(string symbol)` - Get price and timestamp for a specific token
   - `getTokenPrices(string[] symbols)` - Get prices for multiple tokens
   - `getSupportedTokens()` - List all supported token symbols
   - `getSupportedTokensCount()` - Get count of supported tokens
   - `isTokenPriceSupported(string symbol)` - Check if token is supported

3. **New Events**
   - `TokenPriceUpdated(string indexed symbol, uint256 price, uint256 timestamp)`
   - `MultipleTokenPricesUpdated(uint256 count, uint256 timestamp)`

### Backwards Compatibility

✅ **Fully backwards compatible** - All existing functions work unchanged:
- `updateMarketDataFromBot()` - Still works for BTC/ETH only
- `getMarketData()` - Still returns BTC/ETH data
- `getPriceFeed(string token)` - Still works for any token

## Upgrade Steps

### Prerequisites

1. Environment variables set in `.env`:
   ```bash
   PRIVATE_KEY=your_private_key
   RPC_URL=https://sepolia.base.org
   ETHERSCAN_API_KEY=your_basescan_api_key  # Optional, for verification
   ```

2. The deployer wallet must be the **owner** of the proxy contract

### Step 1: Review Current Deployment

```bash
# Navigate to contracts directory
cd contracts

# Check current version (optional)
cast call 0x7E2372c80993ff043CffA5E5d15BF7eb6A319161 "version()" --rpc-url $RPC_URL
# Should return: 1.0.0
```

### Step 2: Run Upgrade Script

```bash
# Deploy new implementation and upgrade proxy
forge script script/UpgradeAIOracle.s.sol:UpgradeAIOracle \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

**Expected Output:**
```
====================================
Upgrading MomentumAIOracle to v2.0.0
====================================

Step 1: Deploying new implementation...
New implementation deployed at: 0x...

Step 2: Upgrading proxy...
Proxy upgraded successfully!

Step 3: Verifying upgrade...
Current version: 2.0.0
✅ Upgrade successful!

====================================
New Features in v2.0.0:
====================================
✓ Support for multiple token prices
✓ updateTokenPrices() - Update multiple tokens
✓ updateMarketDataAndPrices() - Update everything in one call
✓ getTokenPrice() - Get price for specific token
✓ getTokenPrices() - Get prices for multiple tokens
✓ getSupportedTokens() - List all supported tokens
✓ getSupportedTokensCount() - Get count of supported tokens
✓ isTokenPriceSupported() - Check if token is supported
```

### Step 3: Verify Upgrade

```bash
# Check new version
cast call 0x7E2372c80993ff043CffA5E5d15BF7eb6A319161 "version()" --rpc-url $RPC_URL
# Should return: 2.0.0

# Check supported tokens count (should be 0 initially, then grow as bot updates)
cast call 0x7E2372c80993ff043CffA5E5d15BF7eb6A319161 "getSupportedTokensCount()" --rpc-url $RPC_URL
```

### Step 4: Update AI Oracle Bot

The AI Oracle Bot has already been updated to use the new `updateMarketDataAndPrices()` function. No changes needed!

The bot now:
- Fetches prices for all 10 mock tokens from CoinGecko
- Sends all prices to the contract in a single transaction
- More gas efficient than multiple separate calls

### Step 5: Test the New Features

**Test updating multiple token prices:**

```bash
# Test data
SYMBOLS='["WBTC","USDC","AERO"]'
PRICES='[9500000000000,100000000,150000000]'  # $95k, $1, $1.5 (8 decimals)

# Update prices
cast send 0x7E2372c80993ff043CffA5E5d15BF7eb6A319161 \
  "updateTokenPrices(string[],uint256[])" \
  "$SYMBOLS" "$PRICES" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Read back prices
cast call 0x7E2372c80993ff043CffA5E5d15BF7eb6A319161 \
  "getTokenPrice(string)" "WBTC" \
  --rpc-url $RPC_URL
```

**Test querying supported tokens:**

```bash
# Get all supported tokens
cast call 0x7E2372c80993ff043CffA5E5d15BF7eb6A319161 \
  "getSupportedTokens()" \
  --rpc-url $RPC_URL

# Check if token is supported
cast call 0x7E2372c80993ff043CffA5E5d15BF7eb6A319161 \
  "isTokenPriceSupported(string)" "USDC" \
  --rpc-url $RPC_URL
```

## Migration Checklist

- [ ] Backup current implementation address
- [ ] Ensure deployer wallet is the owner
- [ ] Run upgrade script
- [ ] Verify version is 2.0.0
- [ ] Test new functions
- [ ] Restart AI Oracle Bot (if running)
- [ ] Monitor first price update
- [ ] Verify all 10 tokens are registered

## Integration Examples

### JavaScript/TypeScript (ethers.js v6)

```javascript
const { ethers } = require('ethers');

// Contract setup
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(AI_ORACLE_ADDRESS, AI_ORACLE_ABI, wallet);

// Update multiple token prices
async function updateTokenPrices() {
  const symbols = ['WBTC', 'USDC', 'AERO'];
  const prices = [
    ethers.parseUnits('95000', 8),  // $95,000
    ethers.parseUnits('1', 8),      // $1
    ethers.parseUnits('1.5', 8)     // $1.5
  ];
  
  const tx = await contract.updateTokenPrices(symbols, prices);
  await tx.wait();
  console.log('Prices updated!');
}

// Get all supported tokens
async function getSupportedTokens() {
  const tokens = await contract.getSupportedTokens();
  console.log('Supported tokens:', tokens);
  return tokens;
}

// Get prices for multiple tokens
async function getPrices(symbols) {
  const [prices, timestamps] = await contract.getTokenPrices(symbols);
  
  symbols.forEach((symbol, i) => {
    const price = Number(prices[i]) / 1e8;
    const date = new Date(Number(timestamps[i]) * 1000);
    console.log(`${symbol}: $${price.toLocaleString()} (updated: ${date.toISOString()})`);
  });
}

// Update everything in one call (most efficient)
async function updateMarketDataAndPrices() {
  const btcPrice = ethers.parseUnits('95000', 8);
  const ethPrice = ethers.parseUnits('3500', 8);
  const marketCap = ethers.parseUnits('2500', 9); // $2.5T
  const volatility = 25; // 25%
  
  const tokenSymbols = ['WBTC', 'USDC', 'AERO', 'VIRTUAL', 'BRETT', 'DEGEN', 'TOSHI', 'WELL', 'MOCHI', 'HIGHER'];
  const tokenPrices = [
    ethers.parseUnits('95000', 8),
    ethers.parseUnits('1', 8),
    ethers.parseUnits('1.5', 8),
    ethers.parseUnits('0.5', 8),
    ethers.parseUnits('0.15', 8),
    ethers.parseUnits('0.008', 8),
    ethers.parseUnits('0.0003', 8),
    ethers.parseUnits('0.0005', 8),
    ethers.parseUnits('0.0001', 8),
    ethers.parseUnits('0.003', 8)
  ];
  
  const tx = await contract.updateMarketDataAndPrices(
    btcPrice,
    ethPrice,
    marketCap,
    volatility,
    tokenSymbols,
    tokenPrices
  );
  
  await tx.wait();
  console.log('All data updated!');
}
```

### Solidity (from another contract)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IMomentumAIOracle {
    function getTokenPrice(string memory symbol) external view returns (uint256 price, uint256 timestamp);
    function getTokenPrices(string[] memory symbols) external view returns (uint256[] memory prices, uint256[] memory timestamps);
    function getSupportedTokens() external view returns (string[] memory);
}

contract MyContract {
    IMomentumAIOracle public oracle;
    
    constructor(address _oracle) {
        oracle = IMomentumAIOracle(_oracle);
    }
    
    function getUSDCPrice() public view returns (uint256) {
        (uint256 price, ) = oracle.getTokenPrice("USDC");
        return price;
    }
    
    function getMultiplePrices() public view returns (uint256[] memory) {
        string[] memory symbols = new string[](3);
        symbols[0] = "WBTC";
        symbols[1] = "USDC";
        symbols[2] = "AERO";
        
        (uint256[] memory prices, ) = oracle.getTokenPrices(symbols);
        return prices;
    }
}
```

## Troubleshooting

### Upgrade Failed

**Error: "Ownable: caller is not the owner"**
- Solution: Ensure you're using the correct private key for the owner wallet

**Error: "ERC1967: new implementation is not UUPS"**
- Solution: This shouldn't happen with the provided script, but verify you're deploying the correct contract

### Price Updates Not Working

**Error: "Only AI Oracle Bot or owner can update"**
- Solution: Ensure the bot wallet address is set as `aiOracleBot` in the contract
- Check with: `cast call <address> "getAIOracleBot()" --rpc-url $RPC_URL`
- Set with: `cast send <address> "setAIOracleBot(address)" <bot_address> --rpc-url $RPC_URL --private-key $PRIVATE_KEY`

**Error: "Price update too frequent"**
- Solution: Wait at least 5 minutes between updates (PRICE_UPDATE_INTERVAL = 5 minutes)

### Gas Optimization Tips

1. **Use `updateMarketDataAndPrices()` instead of separate calls**
   - Updates everything in one transaction
   - Saves ~50% gas compared to multiple calls

2. **Batch token updates**
   - Update all 10 tokens at once instead of one by one
   - Significant gas savings on Base Sepolia

3. **Monitor gas prices**
   - Base Sepolia has low gas fees, but still monitor
   - Use `--gas-price` flag if needed

## Support

If you encounter issues:

1. Check the [AI Oracle Bot Guide](./ai-oracle-bot/AI_ORACLE_BOT_GUIDE.md)
2. Review [Quick Start](./ai-oracle-bot/QUICK_START_BOT.md)
3. Check contract events on [BaseScan](https://sepolia.basescan.org/address/0x7E2372c80993ff043CffA5E5d15BF7eb6A319161)

## Next Steps

After successful upgrade:

1. ✅ Update frontend to query token prices from the API endpoint
2. ✅ Monitor AI Oracle Bot logs for price updates
3. ✅ Test rebalancing with real token prices
4. ✅ Prepare for mainnet deployment

## Version History

- **v1.0.0** (Initial): BTC and ETH price support only
- **v2.0.0** (Current): Multiple token price support with efficient batch updates

