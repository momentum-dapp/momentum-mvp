# AI Oracle Bot - Updated Guide

## Overview

The AI Oracle Bot now fetches **real mainnet prices** for all 10 mock tokens from CoinGecko and supplies them to the smart contract.

## Features

### Token Price Tracking

The bot tracks prices for all tokens in your portfolio:

| Token | CoinGecko ID | Asset Category |
|-------|--------------|----------------|
| BTC | bitcoin | Reference |
| ETH | ethereum | Reference |
| WBTC | wrapped-bitcoin | WBTC Category |
| cbBTC | coinbase-wrapped-btc | WBTC Category |
| cbETH | coinbase-wrapped-staked-eth | BIG_CAPS |
| USDC | usd-coin | STABLECOINS |
| DAI | dai | STABLECOINS |
| AERO | aerodrome-finance | MID_LOWER_CAPS |
| BRETT | brett | MID_LOWER_CAPS |
| DEGEN | degen-base | MID_LOWER_CAPS |
| TOSHI | toshi | MID_LOWER_CAPS |

### What Gets Updated

**To Smart Contract (Every 5 minutes):**
- BTC Price (8 decimals)
- ETH Price (8 decimals)
- Total Market Cap
- Average Volatility (calculated from 24h changes)

**Saved to File (`token-prices.json`):**
- All token prices in USD
- Market caps
- 24h price changes
- Timestamp
- Update count

## Setup

### 1. Environment Variables

Update `contracts/ai-oracle-bot/.env`:

```env
# Required
PRIVATE_KEY=0x...                    # Your deployer private key
AI_ORACLE_ADDRESS=0x...              # Your MomentumAIOracle proxy address
RPC_URL=https://sepolia.base.org     # Base Sepolia RPC

# Optional
UPDATE_INTERVAL=*/5 * * * *          # Every 5 minutes (default)
```

### 2. Install Dependencies

```bash
cd contracts/ai-oracle-bot
npm install
```

### 3. Run the Bot

```bash
# Development
node index.js

# Production (with PM2)
pm2 start index.js --name momentum-oracle-bot
pm2 save
pm2 startup
```

## Output

### Console Output Example

```
🔄 [2024-01-15T10:30:00.000Z] Updating market data...
📡 Fetching real market data from CoinGecko...
✅ Fetched real market data for 11 tokens:
   BTC: $43,250.00 (Market Cap: $845B)
   ETH: $2,485.50 (Market Cap: $298B)
   WBTC: $43,245.00
   cbBTC: $43,240.00
   cbETH: $2,487.00
   USDC: $1.0000
   DAI: $0.9998
   AERO: $1.2345
   BRETT: $0.156789
   DEGEN: $0.012345
   TOSHI: $0.00012345
   Total Market Cap: $1143.00B
   Average Volatility: 18%

📝 Transaction sent: 0xabc123...
✅ Transaction confirmed in block 12345678
⛽ Gas used: 127543
📊 Market Data Sent to Contract:
   BTC Price: $43,250
   ETH Price: $2,485
   Market Cap: $1143.00B
   Volatility: 18%

💾 Token prices saved to token-prices.json
```

### Token Prices JSON File

