const { ethers } = require('ethers');
const cron = require('node-cron');
require('dotenv').config();

// Configuration
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AI_ORACLE_ADDRESS = process.env.AI_ORACLE_ADDRESS;
const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || '*/30 * * * *'; // Every 30 minutes by default

// Cost optimization settings
const PRICE_CHANGE_THRESHOLD = parseFloat(process.env.PRICE_CHANGE_THRESHOLD) || 5; // 5% price change threshold
const MAX_GAS_PRICE = parseFloat(process.env.MAX_GAS_PRICE) || 3; // 3 gwei maximum gas price
const MIN_UPDATE_INTERVAL = 15 * 60; // 15 minutes minimum between updates

// AI Oracle Contract ABI
const AI_ORACLE_ABI = [
    "function updateMarketDataFromFeeds() external",
    "function currentMarketCondition() external view returns (uint8)",
    "function getMarketData() external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function getActiveUsersCount() external view returns (uint256)"
];

class OptimizedAIOracleBot {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        this.isRunning = false;
        this.lastUpdate = null;
        this.lastPrices = { btc: 0, eth: 0 };
        this.updateCount = 0;
        this.errorCount = 0;
        this.skippedCount = 0;
        this.gasPriceHistory = [];
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Optimized AI Oracle Bot...');
            
            // Validate environment variables
            if (!RPC_URL || !PRIVATE_KEY || !AI_ORACLE_ADDRESS) {
                throw new Error('❌ Missing required environment variables. Check your .env file.');
            }

            // Setup provider and wallet
            this.provider = new ethers.JsonRpcProvider(RPC_URL);
            this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
            this.contract = new ethers.Contract(AI_ORACLE_ADDRESS, AI_ORACLE_ABI, this.wallet);

            // Test connection
            const network = await this.provider.getNetwork();
            console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
            
            const balance = await this.wallet.getBalance();
            console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
            
            // Test contract connection
            const marketCondition = await this.contract.currentMarketCondition();
            console.log(`📊 Current market condition: ${marketCondition}`);
            
            // Load last prices
            await this.loadLastPrices();
            
            console.log('✅ Optimized bot initialized successfully!');
            console.log(`⚙️  Price change threshold: ${PRICE_CHANGE_THRESHOLD}%`);
            console.log(`⛽ Max gas price: ${MAX_GAS_PRICE} gwei`);
            console.log(`⏰ Update interval: ${UPDATE_INTERVAL}`);
            
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    async loadLastPrices() {
        try {
            const [btcPrice, ethPrice] = await this.contract.getMarketData();
            this.lastPrices.btc = Number(btcPrice) / 1e8;
            this.lastPrices.eth = Number(ethPrice) / 1e8;
            console.log(`📈 Last BTC price: $${this.lastPrices.btc.toLocaleString()}`);
            console.log(`📈 Last ETH price: $${this.lastPrices.eth.toLocaleString()}`);
        } catch (error) {
            console.log('⚠️ Could not load last prices, will update on first run');
        }
    }

    async shouldUpdate() {
        try {
            // Check if enough time has passed since last update
            if (this.lastUpdate && (Date.now() - this.lastUpdate.getTime()) < MIN_UPDATE_INTERVAL * 1000) {
                console.log('⏳ Minimum update interval not reached');
                return false;
            }

            // Check gas price
            const gasPrice = await this.provider.getGasPrice();
            const gasPriceGwei = Number(ethers.formatUnits(gasPrice, 'gwei'));
            
            if (gasPriceGwei > MAX_GAS_PRICE) {
                console.log(`⛽ Gas price too high: ${gasPriceGwei.toFixed(4)} gwei (max: ${MAX_GAS_PRICE} gwei)`);
                return false;
            }

            // Check price change threshold
            const [btcPrice, ethPrice] = await this.contract.getMarketData();
            const currentBtcPrice = Number(btcPrice) / 1e8;
            const currentEthPrice = Number(ethPrice) / 1e8;

            if (this.lastPrices.btc === 0 || this.lastPrices.eth === 0) {
                console.log('📊 First update - no previous prices to compare');
                return true;
            }

            const btcChange = Math.abs(currentBtcPrice - this.lastPrices.btc) / this.lastPrices.btc * 100;
            const ethChange = Math.abs(currentEthPrice - this.lastPrices.eth) / this.lastPrices.eth * 100;

            console.log(`📊 Price changes - BTC: ${btcChange.toFixed(2)}%, ETH: ${ethChange.toFixed(2)}%`);

            if (btcChange > PRICE_CHANGE_THRESHOLD || ethChange > PRICE_CHANGE_THRESHOLD) {
                console.log(`✅ Price change threshold exceeded (${PRICE_CHANGE_THRESHOLD}%)`);
                return true;
            }

            console.log(`⏭️ Price change below threshold (${PRICE_CHANGE_THRESHOLD}%)`);
            return false;

        } catch (error) {
            console.error('❌ Error checking update conditions:', error.message);
            return true; // Update on error
        }
    }

