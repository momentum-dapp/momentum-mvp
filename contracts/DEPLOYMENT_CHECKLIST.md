# 🚀 MomentumAIOracle v2.0.0 Deployment Checklist

## Pre-Deployment

- [ ] Review changes in `contracts/src/MomentumAIOracle.sol`
- [ ] Read `AI_ORACLE_UPGRADE_GUIDE.md`
- [ ] Ensure `.env` file is configured:
  ```bash
  PRIVATE_KEY=your_private_key_here
  RPC_URL=https://sepolia.base.org
  ETHERSCAN_API_KEY=your_basescan_api_key  # Optional
  ```
- [ ] Verify you have enough Base Sepolia ETH for deployment (~$0.01 worth)
- [ ] Confirm you're the owner of the proxy contract

## Deployment Steps

### Step 1: Upgrade Smart Contract

```bash
cd contracts

# Run upgrade script
forge script script/UpgradeAIOracle.s.sol:UpgradeAIOracle \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

**Expected output:**
- ✅ New implementation deployed
- ✅ Proxy upgraded
- ✅ Version is 2.0.0

- [ ] Upgrade script executed successfully
- [ ] No errors in terminal output
- [ ] Transaction confirmed on BaseScan

### Step 2: Verify Upgrade

```bash
# Check version (should return "2.0.0")
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "version()" --rpc-url $RPC_URL

# Check supported tokens count (should be 0 initially)
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getSupportedTokensCount()" --rpc-url $RPC_URL

# Check AI Oracle Bot address
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getAIOracleBot()" --rpc-url $RPC_URL
```

- [ ] Version confirmed as "2.0.0"
- [ ] Supported tokens count is 0 (will increase after bot runs)
- [ ] AI Oracle Bot address is correct

### Step 3: Test New Functions (Optional but Recommended)

```bash
# Test updating token prices manually (as owner)
SYMBOLS='["WBTC","USDC"]'
PRICES='[9500000000000,100000000]'

cast send 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
  "updateTokenPrices(string[],uint256[])" \
  "$SYMBOLS" "$PRICES" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Verify the prices were stored
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
  "getTokenPrice(string)" "WBTC" \
  --rpc-url $RPC_URL
```

- [ ] Manual price update successful
- [ ] Price query returns correct values

### Step 4: Restart AI Oracle Bot

```bash
cd contracts/ai-oracle-bot

# Stop old bot if running (Ctrl+C or kill process)
# Start new bot
npm start
```

**Expected behavior:**
- Bot connects to contract
- Fetches prices from CoinGecko
- Updates contract with all 10 token prices
- Logs show all token prices being sent

- [ ] AI Oracle Bot started successfully
- [ ] Bot logs show price fetching
- [ ] Bot successfully calls `updateMarketDataAndPrices()`
- [ ] Transaction confirmed on BaseScan
- [ ] All 10 token prices logged

### Step 5: Verify Bot Updates

After bot runs (wait 5 minutes):

```bash
# Check supported tokens count (should be 10 now)
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getSupportedTokensCount()" --rpc-url $RPC_URL

# Get all supported tokens
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getSupportedTokens()" --rpc-url $RPC_URL

# Check USDC price
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getTokenPrice(string)" "USDC" --rpc-url $RPC_URL
```

- [ ] Supported tokens count is 10 (or more)
- [ ] All token symbols listed correctly
- [ ] Token prices are non-zero and reasonable

## Post-Deployment

### Monitor Bot

- [ ] Bot runs every 5 minutes without errors
- [ ] Gas costs are reasonable (~$0.001 per update)
- [ ] All transactions confirm successfully
- [ ] Check bot logs for any warnings

### Frontend Integration (Optional)

- [ ] Update frontend to query new price functions
- [ ] Display all supported tokens
- [ ] Show last update timestamps
- [ ] Test price displays in UI

### Documentation

- [ ] Update team on new features
- [ ] Share relevant documentation:
  - `AI_ORACLE_UPGRADE_GUIDE.md`
  - `AI_ORACLE_QUICK_REFERENCE.md`
  - `MOMENTUM_AI_ORACLE_V2_COMPLETE.md`

## Troubleshooting

### Upgrade Failed

**Error: "Ownable: caller is not the owner"**
- [ ] Verify you're using the correct private key
- [ ] Confirm your address is the owner:
  ```bash
  cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "owner()" --rpc-url $RPC_URL
  ```

**Error: "Insufficient funds"**
- [ ] Get more Base Sepolia ETH from faucet
- [ ] Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### Bot Issues

**Error: "Only AI Oracle Bot or owner can update"**
- [ ] Check bot address is set correctly in contract
- [ ] Set bot address if needed:
  ```bash
  cast send 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 \
    "setAIOracleBot(address)" 0xYourBotAddress \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY
  ```

**Error: "Price update too frequent"**
- [ ] Normal - bot respects 5-minute rate limit
- [ ] Wait 5 minutes and check again

**CoinGecko API Issues**
- [ ] Check internet connection
- [ ] Verify CoinGecko API is accessible
- [ ] Check rate limits (free tier: 10-30 calls/min)

### Price Data Issues

**Prices are zero**
- [ ] Wait for bot to run (initial update may take 5 minutes)
- [ ] Check bot logs for errors
- [ ] Manually trigger update to test

**Prices seem incorrect**
- [ ] Remember: prices are in 8 decimals
- [ ] Divide by 100000000 to get USD price
- [ ] Compare with CoinGecko prices directly

## Success Criteria

All must be ✅ before considering deployment complete:

- [ ] ✅ Contract upgraded to v2.0.0
- [ ] ✅ AI Oracle Bot running and updating prices
- [ ] ✅ All 10 tokens registered and have prices
- [ ] ✅ No errors in bot logs for 30 minutes
- [ ] ✅ Price queries work from scripts/frontend
- [ ] ✅ Transactions appear on BaseScan

## Rollback Plan (If Needed)

If something goes wrong:

1. **Old functions still work** - v1.0.0 is backwards compatible
2. **Can upgrade again** - Deploy new implementation and upgrade
3. **Bot can use old function** - Change bot to use `updateMarketDataFromBot()`

To rollback bot temporarily:
```javascript
// In contracts/ai-oracle-bot/index.js
// Change back to old function:
const tx = await this.contract.updateMarketDataFromBot(btcPrice, ethPrice, marketCap, volatility);
```

## Resources

- **Upgrade Guide**: `contracts/AI_ORACLE_UPGRADE_GUIDE.md`
- **Quick Reference**: `contracts/AI_ORACLE_QUICK_REFERENCE.md`
- **Summary**: `contracts/ORACLE_UPDATE_SUMMARY.md`
- **Complete Guide**: `MOMENTUM_AI_ORACLE_V2_COMPLETE.md`
- **Bot Guide**: `contracts/ai-oracle-bot/AI_ORACLE_BOT_GUIDE.md`

## Quick Commands Reference

```bash
# Check version
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "version()" --rpc-url $RPC_URL

# Get supported tokens
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getSupportedTokens()" --rpc-url $RPC_URL

# Get token price
cast call 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161 "getTokenPrice(string)" "USDC" --rpc-url $RPC_URL

# Start bot
cd contracts/ai-oracle-bot && npm start

# View bot logs (if using pm2)
pm2 logs ai-oracle-bot

# Stop bot
pm2 stop ai-oracle-bot  # or Ctrl+C
```

---

**Ready to deploy?** Start with the Pre-Deployment checklist above! 🚀