The bot creates `token-prices.json`:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "prices": {
    "BTC": 43250.00,
    "ETH": 2485.50,
    "WBTC": 43245.00,
    "cbBTC": 43240.00,
    "cbETH": 2487.00,
    "USDC": 1.0000,
    "DAI": 0.9998,
    "AERO": 1.2345,
    "BRETT": 0.156789,
    "DEGEN": 0.012345,
    "TOSHI": 0.00012345
  },
  "updateCount": 42
}
```

## Frontend Integration

### API Endpoint

Access token prices via: `GET /api/prices`

**Response:**
```json
{
  "success": true,
  "prices": {
    "BTC": 43250.00,
    "ETH": 2485.50,
    "WBTC": 43245.00,
    ...
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ageMinutes": 2,
  "source": "ai-oracle-bot",
  "stale": false
}
```

### Use in Frontend

```typescript
// Fetch token prices
const response = await fetch('/api/prices');
const data = await response.json();

// Get price for specific token
const usdcPrice = data.prices.USDC;
const wbtcPrice = data.prices.WBTC;

// Calculate portfolio value
const portfolioValue = 
  (wbtcBalance * data.prices.WBTC) +
  (ethBalance * data.prices.ETH) +
  (usdcBalance * data.prices.USDC);
```

## Volatility Calculation

The bot calculates **real volatility** from 24-hour price changes:

```javascript
// Get 24h change for each token
changes24h = {
  BTC: 3.5,    // 3.5% change
  ETH: 4.2,    // 4.2% change
  WBTC: 3.4,
  ...
}

// Average all changes (absolute values)
avgVolatility = (3.5 + 4.2 + 3.4 + ...) / tokenCount
```

This gives a **real market volatility** instead of random values.

## Features

### ✅ Real Market Data
- Fetches actual prices from CoinGecko
- Updates every 5 minutes
- Includes market cap and 24h changes

### ✅ Comprehensive Token Coverage
- All 10 mock tokens tracked
- Real mainnet prices
- Stablecoin peg monitoring

### ✅ Smart Contract Updates
- BTC & ETH prices (for contract logic)
- Market cap (total crypto market)
- Calculated volatility (from real data)

### ✅ Frontend Integration
- Prices saved to JSON file
- API endpoint to serve prices
- Timestamp and staleness detection

### ✅ Fallback System
- If CoinGecko API fails, uses fallback prices
- Continues operation even with API downtime
- Logs all errors for debugging

## Monitoring

### Check Bot Status

```bash
# If using PM2
pm2 status
pm2 logs momentum-oracle-bot

# Check last update
cat token-prices.json | jq '.timestamp'

# Check prices
cat token-prices.json | jq '.prices'
```

### Verify On-Chain Data

```bash
# Read market data from contract
cast call $AI_ORACLE_ADDRESS \
  "getMarketData()(uint256,uint256,uint256,uint256,uint256)" \
  --rpc-url base-sepolia

# Check market condition
cast call $AI_ORACLE_ADDRESS \
  "currentMarketCondition()(uint8)" \
  --rpc-url base-sepolia
```

## Troubleshooting

### Issue: CoinGecko Rate Limiting
**Symptom:** Errors fetching data, "Too Many Requests"
**Solution:** 
- Increase `UPDATE_INTERVAL` to `*/10 * * * *` (every 10 minutes)
- Consider CoinGecko Pro API for higher rate limits

### Issue: Token Not Found
**Symptom:** Some tokens show "N/A" in console
**Solution:** 
- Check CoinGecko ID is correct
- Some newer tokens may not be listed yet
- Bot will use fallback price for missing tokens

### Issue: Prices Not Updating in Frontend
**Symptom:** API returns stale prices
**Solution:**
- Check bot is running: `pm2 status`
- Verify `token-prices.json` exists and is recent
- Check file permissions

### Issue: High Gas Costs
**Symptom:** Bot spends too much on gas
**Solution:**
- Increase `UPDATE_INTERVAL` (update less frequently)
- Consider Layer 2 deployment
- Check gas price during updates

## Best Practices

1. ✅ **Monitor bot logs** regularly
2. ✅ **Keep enough ETH** for gas (0.1 ETH minimum)
3. ✅ **Use PM2** for production deployment
4. ✅ **Set up alerts** for bot failures
5. ✅ **Backup `.env` file** securely
6. ⚠️ **Never commit private keys** to git

## Advanced Configuration

### Custom Token Mapping

Edit `tokenMapping` in `index.js`:

```javascript
const tokenMapping = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  // Add your custom tokens here
  'CUSTOM': 'custom-token-id',
};
```

### Custom Update Schedule

Change `UPDATE_INTERVAL` in `.env`:

```env
# Every 1 minute (fast)
UPDATE_INTERVAL=* * * * *

# Every 5 minutes (default)
UPDATE_INTERVAL=*/5 * * * *

# Every 15 minutes (conservative)
UPDATE_INTERVAL=*/15 * * * *

# Every hour
UPDATE_INTERVAL=0 * * * *
```

### Save Prices to Database

Modify `saveTokenPrices()` to save to your database:

```javascript
async saveTokenPrices() {
  // Save to Supabase
  const { data, error } = await supabase
    .from('token_prices')
    .insert({
      timestamp: this.lastPriceUpdate,
      prices: this.tokenPrices
    });
}
```

## Summary

The AI Oracle Bot now:

✅ Fetches **real mainnet prices** for all 10 tokens  
✅ Updates smart contract every 5 minutes  
✅ Saves prices to JSON file for frontend  
✅ Calculates **real volatility** from 24h changes  
✅ Provides API endpoint at `/api/prices`  
✅ Includes comprehensive error handling and fallbacks  

Your mock tokens on testnet now have **real price data** from mainnet! 🎉

