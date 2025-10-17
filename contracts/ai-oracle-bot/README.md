# 🚀 AI Oracle Automation Bot

Automated bot for updating market data in the Momentum AI Oracle contract.

**Get your AI Oracle automation running in 10 minutes!**

## ⚡ Super Quick Start (3 steps)

### 1. Run Setup Script
```bash
cd /Users/chidx/Documents/Learn/momentum-mvp/contracts/ai-oracle-bot
./quick-start.sh
```

### 2. Configure Your Settings
Edit the `.env` file with your values:
```bash
nano .env
```

**Required values:**
- `RPC_URL`: Your Ethereum RPC endpoint (Infura/Alchemy)
- `PRIVATE_KEY`: Your wallet private key (for gas fees)
- `AI_ORACLE_ADDRESS`: Your deployed AI Oracle contract address

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

**That's it! Your bot is now running automatically! 🎉**

## 📋 Prerequisites

Before starting, make sure you have:

- [ ] **Node.js** installed (version 18 or higher)
  - Download from: https://nodejs.org/
  - Verify: `node --version`

- [ ] **Git** installed
  - Download from: https://git-scm.com/
  - Verify: `git --version`

- [ ] **Code editor** (VS Code recommended)
  - Download from: https://code.visualstudio.com/

- [ ] **Your smart contracts deployed**
  - AI Oracle contract address
  - Network RPC URL

## 🎯 Step 1: Get Your Contract Information

### 1.1 Deploy Your AI Oracle Contract

If you haven't deployed yet:

```bash
cd /Users/chidx/Documents/Learn/momentum-mvp/contracts
forge script script/DeployAIOracle.s.sol --rpc-url $RPC_URL --broadcast --verify
```

**Save these values:**
- AI Oracle contract address: `0x...`
- Network RPC URL: `https://...`

### 1.2 Get RPC URL

**Option A: Infura (Recommended)**
1. Go to https://infura.io/
2. Sign up for free account
3. Create new project
4. Copy the RPC URL (e.g., `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`)

**Option B: Alchemy**
1. Go to https://alchemy.com/
2. Sign up for free account
3. Create new app
4. Copy the RPC URL (e.g., `https://sepolia.g.alchemy.com/v2/YOUR_API_KEY`)

## 🛠️ Step 2: Set Up the Bot Project

### 2.1 Install Dependencies

```bash
cd /Users/chidx/Documents/Learn/momentum-mvp/contracts/ai-oracle-bot
npm install
```

### 2.2 Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your values
nano .env
```

**Fill in your .env file:**
```bash
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
AI_ORACLE_ADDRESS=0x1234567890123456789012345678901234567890
UPDATE_INTERVAL=*/5 * * * *
```

**⚠️ Important:**
- Use a **dedicated wallet** for the bot (not your main wallet)
- **Never share your private key**
- Make sure the wallet has some ETH for gas fees

### 2.3 Test Locally

```bash
# Test the bot locally
npm start
```

You should see output like:
```
🚀 Initializing AI Oracle Bot...
✅ Connected to network: sepolia (Chain ID: 11155111)
💰 Wallet balance: 0.1 ETH
📊 Current market condition: 0
✅ Bot initialized successfully!

🤖 Starting AI Oracle Bot...
⏰ Update schedule: */5 * * * *
🎯 Target contract: 0x1234...

🔄 [2024-01-15T10:00:00.000Z] Updating market data...
📝 Transaction sent: 0xabcd...
✅ Transaction confirmed in block 12345678
```

**Press Ctrl+C to stop the test.**

## 🌐 Step 3: Deploy to Vercel (Recommended)

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

Follow the prompts to login with your GitHub account.

### 3.3 Deploy the Bot

```bash
# From the ai-oracle-bot directory
vercel --prod
```

**Answer the prompts:**
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name: **ai-oracle-bot** (or your choice)
- Directory: **./** (current directory)
- Override settings? **N**

### 3.4 Set Environment Variables

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `RPC_URL` | `https://sepolia.infura.io/v3/YOUR_PROJECT_ID` | Production |
| `PRIVATE_KEY` | `0x1234...` | Production |
| `AI_ORACLE_ADDRESS` | `0x1234...` | Production |
| `UPDATE_INTERVAL` | `*/5 * * * *` | Production |

