# MomentumAIOracle v2.0.0 - Quick Reference

## Quick Upgrade

```bash
cd contracts
forge script script/UpgradeAIOracle.s.sol:UpgradeAIOracle \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

## New Functions (v2.0.0)

### Update Multiple Token Prices

```javascript
// JavaScript/ethers.js
const symbols = ['WBTC', 'USDC', 'AERO'];
const prices = [
  ethers.parseUnits('95000', 8),  // $95,000
  ethers.parseUnits('1', 8),      // $1
  ethers.parseUnits('1.5', 8)     // $1.5
];

const tx = await contract.updateTokenPrices(symbols, prices);
await tx.wait();
```

```bash
# Cast CLI
cast send 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
  "updateTokenPrices(string[],uint256[])" \
  '["WBTC","USDC","AERO"]' \
  '[9500000000000,100000000,150000000]' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Update Everything at Once (Most Efficient)

```javascript
// JavaScript/ethers.js
const tx = await contract.updateMarketDataAndPrices(
  ethers.parseUnits('95000', 8),  // BTC price
  ethers.parseUnits('3500', 8),   // ETH price
  ethers.parseUnits('2500', 9),   // Market cap
  25,                              // Volatility %
  ['WBTC', 'USDC', 'AERO'],       // Token symbols
  [                                // Token prices (8 decimals)
    ethers.parseUnits('95000', 8),
    ethers.parseUnits('1', 8),
    ethers.parseUnits('1.5', 8)
  ]
);
await tx.wait();
```

### Get Token Price

```javascript
// JavaScript/ethers.js
const [price, timestamp] = await contract.getTokenPrice('WBTC');
console.log(`WBTC: $${Number(price) / 1e8}`);
console.log(`Updated: ${new Date(Number(timestamp) * 1000).toISOString()}`);
```

```bash
# Cast CLI
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
  "getTokenPrice(string)" "WBTC" \
  --rpc-url $RPC_URL
```

### Get Multiple Token Prices

```javascript
// JavaScript/ethers.js
const symbols = ['WBTC', 'USDC', 'AERO'];
const [prices, timestamps] = await contract.getTokenPrices(symbols);

symbols.forEach((symbol, i) => {
  const price = Number(prices[i]) / 1e8;
  const date = new Date(Number(timestamps[i]) * 1000);
  console.log(`${symbol}: $${price.toLocaleString()} (${date.toISOString()})`);
});
```

```bash
# Cast CLI
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
  "getTokenPrices(string[])" '["WBTC","USDC","AERO"]' \
  --rpc-url $RPC_URL
```

### Get All Supported Tokens

```javascript
// JavaScript/ethers.js
const tokens = await contract.getSupportedTokens();
console.log('Supported tokens:', tokens);
```

```bash
# Cast CLI
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
  "getSupportedTokens()" \
  --rpc-url $RPC_URL
```

### Check if Token is Supported

```javascript
// JavaScript/ethers.js
const isSupported = await contract.isTokenPriceSupported('USDC');
console.log('USDC supported:', isSupported);
```

```bash
# Cast CLI
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
  "isTokenPriceSupported(string)" "USDC" \
  --rpc-url $RPC_URL
```

## Contract ABI (v2.0.0)

```javascript
const AI_ORACLE_ABI = [
  // Existing functions (v1.0.0)
  "function updateMarketDataFromBot(uint256 btcPrice, uint256 ethPrice, uint256 marketCap, uint256 volatility) external",
  "function currentMarketCondition() external view returns (uint8)",
  "function getMarketData() external view returns (uint256, uint256, uint256, uint256, uint256)",
  "function getActiveUsersCount() external view returns (uint256)",
  "function getPriceFeed(string token) external view returns (uint256)",
  
  // New functions (v2.0.0)
  "function updateTokenPrices(string[] symbols, uint256[] prices) external",
  "function updateMarketDataAndPrices(uint256 btcPrice, uint256 ethPrice, uint256 marketCap, uint256 volatility, string[] tokenSymbols, uint256[] tokenPrices) external",
  "function getTokenPrice(string symbol) external view returns (uint256 price, uint256 timestamp)",
  "function getTokenPrices(string[] symbols) external view returns (uint256[] prices, uint256[] timestamps)",
  "function getSupportedTokens() external view returns (string[])",
  "function getSupportedTokensCount() external view returns (uint256)",
  "function isTokenPriceSupported(string symbol) external view returns (bool)",
  "function version() external pure returns (string)"
];
```