    async shouldUpdateAdvanced() {
        try {
            // Check if enough time has passed since last update
            if (this.lastUpdate && (Date.now() - this.lastUpdate.getTime()) < MIN_UPDATE_INTERVAL * 1000) {
                console.log('⏳ Minimum update interval not reached');
                return { shouldUpdate: false, reason: 'MIN_INTERVAL' };
            }

            // Check gas price with advanced logic
            const gasPrice = await this.provider.getGasPrice();
            const gasPriceGwei = Number(ethers.formatUnits(gasPrice, 'gwei'));
            
            // Update gas price history
            this.gasPriceHistory.push(gasPriceGwei);
            if (this.gasPriceHistory.length > 100) {
                this.gasPriceHistory.shift();
            }

            // Calculate average gas price
            const avgGasPrice = this.gasPriceHistory.reduce((a, b) => a + b, 0) / this.gasPriceHistory.length;
            const gasPricePercentile = this.gasPriceHistory.sort((a, b) => a - b)[Math.floor(this.gasPriceHistory.length * 0.1)]; // 10th percentile

            console.log(`⛽ Gas price: ${gasPriceGwei.toFixed(4)} gwei (avg: ${avgGasPrice.toFixed(4)}, 10th percentile: ${gasPricePercentile.toFixed(4)})`);

            // Dynamic gas price threshold based on historical data
            const dynamicGasThreshold = Math.max(MAX_GAS_PRICE, gasPricePercentile * 2);
            
            if (gasPriceGwei > dynamicGasThreshold) {
                console.log(`⛽ Gas price too high: ${gasPriceGwei.toFixed(4)} gwei (dynamic threshold: ${dynamicGasThreshold.toFixed(4)} gwei)`);
                return { shouldUpdate: false, reason: 'HIGH_GAS', gasPrice: gasPriceGwei, threshold: dynamicGasThreshold };
            }

            // Check price change threshold with market volatility consideration
            const [btcPrice, ethPrice, marketCap, volatility, timestamp] = await this.contract.getMarketData();
            const currentBtcPrice = Number(btcPrice) / 1e8;
            const currentEthPrice = Number(ethPrice) / 1e8;

            if (this.lastPrices.btc === 0 || this.lastPrices.eth === 0) {
                console.log('📊 First update - no previous prices to compare');
                return { shouldUpdate: true, reason: 'FIRST_UPDATE' };
            }

            const btcChange = Math.abs(currentBtcPrice - this.lastPrices.btc) / this.lastPrices.btc * 100;
            const ethChange = Math.abs(currentEthPrice - this.lastPrices.eth) / this.lastPrices.eth * 100;

            // Dynamic price change threshold based on market volatility
            const dynamicPriceThreshold = Math.max(PRICE_CHANGE_THRESHOLD, volatility / 10); // Adjust based on volatility
            const maxChange = Math.max(btcChange, ethChange);

            console.log(`📊 Price changes - BTC: ${btcChange.toFixed(2)}%, ETH: ${ethChange.toFixed(2)}%`);
            console.log(`📊 Market volatility: ${volatility}%, Dynamic threshold: ${dynamicPriceThreshold.toFixed(2)}%`);

            if (maxChange > dynamicPriceThreshold) {
                console.log(`✅ Price change threshold exceeded (${dynamicPriceThreshold.toFixed(2)}%)`);
                return { 
                    shouldUpdate: true, 
                    reason: 'PRICE_CHANGE', 
                    btcChange, 
                    ethChange, 
                    threshold: dynamicPriceThreshold,
                    volatility
                };
            }

            // Check if it's been too long since last update (force update after 2 hours)
            const hoursSinceLastUpdate = this.lastUpdate ? (Date.now() - this.lastUpdate.getTime()) / (1000 * 60 * 60) : 0;
            if (hoursSinceLastUpdate > 2) {
                console.log(`⏰ Force update - ${hoursSinceLastUpdate.toFixed(1)} hours since last update`);
                return { shouldUpdate: true, reason: 'FORCE_UPDATE', hoursSinceLastUpdate };
            }

            console.log(`⏭️ Price change below threshold (${dynamicPriceThreshold.toFixed(2)}%)`);
            return { 
                shouldUpdate: false, 
                reason: 'LOW_PRICE_CHANGE', 
                btcChange, 
                ethChange, 
                threshold: dynamicPriceThreshold,
                volatility
            };

        } catch (error) {
            console.error('❌ Error checking update conditions:', error.message);
            return { shouldUpdate: true, reason: 'ERROR', error: error.message };
        }
    }