### 3.5 Redeploy with Environment Variables

```bash
vercel --prod
```

## 🔄 Step 4: Set Up Automation

### 4.1 Create a Cron Job

Since Vercel doesn't support cron jobs directly, we'll use a different approach:

**Option A: Use Uptime Robot (Free)**
1. Go to https://uptimerobot.com/
2. Sign up for free account
3. Add new monitor:
   - Type: **HTTP(s)**
   - URL: `https://your-bot-name.vercel.app/`
   - Interval: **5 minutes**

**Option B: Use GitHub Actions (Free)**
1. Create `.github/workflows/automation.yml` in your bot project:

```yaml
name: AI Oracle Bot
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  update-prices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Update market data
        env:
          RPC_URL: ${{ secrets.RPC_URL }}
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          AI_ORACLE_ADDRESS: ${{ secrets.AI_ORACLE_ADDRESS }}
        run: node -e "
          const { ethers } = require('ethers');
          const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
          const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
          const contract = new ethers.Contract(process.env.AI_ORACLE_ADDRESS, [
            'function updateMarketDataFromFeeds() external'
          ], wallet);
          contract.updateMarketDataFromFeeds().then(tx => {
            console.log('Transaction sent:', tx.hash);
            return tx.wait();
          }).then(receipt => {
            console.log('Confirmed in block:', receipt.blockNumber);
          }).catch(console.error);
        "
```

2. Add secrets to your GitHub repository:
   - Go to repository → Settings → Secrets and variables → Actions
   - Add: `RPC_URL`, `PRIVATE_KEY`, `AI_ORACLE_ADDRESS`

## 🔧 Alternative Deployment Options

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up

# Set environment variables
railway variables set RPC_URL=your_rpc_url
railway variables set PRIVATE_KEY=your_private_key
railway variables set AI_ORACLE_ADDRESS=your_contract_address
```

### Heroku
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-bot-name

# Set environment variables
heroku config:set RPC_URL=your_rpc_url
heroku config:set PRIVATE_KEY=your_private_key
heroku config:set AI_ORACLE_ADDRESS=your_contract_address

# Deploy
git push heroku main
```

## 📊 What Happens Next

Once deployed, your bot will:

- ✅ **Update market data every 5 minutes**
- ✅ **Automatically detect bearish markets**
- ✅ **Move all portfolios to 100% stablecoins when bearish**
- ✅ **Restore original allocations when market recovers**
- ✅ **Handle thousands of users automatically**
- ✅ **Run 24/7 without human intervention**

## 📊 Step 5: Monitor Your Bot

### 5.1 Check Vercel Logs

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Functions** tab
4. Click on your function to see logs

### 5.2 Monitor Contract Events

You can monitor your contract events using:

**Option A: Etherscan**
1. Go to https://sepolia.etherscan.io/
2. Search for your contract address
3. Go to **Events** tab
4. Look for `MarketDataUpdated` events

**Option B: Alchemy Dashboard**
1. Go to https://dashboard.alchemy.com/
2. Select your app
3. Go to **Explorer** tab
4. Filter by your contract address

### 5.3 Set Up Alerts

**Option A: Email Alerts**
Create a simple monitoring script that sends emails on failures.

**Option B: Discord/Slack Webhooks**
Set up webhook notifications for bot status.

### Bot Logging

The bot provides detailed logging:

- ✅ Successful updates with market data
- ❌ Error messages with details
- 📈 Status updates every hour
- ⛽ Gas usage information
- 💰 Wallet balance checks

### Check Bot Status
- **Vercel**: Dashboard → Your project → Functions → View logs
- **Railway**: Dashboard → Your project → Deployments → View logs
- **Heroku**: Dashboard → Your app → More → View logs

## 🛠️ Step 6: Troubleshooting

### Common Issues