## Events

```solidity
// Existing events
event MarketDataUpdated(uint256 btcPrice, uint256 ethPrice, uint256 volatility, uint256 timestamp);
event MarketConditionUpdated(MarketCondition newCondition, uint256 timestamp);

// New events (v2.0.0)
event TokenPriceUpdated(string indexed symbol, uint256 price, uint256 timestamp);
event MultipleTokenPricesUpdated(uint256 count, uint256 timestamp);
```

## Important Notes

### Price Format
- **All prices use 8 decimals** for consistency
- Example: $95,000 = 9500000000000 (95000 * 1e8)
- Example: $1.50 = 150000000 (1.5 * 1e8)

### Token Symbols
- Must match exactly (case-sensitive)
- Recommended: Use uppercase (e.g., "WBTC", "USDC")
- Bot uses: WBTC, USDC, AERO, VIRTUAL, BRETT, DEGEN, TOSHI, WELL, MOCHI, HIGHER

### Gas Optimization
- Use `updateMarketDataAndPrices()` to update everything in one call
- Batch token updates instead of one-by-one
- Bot automatically uses the most efficient method

### Update Frequency
- Minimum interval: 5 minutes (PRICE_UPDATE_INTERVAL)
- Bot default: Every 5 minutes
- Can be configured in `.env`: `UPDATE_INTERVAL=*/5 * * * *`

## Common Commands

```bash
# Check version
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "version()" --rpc-url $RPC_URL

# Check bot address
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getAIOracleBot()" --rpc-url $RPC_URL

# Set bot address (owner only)
cast send 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
  "setAIOracleBot(address)" 0xYourBotAddress \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Get supported tokens count
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getSupportedTokensCount()" --rpc-url $RPC_URL
```

## Addresses (Base Sepolia)

- **Proxy (use this)**: `0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161`
- **Chain ID**: 84532
- **RPC URL**: `https://sepolia.base.org`
- **Explorer**: https://sepolia.basescan.org/address/0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161

## Token Mapping

| Symbol | Name | CoinGecko ID | Category |
|--------|------|--------------|----------|
| WBTC | Wrapped Bitcoin | wrapped-bitcoin | Big Cap |
| USDC | USD Coin | usd-coin | Stablecoin |
| AERO | Aerodrome | aerodrome-finance | Big Cap |
| VIRTUAL | Virtuals Protocol | virtuals-protocol | Mid/Lower Cap |
| BRETT | Brett | based-brett | Mid/Lower Cap |
| DEGEN | Degen | degen-base | Mid/Lower Cap |
| TOSHI | Toshi | toshi | Mid/Lower Cap |
| WELL | Moonwell | moonwell | Mid/Lower Cap |
| MOCHI | Mochi | mochi | Mid/Lower Cap |
| HIGHER | Higher | higher | Mid/Lower Cap |

## Support

- **Full Guide**: [AI_ORACLE_UPGRADE_GUIDE.md](./AI_ORACLE_UPGRADE_GUIDE.md)
- **Bot Guide**: [ai-oracle-bot/AI_ORACLE_BOT_GUIDE.md](./ai-oracle-bot/AI_ORACLE_BOT_GUIDE.md)
- **Bot Quick Start**: [ai-oracle-bot/QUICK_START_BOT.md](./ai-oracle-bot/QUICK_START_BOT.md)