    async updateMarketData() {
        try {
            // Use advanced conditional logic
            const updateDecision = await this.shouldUpdateAdvanced();
            
            if (!updateDecision.shouldUpdate) {
                this.skippedCount++;
                console.log(`⏭️ Skipping update (${updateDecision.reason}) - skipped: ${this.skippedCount}`);
                
                // Log detailed skip reason
                if (updateDecision.reason === 'HIGH_GAS') {
                    console.log(`   Gas price: ${updateDecision.gasPrice?.toFixed(4)} gwei, Threshold: ${updateDecision.threshold?.toFixed(4)} gwei`);
                } else if (updateDecision.reason === 'LOW_PRICE_CHANGE') {
                    console.log(`   BTC change: ${updateDecision.btcChange?.toFixed(2)}%, ETH change: ${updateDecision.ethChange?.toFixed(2)}%`);
                    console.log(`   Threshold: ${updateDecision.threshold?.toFixed(2)}%, Volatility: ${updateDecision.volatility}%`);
                }
                
                return false;
            }

            console.log(`\n🔄 [${new Date().toISOString()}] Updating market data...`);
            console.log(`📋 Update reason: ${updateDecision.reason}`);
            
            // Check balance
            const balance = await this.wallet.getBalance();
            const gasPrice = await this.provider.getGasPrice();
            const estimatedGas = 200000;
            const gasCost = gasPrice * BigInt(estimatedGas);
            
            if (balance < gasCost) {
                throw new Error(`❌ Insufficient balance. Need ${ethers.formatEther(gasCost)} ETH, have ${ethers.formatEther(balance)} ETH`);
            }

            // Get current gas price for transaction
            const currentGasPrice = await this.provider.getGasPrice();
            const gasPriceGwei = Number(ethers.formatUnits(currentGasPrice, 'gwei'));
            
            console.log(`⛽ Gas price: ${gasPriceGwei.toFixed(4)} gwei`);

            // Call the contract
            const tx = await this.contract.updateMarketDataFromFeeds({
                gasPrice: currentGasPrice
            });
            console.log(`📝 Transaction sent: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
            console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`💰 Gas cost: ${ethers.formatEther(receipt.gasUsed * currentGasPrice)} ETH`);
            
            // Get updated market data
            const [btcPrice, ethPrice, marketCap, volatility, timestamp] = await this.contract.getMarketData();
            const marketCondition = await this.contract.currentMarketCondition();
            const activeUsers = await this.contract.getActiveUsersCount();
            
            // Update last prices
            this.lastPrices.btc = Number(btcPrice) / 1e8;
            this.lastPrices.eth = Number(ethPrice) / 1e8;
            
            console.log(`📊 Market Data Updated:`);
            console.log(`   BTC Price: $${this.lastPrices.btc.toLocaleString()}`);
            console.log(`   ETH Price: $${this.lastPrices.eth.toLocaleString()}`);
            console.log(`   Market Cap: $${(Number(marketCap) / 1e9).toFixed(2)}B`);
            console.log(`   Volatility: ${volatility}%`);
            console.log(`   Market Condition: ${this.getMarketConditionName(marketCondition)}`);
            console.log(`   Active Users: ${activeUsers}`);
            
            this.lastUpdate = new Date();
            this.updateCount++;
            this.errorCount = 0;
            
            return true;
        } catch (error) {
            this.errorCount++;
            console.error(`❌ Update failed (Error #${this.errorCount}):`, error.message);
            
            if (this.errorCount >= 5) {
                console.error('🛑 Too many consecutive errors. Stopping bot.');
                this.stop();
            }
            
            return false;
        }
    }

    getMarketConditionName(condition) {
        const conditions = ['BULLISH', 'BEARISH', 'NEUTRAL'];
        return conditions[condition] || 'UNKNOWN';
    }

    getAverageGasPrice() {
        if (this.gasPriceHistory.length === 0) return 0;
        const sum = this.gasPriceHistory.reduce((a, b) => a + b, 0);
        return sum / this.gasPriceHistory.length;
    }

    start() {
        if (this.isRunning) {
            console.log('⚠️ Bot is already running!');
            return;
        }

        console.log(`\n🤖 Starting Optimized AI Oracle Bot...`);
        console.log(`⏰ Update schedule: ${UPDATE_INTERVAL}`);
        console.log(`🎯 Target contract: ${AI_ORACLE_ADDRESS}`);
        console.log(`💰 Cost optimization: ENABLED`);
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
                const avgGasPrice = this.getAverageGasPrice();
                const totalPossible = this.updateCount + this.skippedCount;
                const savings = totalPossible > 0 ? (this.skippedCount / totalPossible * 100).toFixed(1) : 0;
                const hoursSinceLastUpdate = this.lastUpdate ? (Date.now() - this.lastUpdate.getTime()) / (1000 * 60 * 60) : 0;
                
                console.log(`\n📈 Bot Status Report:`);
                console.log(`   Updates completed: ${this.updateCount}`);
                console.log(`   Updates skipped: ${this.skippedCount}`);
                console.log(`   Last update: ${this.lastUpdate ? `${hoursSinceLastUpdate.toFixed(1)} hours ago` : 'Never'}`);
                console.log(`   Errors: ${this.errorCount}`);
                console.log(`   Avg gas price: ${avgGasPrice.toFixed(4)} gwei`);
                console.log(`   Current gas price: ${this.gasPriceHistory[this.gasPriceHistory.length - 1]?.toFixed(4) || 'N/A'} gwei`);
                console.log(`   Uptime: ${Math.floor(process.uptime() / 60)} minutes`);
                console.log(`   Cost savings: ${savings}%`);
                
                // Additional optimization metrics
                if (this.gasPriceHistory.length > 10) {
                    const gasPriceStats = this.gasPriceHistory.sort((a, b) => a - b);
                    const minGas = gasPriceStats[0];
                    const maxGas = gasPriceStats[gasPriceStats.length - 1];
                    const medianGas = gasPriceStats[Math.floor(gasPriceStats.length / 2)];
                    
                    console.log(`   Gas price stats: min=${minGas.toFixed(4)}, max=${maxGas.toFixed(4)}, median=${medianGas.toFixed(4)} gwei`);
                }
                
                // Price change statistics
                if (this.lastPrices.btc > 0 && this.lastPrices.eth > 0) {
                    console.log(`   Current prices: BTC=$${this.lastPrices.btc.toLocaleString()}, ETH=$${this.lastPrices.eth.toLocaleString()}`);
                }
            }
        });
    }

    stop() {
        console.log('\n🛑 Stopping Optimized AI Oracle Bot...');
        this.isRunning = false;
        process.exit(0);
    }
}

// Main execution
async function main() {
    const bot = new OptimizedAIOracleBot();
    
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

module.exports = OptimizedAIOracleBot;