**1. "Missing required environment variables"**
- Check your Vercel environment variables
- Make sure they're set for Production environment

**2. "Insufficient balance"**
- Add ETH to your bot wallet
- Check current gas prices

**3. "Transaction failed"**
- Verify contract address is correct
- Check if contract is paused
- Verify network connection

**4. "Bot not updating"**
- Check Vercel function logs
- Verify cron job is running
- Test manually by visiting your Vercel URL

### Debug Commands

```bash
# Test contract connection
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');
const contract = new ethers.Contract('YOUR_CONTRACT_ADDRESS', [
  'function currentMarketCondition() external view returns (uint8)'
], provider);
contract.currentMarketCondition().then(console.log);
"

# Test wallet balance
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
wallet.getBalance().then(balance => console.log('Balance:', ethers.formatEther(balance), 'ETH'));
"

# Test setup
node test-setup.js

# Test locally
npm start
```

### Debug Mode

Run with debug logging:
```bash
DEBUG=* npm start
```

## 🔒 Security

- Never commit your `.env` file
- Use a dedicated wallet for the bot
- Monitor gas costs
- Set up alerts for failures

## 📈 Scaling

For high-frequency updates, consider:

1. **Multiple instances**: Deploy to multiple regions
2. **Load balancing**: Use multiple RPC endpoints
3. **Monitoring**: Set up external monitoring
4. **Backup**: Keep local backup running

## 💰 Costs

| Service | Cost | Features |
|---------|------|----------|
| **Vercel** | **$0** | Free tier, easy setup |
| Railway | $0 | Free tier, good for beginners |
| Heroku | $0 | Free tier, reliable |
| Gas fees | ~$0.01-0.05 per update | Depends on network |

**Total monthly cost: $0-5** (mostly gas fees)

## 🎉 Step 7: Success!

Your AI Oracle bot is now running automatically! 

**What happens next:**
- ✅ Bot updates market data every 5 minutes
- ✅ Automatically detects bearish markets
- ✅ Moves all portfolios to 100% stablecoins when needed
- ✅ Restores original allocations when market recovers
- ✅ Handles thousands of users automatically

**Monitoring checklist:**
- [ ] Bot is updating every 5 minutes
- [ ] Transactions are successful
- [ ] Gas costs are reasonable
- [ ] No errors in logs
- [ ] Market conditions are updating correctly

Once everything is running, you'll see logs like:

```
🔄 [2024-01-15T10:00:00.000Z] Updating market data...
📝 Transaction sent: 0xabcd1234...
✅ Transaction confirmed in block 12345678
📊 Market Data Updated:
   BTC Price: $65,000
   ETH Price: $4,200
   Market Condition: BULLISH
   Active Users: 150
```

**🎊 Congratulations! Your AI Oracle is now fully automated!** 

The bot will run 24/7, automatically managing portfolios based on real-time market conditions. No more manual intervention needed!

## 💰 Costs

| Service | Cost | Features |
|---------|------|----------|
| **Vercel** | **$0** | Free tier, easy setup |
| Railway | $0 | Free tier, good for beginners |
| Heroku | $0 | Free tier, reliable |
| Gas fees | ~$0.01-0.05 per update | Depends on network |

**Total monthly cost: $0-5** (mostly gas fees)

## 📈 Scaling

For high-frequency updates, consider:

1. **Multiple instances**: Deploy to multiple regions
2. **Load balancing**: Use multiple RPC endpoints
3. **Monitoring**: Set up external monitoring
4. **Backup**: Keep local backup running

## 🆘 Support

If you need help:

1. **Check the logs** for error messages
2. **Test locally** first to isolate issues
3. **Verify configuration** (RPC URL, contract address, private key)
4. **Check network status** (Etherscan, Alchemy status page)

**Common solutions:**
- Restart the bot: `vercel --prod`
- Check gas prices: https://ethgasstation.info/
- Verify contract: Check on Etherscan
- Test RPC: Use different provider

**Next steps:**
- Monitor the bot for a few days
- Set up alerts for failures
- Consider upgrading to paid hosting for production
- Add more sophisticated monitoring
