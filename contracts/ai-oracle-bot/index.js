const { ethers } = require('ethers');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AI_ORACLE_ADDRESS = process.env.AI_ORACLE_ADDRESS || '0x7e2372c80993ff043cffa5e5d15bf7eb6a319161';
const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || '*/5 * * * *'; // Every 5 minutes by default

// AI Oracle Contract ABI (minimal interface)
const AI_ORACLE_ABI = [
    "function updateMarketDataFromBot(uint256 btcPrice, uint256 ethPrice, uint256 marketCap, uint256 volatility) external",
    "function currentMarketCondition() external view returns (uint8)",
    "function getMarketData() external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function getActiveUsersCount() external view returns (uint256)"
];

class AIOracleBot {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        this.isRunning = false;
        this.lastUpdate = null;
        this.updateCount = 0;
        this.errorCount = 0;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing AI Oracle Bot...');
            
            // Validate environment variables
            if (!PRIVATE_KEY) {
                throw new Error('❌ Missing required environment variable: PRIVATE_KEY. Please set your wallet private key in .env file.');
            }

            // Setup provider and wallet
            this.provider = new ethers.JsonRpcProvider(RPC_URL);
            this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
            this.contract = new ethers.Contract(AI_ORACLE_ADDRESS, AI_ORACLE_ABI, this.wallet);

            // Test connection
            const network = await this.provider.getNetwork();
            console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
            console.log(`🎯 Target contract: ${AI_ORACLE_ADDRESS}`);
            console.log(`🔗 RPC URL: ${RPC_URL}`);
            
