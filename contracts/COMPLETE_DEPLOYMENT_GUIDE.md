# 🚀 Complete Deployment Guide: Smart Contracts + AI Oracle Bot

This comprehensive guide will walk you through deploying your Momentum smart contracts to testnet and setting up the AI Oracle automation bot.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] **Node.js** (v18+) installed: https://nodejs.org/
- [ ] **Git** installed: https://git-scm.com/
- [ ] **Foundry** installed: https://book.getfoundry.org/getting-started/installation
- [ ] **Code editor** (VS Code recommended)
- [ ] **Testnet ETH** for gas fees
- [ ] **RPC provider account** (Infura/Alchemy)

## 🎯 Part 1: Deploy Smart Contracts to Testnet

### Step 1.1: Set Up Environment Variables

Create a `.env` file in your contracts directory:

```bash
# Navigate to contracts directory
cd /Users/chidx/Documents/Learn/momentum-mvp/contracts

# Create .env file
touch .env
```

Add the following to your `.env` file:

```bash
# Network Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# Alternative: RPC_URL=https://sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Wallet Configuration
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Network Details
CHAIN_ID=11155111
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

### Step 1.2: Get Testnet ETH

**Option A: Sepolia Faucet**
1. Go to https://sepoliafaucet.com/
2. Enter your wallet address
3. Request testnet ETH (usually 0.1-0.5 ETH)

**Option B: Alchemy Faucet**
1. Go to https://sepoliafaucet.com/
2. Connect your wallet
3. Request testnet ETH

**Option C: Base Sepolia Faucet**
1. Go to https://bridge.base.org/deposit
2. Connect your wallet
3. Request testnet ETH

### Step 1.3: Get RPC URL

**Option A: Infura (Recommended)**
1. Go to https://infura.io/
2. Sign up for free account
3. Create new project
4. Select "Ethereum" network
5. Copy the Sepolia RPC URL
6. Format: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

**Option B: Alchemy**
1. Go to https://alchemy.com/
2. Sign up for free account
3. Create new app
4. Select "Ethereum" and "Sepolia"
5. Copy the RPC URL
6. Format: `https://sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### Step 1.4: Get Etherscan API Key (Optional)

1. Go to https://etherscan.io/apis
2. Sign up for free account
3. Create new API key
4. Copy the API key

### Step 1.5: Deploy Smart Contracts

```bash
# Navigate to contracts directory
cd /Users/chidx/Documents/Learn/momentum-mvp/contracts

# Load environment variables
source .env

# Deploy all contracts
forge script script/DeployAIOracle.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

**Expected Output:**
```
Deploying contracts with account: 0x1234...
Account balance: 0.1 ETH

MomentumVault deployed at: 0xABCD...
MomentumPortfolioManager deployed at: 0xEFGH...
MomentumAIOracle deployed at: 0xIJKL...
BTC Price Feed: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
ETH Price Feed: 0x694AA1769357215DE4FAC081bf1f309aDC325306
Owner: 0x1234...

=== Deployment Summary ===
Vault: 0xABCD...
Portfolio Manager: 0xEFGH...
AI Oracle: 0xIJKL...
BTC Price Feed: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
ETH Price Feed: 0x694AA1769357215DE4FAC081bf1f309aDC325306
Owner: 0x1234...
```

**Save these addresses!** You'll need them for the bot configuration.

### Step 1.6: Verify Contracts on Etherscan

1. Go to https://sepolia.etherscan.io/
2. Search for each contract address
3. Verify they're deployed and verified
4. Check the contract functions and events

### Step 1.7: Test Contract Functions

```bash
# Test AI Oracle functions
cast call $AI_ORACLE_ADDRESS "currentMarketCondition()" --rpc-url $RPC_URL

# Test price feed integration
cast call $AI_ORACLE_ADDRESS "updateMarketDataFromFeeds()" --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Check market data
cast call $AI_ORACLE_ADDRESS "getMarketData()" --rpc-url $RPC_URL
```

## 🤖 Part 2: Deploy AI Oracle Bot

### Step 2.1: Set Up Bot Project

```bash
# Navigate to bot directory
cd /Users/chidx/Documents/Learn/momentum-mvp/contracts/ai-oracle-bot

# Install dependencies
npm install

