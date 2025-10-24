# AI Oracle Bot - Quick Start

## TL;DR

```bash
cd contracts/ai-oracle-bot

# 1. Configure
cp .env.example .env
# Edit .env with your PRIVATE_KEY and AI_ORACLE_ADDRESS

# 2. Install
npm install

# 3. Run
node index.js

# Or with PM2 (production)
pm2 start index.js --name oracle-bot
```

## What It Does

✅ Fetches **real mainnet prices** for all 10 tokens every 5 minutes  
✅ Updates smart contract with BTC/ETH prices and volatility  
✅ Saves all token prices to `token-prices.json`  
✅ Frontend can read prices via `/api/prices` endpoint  

## Token Prices Tracked

| Token | Price Source |
|-------|--------------|
| **WBTC Category** | |
| WBTC | Wrapped Bitcoin mainnet price |
| cbBTC | Coinbase Wrapped BTC mainnet price |
| **BIG_CAPS** | |
| WETH | Ethereum mainnet price |
| cbETH | Coinbase Staked ETH mainnet price |
| **MID_LOWER_CAPS** | |
| AERO | Aerodrome Finance mainnet price |
| BRETT | Brett mainnet price |
| DEGEN | Degen mainnet price |
| TOSHI | Toshi mainnet price |
| **STABLECOINS** | |
| USDC | USD Coin mainnet price (~$1) |
| DAI | Dai mainnet price (~$1) |

## Output

### On-Chain (to Smart Contract)
- BTC Price (8 decimals)
- ETH Price (8 decimals)
- Total Market Cap
- Real Volatility (from 24h changes)

### Off-Chain (to JSON file)
- All 11 token prices
- Market caps
- 24h changes
- Timestamp
- Update count

## Frontend Access

```typescript
// Fetch prices
const response = await fetch('/api/prices');
const { prices } = await response.json();

// Use prices
const portfolioValue = 
  (wbtcBalance * prices.WBTC) +
  (usdcBalance * prices.USDC);
```

## Monitoring

```bash
# Check if running
pm2 status

# View logs
pm2 logs oracle-bot

# Check last prices
cat token-prices.json
```

## Environment Variables

```env
PRIVATE_KEY=0x...                    # Required
AI_ORACLE_ADDRESS=0x...              # Required
RPC_URL=https://sepolia.base.org     # Required
UPDATE_INTERVAL=*/5 * * * *          # Optional (default: every 5 min)
```

## Common Issues

**Rate Limiting:** Increase `UPDATE_INTERVAL` to `*/10 * * * *`  
**Out of Gas:** Keep 0.1 ETH minimum in bot wallet  
**Stale Prices:** Check bot is running with `pm2 status`  

See full guide: `AI_ORACLE_BOT_GUIDE.md`