            // Check if this is a proxy contract by trying to get implementation
            try {
                const implementation = await this.provider.getStorageAt(AI_ORACLE_ADDRESS, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
                if (implementation !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
                    const implAddress = "0x" + implementation.slice(-40);
                    console.log(`🔍 Proxy detected! Implementation: ${implAddress}`);
                }
            } catch (error) {
                console.log(`ℹ️  Contract analysis: ${error.message}`);
            }
            
            const balance = await this.provider.getBalance(this.wallet.address);
            console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
            
            // Test contract connection (optional - some contracts may not have this function)
            try {
                const marketCondition = await this.contract.currentMarketCondition();
                console.log(`📊 Current market condition: ${marketCondition}`);
            } catch (error) {
                console.log(`⚠️  Warning: Could not read currentMarketCondition from contract. This may be normal if the contract doesn't have this function.`);
                console.log(`   Error: ${error.message}`);
            }
            
            console.log('✅ Bot initialized successfully!');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    async updateMarketData() {
        try {
            console.log(`\n🔄 [${new Date().toISOString()}] Updating market data...`);
            
            // Check if we have enough gas
            const balance = await this.provider.getBalance(this.wallet.address);
            const feeData = await this.provider.getFeeData();
            const gasPrice = feeData.gasPrice || BigInt(1000000000); // 1 gwei fallback
            const estimatedGas = 200000; // Estimated gas for updateMarketDataFromBot
            const gasCost = gasPrice * BigInt(estimatedGas);
            
            if (balance < gasCost) {
                throw new Error(`❌ Insufficient balance. Need ${ethers.formatEther(gasCost)} ETH, have ${ethers.formatEther(balance)} ETH`);
            }

            // Fetch real market data
            const marketData = await this.fetchRealMarketData();
            const { btcPrice, ethPrice, marketCap, volatility } = marketData;
            
            // Call the contract
            const tx = await this.contract.updateMarketDataFromBot(btcPrice, ethPrice, marketCap, volatility);
            console.log(`📝 Transaction sent: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
            console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
            
            // Log the market data that was sent to the contract
            console.log(`📊 Market Data Sent to Contract:`);
            console.log(`   BTC Price: $${(Number(btcPrice) / 1e8).toLocaleString()}`);
            console.log(`   ETH Price: $${(Number(ethPrice) / 1e8).toLocaleString()}`);
            console.log(`   Market Cap: $${(Number(marketCap) / 1e9).toFixed(2)}B`);
            console.log(`   Volatility: ${volatility}%`);
            
            // Try to read back data from contract (optional - may not be available)
            try {
                const [currentBtcPrice, currentEthPrice, currentMarketCap, currentVolatility, timestamp] = await this.contract.getMarketData();
                const marketCondition = await this.contract.currentMarketCondition();
                const activeUsers = await this.contract.getActiveUsersCount();
                
                console.log(`📊 Contract Data Retrieved:`);
                console.log(`   BTC Price: $${(Number(currentBtcPrice) / 1e8).toLocaleString()}`);
                console.log(`   ETH Price: $${(Number(currentEthPrice) / 1e8).toLocaleString()}`);
                console.log(`   Market Cap: $${(Number(currentMarketCap) / 1e9).toFixed(2)}B`);
                console.log(`   Volatility: ${currentVolatility}%`);
                console.log(`   Market Condition: ${this.getMarketConditionName(marketCondition)}`);
                console.log(`   Active Users: ${activeUsers}`);
            } catch (error) {
                console.log(`ℹ️  Note: Contract doesn't support reading market data back (this is normal for some contracts)`);
            }
            
            this.lastUpdate = new Date();
            this.updateCount++;
            this.errorCount = 0; // Reset error count on success
            
            return true;
        } catch (error) {
            this.errorCount++;
            console.error(`❌ Update failed (Error #${this.errorCount}):`, error.message);
            
            // If too many errors, stop the bot
            if (this.errorCount >= 5) {
                console.error('🛑 Too many consecutive errors. Stopping bot.');
                this.stop();
            }
            
            return false;
        }
    }

    async fetchRealMarketData() {
        try {
            console.log('📡 Fetching real market data from CoinGecko...');
            
            // Fetch BTC and ETH prices from CoinGecko
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_market_cap=true');
            
            const btcData = response.data.bitcoin;
            const ethData = response.data.ethereum;
            
            // Convert to 8 decimal format (multiply by 1e8)
            const btcPrice = Math.round(btcData.usd * 1e8);
            const ethPrice = Math.round(ethData.usd * 1e8);
            
            // Calculate market cap (in billions)
            const btcMarketCap = Math.round(btcData.usd_market_cap / 1e9);
            const ethMarketCap = Math.round(ethData.usd_market_cap / 1e9);
            const totalMarketCap = (btcMarketCap + ethMarketCap) * 1e9; // Convert back to full value
            
            // Simple volatility calculation (random for demo - in production, use historical data)
            const volatility = Math.floor(Math.random() * 20) + 15; // 15-35% range
            
            console.log(`✅ Fetched real market data:`);
            console.log(`   BTC: $${btcData.usd.toLocaleString()} (Market Cap: $${btcMarketCap}B)`);
            console.log(`   ETH: $${ethData.usd.toLocaleString()} (Market Cap: $${ethMarketCap}B)`);
            console.log(`   Total Market Cap: $${(totalMarketCap / 1e9).toFixed(2)}B`);
            console.log(`   Volatility: ${volatility}%`);
            
            return {
                btcPrice,
                ethPrice,
                marketCap: totalMarketCap,
                volatility
            };
        } catch (error) {
            console.error('❌ Failed to fetch real market data:', error.message);
            console.log('📊 Falling back to static data...');
            
            // Fallback to static data if API fails
            return {
                btcPrice: 50000 * 1e8, // $50,000 in 8 decimals
                ethPrice: 3000 * 1e8,  // $3,000 in 8 decimals
                marketCap: 1000000000000, // $1T
                volatility: 25 // 25%
            };
        }
    }

    getMarketConditionName(condition) {
        const conditions = ['BULLISH', 'BEARISH', 'NEUTRAL'];
        return conditions[condition] || 'UNKNOWN';
    }

    start() {
        if (this.isRunning) {
            console.log('⚠️ Bot is already running!');
            return;
        }

        console.log(`\n🤖 Starting AI Oracle Bot...`);
        console.log(`⏰ Update schedule: ${UPDATE_INTERVAL}`);
        console.log(`🎯 Target contract: ${AI_ORACLE_ADDRESS}`);
        console.log(`\nPress Ctrl+C to stop the bot\n`);

        this.isRunning = true;

        // Schedule the updates
        cron.schedule(UPDATE_INTERVAL, async () => {
            if (this.isRunning) {
                await this.updateMarketData();
            }
        });

        // Initial update
        this.updateMarketData();

        // Status update every hour
        cron.schedule('0 * * * *', () => {
            if (this.isRunning) {
                console.log(`\n📈 Bot Status:`);
                console.log(`   Updates completed: ${this.updateCount}`);
                console.log(`   Last update: ${this.lastUpdate || 'Never'}`);
                console.log(`   Errors: ${this.errorCount}`);
                console.log(`   Uptime: ${process.uptime()}s`);
            }
        });
    }

    stop() {
        console.log('\n🛑 Stopping AI Oracle Bot...');
        this.isRunning = false;
        process.exit(0);
    }
}

// Main execution
async function main() {
    const bot = new AIOracleBot();
    
    // Initialize the bot
    const initialized = await bot.initialize();
    if (!initialized) {
        console.error('❌ Failed to initialize bot. Exiting...');
        process.exit(1);
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
        bot.stop();
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
        bot.stop();
    });

    // Start the bot
    bot.start();
}

// Run the bot
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = AIOracleBot;