# Copy environment template
cp env.example .env
```

### Step 2.2: Configure Bot Environment

Edit the `.env` file with your contract addresses:

```bash
# Network Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Wallet Configuration (use same wallet as contract deployment)
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Contract Configuration (from Step 1.5)
AI_ORACLE_ADDRESS=0xIJKL...  # Your deployed AI Oracle address

# Bot Configuration
UPDATE_INTERVAL=*/5 * * * *  # Every 5 minutes
```

### Step 2.3: Test Bot Setup

```bash
# Test the configuration
node test-setup.js
```

**Expected Output:**
```
🧪 Testing AI Oracle Bot Setup...

1. Checking environment variables...
✅ All environment variables present

2. Testing RPC connection...
✅ Connected to sepolia (Chain ID: 11155111)

3. Testing wallet...
✅ Wallet address: 0x1234...
💰 Balance: 0.1 ETH

4. Testing contract connection...
✅ Contract connection successful
📊 Market condition: 0
📈 BTC Price: $50,000
📈 ETH Price: $3,000
👥 Active users: 0

🎉 All tests passed! Your bot is ready to deploy.
```

### Step 2.4: Test Bot Locally

```bash
# Run the bot locally
npm start
```

**Expected Output:**
```
🚀 Initializing AI Oracle Bot...
✅ Connected to network: sepolia (Chain ID: 11155111)
💰 Wallet balance: 0.1 ETH
📊 Current market condition: 0
✅ Bot initialized successfully!

🤖 Starting AI Oracle Bot...
⏰ Update schedule: */5 * * * *
🎯 Target contract: 0xIJKL...

🔄 [2024-01-15T10:00:00.000Z] Updating market data...
📝 Transaction sent: 0xabcd1234...
✅ Transaction confirmed in block 12345678
⛽ Gas used: 150000
📊 Market Data Updated:
   BTC Price: $50,000
   ETH Price: $3,000
   Market Cap: $1.2T
   Volatility: 25%
   Market Condition: NEUTRAL
   Active Users: 0
```

**Press Ctrl+C to stop the test.**

## 🌐 Part 3: Deploy Bot to Production

### Step 3.1: Install Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Verify installation
vercel --version
```

### Step 3.2: Login to Vercel

```bash
# Login to Vercel
vercel login

# Follow the prompts to authenticate
```

### Step 3.3: Deploy to Vercel

```bash
# From the ai-oracle-bot directory
cd /Users/chidx/Documents/Learn/momentum-mvp/contracts/ai-oracle-bot

# Deploy to Vercel
vercel --prod
```

**Answer the prompts:**
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name: **ai-oracle-bot** (or your choice)
- Directory: **./** (current directory)
- Override settings? **N**

### Step 3.4: Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `RPC_URL` | `https://sepolia.infura.io/v3/YOUR_PROJECT_ID` | Production |
| `PRIVATE_KEY` | `0x1234...` | Production |
| `AI_ORACLE_ADDRESS` | `0xIJKL...` | Production |
| `UPDATE_INTERVAL` | `*/5 * * * *` | Production |

### Step 3.5: Redeploy with Environment Variables

```bash
# Redeploy with environment variables
vercel --prod
```

## 🔄 Part 4: Set Up Automation

### Step 4.1: Create GitHub Actions (Recommended)

Create `.github/workflows/automation.yml` in your bot project:

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

### Step 4.2: Set GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

| Name | Value |
|------|-------|
| `RPC_URL` | `https://sepolia.infura.io/v3/YOUR_PROJECT_ID` |
| `PRIVATE_KEY` | `0x1234...` |
| `AI_ORACLE_ADDRESS` | `0xIJKL...` |

### Step 4.3: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial AI Oracle bot deployment"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

## 📊 Part 5: Monitoring and Verification

### Step 5.1: Check Vercel Deployment

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Functions** tab
4. Click on your function to see logs

### Step 5.2: Monitor Contract Events

**Option A: Etherscan**
1. Go to https://sepolia.etherscan.io/
2. Search for your AI Oracle contract address
3. Go to **Events** tab
4. Look for `MarketDataUpdated` events

**Option B: Alchemy Dashboard**
1. Go to https://dashboard.alchemy.com/
2. Select your app
3. Go to **Explorer** tab
4. Filter by your contract address

### Step 5.3: Test Bot Functionality

```bash
# Test contract connection
cast call $AI_ORACLE_ADDRESS "currentMarketCondition()" --rpc-url $RPC_URL

# Test manual update
cast send $AI_ORACLE_ADDRESS "updateMarketDataFromFeeds()" --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Check market data
cast call $AI_ORACLE_ADDRESS "getMarketData()" --rpc-url $RPC_URL
```

### Step 5.4: Verify Automation

Wait 5-10 minutes and check:

1. **Vercel logs** show regular updates
2. **Etherscan events** show `MarketDataUpdated` events
3. **Contract state** shows updated market data
4. **GitHub Actions** show successful runs

## 🛠️ Part 6: Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Missing required environment variables"
**Solution:**
- Check your `.env` file
- Verify Vercel environment variables are set
- Ensure all required variables are present

#### Issue 2: "Insufficient balance"
**Solution:**
- Add more testnet ETH to your wallet
- Check current gas prices
- Verify wallet address is correct

#### Issue 3: "Transaction failed"
**Solution:**
- Verify contract address is correct
- Check if contract is paused
- Test RPC connection
- Verify network is correct

#### Issue 4: "Bot not updating"
**Solution:**
- Check Vercel function logs
- Verify cron job is running
- Test manually by visiting Vercel URL
- Check GitHub Actions status

### Debug Commands

```bash
# Test RPC connection
cast block-number --rpc-url $RPC_URL

# Test wallet balance
cast balance $WALLET_ADDRESS --rpc-url $RPC_URL

# Test contract call
cast call $AI_ORACLE_ADDRESS "currentMarketCondition()" --rpc-url $RPC_URL

# Test contract state
cast call $AI_ORACLE_ADDRESS "getMarketData()" --rpc-url $RPC_URL
```

## 🎉 Part 7: Success Verification

### What You Should See

After successful deployment, you should see:

1. **Smart Contracts Deployed:**
   - Vault contract on Etherscan
   - Portfolio Manager contract on Etherscan
   - AI Oracle contract on Etherscan
   - All contracts verified

2. **Bot Running:**
   - Vercel deployment successful
   - Environment variables set
   - Bot updating every 5 minutes
   - No errors in logs

3. **Automation Working:**
   - Market data updating regularly
   - Contract events firing
   - Portfolio rebalancing when needed
   - All users handled automatically

### Final Checklist

- [ ] Smart contracts deployed to testnet
- [ ] Contracts verified on Etherscan
- [ ] Bot deployed to Vercel
- [ ] Environment variables configured
- [ ] Bot updating every 5 minutes
- [ ] No errors in logs
- [ ] Market data updating correctly
- [ ] Contract events firing
- [ ] Automation working properly

## 🚀 Part 8: Next Steps

### Immediate Actions

1. **Monitor for 24 hours** to ensure stability
2. **Set up alerts** for failures
3. **Test with real users** (create test portfolios)
4. **Monitor gas costs** and optimize if needed

### Future Enhancements

1. **Upgrade to mainnet** when ready
2. **Add more sophisticated monitoring**
3. **Implement backup automation**
4. **Add more price feeds**
5. **Optimize gas usage**

### Production Considerations

1. **Use dedicated wallet** for production
2. **Set up proper monitoring**
3. **Implement circuit breakers**
4. **Add backup RPC providers**
5. **Set up alerting system**

## 🆘 Support and Resources

### Documentation
- **Foundry Book**: https://book.getfoundry.org/
- **Ethers.js Docs**: https://docs.ethers.org/
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions

### Community
- **Foundry Discord**: https://discord.gg/foundry
- **Ethers.js Discord**: https://discord.gg/ethers
- **Vercel Community**: https://github.com/vercel/vercel/discussions

### Tools
- **Etherscan**: https://sepolia.etherscan.io/
- **Alchemy Dashboard**: https://dashboard.alchemy.com/
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 🎊 Congratulations!

You now have a **fully automated AI Oracle system** running on testnet! 

Your system will:
- ✅ **Monitor market conditions 24/7**
- ✅ **Automatically rebalance portfolios**
- ✅ **Handle thousands of users**
- ✅ **Run without human intervention**
- ✅ **Scale automatically**

**Your AI Oracle is now truly autonomous! 🚀**
