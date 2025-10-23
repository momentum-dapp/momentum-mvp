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
    "function updateMarketDataAndPrices(uint256 btcPrice, uint256 ethPrice, uint256 marketCap, uint256 volatility, string[] tokenSymbols, uint256[] tokenPrices) external",
    "function currentMarketCondition() external view returns (uint8)",
    "function getMarketData() external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function getActiveUsersCount() external view returns (uint256)",
    "function getTokenPrice(string symbol) external view returns (uint256, uint256)",
    "function getSupportedTokens() external view returns (string[])"
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
            const { btcPrice, ethPrice, marketCap, volatility, allPrices } = marketData;
            
            // Prepare token symbols and prices for the contract
            const tokenSymbols = [];
            const tokenPrices = [];
            
            // Add all tokens except BTC and ETH (they're in main params)
            for (const [symbol, price] of Object.entries(allPrices)) {
                if (symbol !== 'BTC' && symbol !== 'ETH') {
                    tokenSymbols.push(symbol);
                    // Convert to 8 decimals for contract (multiply by 1e8)
                    tokenPrices.push(Math.round(price * 1e8));
                }
            }
            
            // Call the contract with all data in one transaction
            const tx = await this.contract.updateMarketDataAndPrices(
                btcPrice,
                ethPrice,
                marketCap,
                volatility,
                tokenSymbols,
                tokenPrices
            );
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
            console.log(`   Additional Tokens: ${tokenSymbols.length} tokens`);
            tokenSymbols.forEach((symbol, index) => {
                console.log(`   - ${symbol}: $${(Number(tokenPrices[index]) / 1e8).toLocaleString()}`);
            });
            
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
            
            // Save token prices to file for frontend consumption
            await this.saveTokenPrices();
            
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
            
            // Token mapping: Mock token symbol -> CoinGecko ID
            const tokenMapping = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
                'WBTC': 'wrapped-bitcoin',
                'cbBTC': 'coinbase-wrapped-btc',
                'cbETH': 'coinbase-wrapped-staked-eth',
                'DAI': 'dai',
                'USDC': 'usd-coin',
                'AERO': 'aerodrome-finance',
                'BRETT': 'brett',
                'DEGEN': 'degen-base',
                'TOSHI': 'toshi'
            };
            
            // Fetch all token prices in one request
            const tokenIds = Object.values(tokenMapping).join(',');
            const response = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
            );
            
            const prices = {};
            const marketCaps = {};
            const changes24h = {};
            
            // Process all token data
            for (const [symbol, coinId] of Object.entries(tokenMapping)) {
                if (response.data[coinId]) {
                    const data = response.data[coinId];
                    prices[symbol] = data.usd;
                    marketCaps[symbol] = data.usd_market_cap || 0;
                    changes24h[symbol] = Math.abs(data.usd_24h_change || 0);
                }
            }
            
            // Get BTC and ETH data for contract
            const btcData = response.data[tokenMapping.BTC];
            const ethData = response.data[tokenMapping.ETH];
            
            // Convert to 8 decimal format (multiply by 1e8)
            const btcPrice = Math.round(btcData.usd * 1e8);
            const ethPrice = Math.round(ethData.usd * 1e8);
            
            // Calculate total market cap
            const btcMarketCap = Math.round(btcData.usd_market_cap / 1e9);
            const ethMarketCap = Math.round(ethData.usd_market_cap / 1e9);
            const totalMarketCap = (btcMarketCap + ethMarketCap) * 1e9;
            
            // Calculate average volatility from 24h price changes
            const allChanges = Object.values(changes24h).filter(v => v > 0);
            const avgVolatility = allChanges.length > 0 
                ? Math.round(allChanges.reduce((a, b) => a + b, 0) / allChanges.length)
                : 25;
            
            console.log(`✅ Fetched real market data for ${Object.keys(prices).length} tokens:`);
            console.log(`   BTC: $${btcData.usd.toLocaleString()} (Market Cap: $${btcMarketCap}B)`);
            console.log(`   ETH: $${ethData.usd.toLocaleString()} (Market Cap: $${ethMarketCap}B)`);
            console.log(`   WBTC: $${prices.WBTC?.toLocaleString() || 'N/A'}`);
            console.log(`   cbBTC: $${prices.cbBTC?.toLocaleString() || 'N/A'}`);
            console.log(`   cbETH: $${prices.cbETH?.toLocaleString() || 'N/A'}`);
            console.log(`   USDC: $${prices.USDC?.toFixed(4) || 'N/A'}`);
            console.log(`   DAI: $${prices.DAI?.toFixed(4) || 'N/A'}`);
            console.log(`   AERO: $${prices.AERO?.toFixed(4) || 'N/A'}`);
            console.log(`   BRETT: $${prices.BRETT?.toFixed(6) || 'N/A'}`);
            console.log(`   DEGEN: $${prices.DEGEN?.toFixed(6) || 'N/A'}`);
            console.log(`   TOSHI: $${prices.TOSHI?.toFixed(8) || 'N/A'}`);
            console.log(`   Total Market Cap: $${(totalMarketCap / 1e9).toFixed(2)}B`);
            console.log(`   Average Volatility: ${avgVolatility}%`);
            
            // Store token prices for later use (optional - can be saved to file/DB)
            this.tokenPrices = prices;
            this.lastPriceUpdate = new Date();
            
            return {
                btcPrice,
                ethPrice,
                marketCap: totalMarketCap,
                volatility: avgVolatility,
                allPrices: prices // Include all token prices
            };
        } catch (error) {
            console.error('❌ Failed to fetch real market data:', error.message);
            console.log('📊 Falling back to static data...');
            
            // Fallback to static data if API fails
            return {
                btcPrice: 50000 * 1e8, // $50,000 in 8 decimals
                ethPrice: 3000 * 1e8,  // $3,000 in 8 decimals
                marketCap: 1000000000000, // $1T
                volatility: 25, // 25%
                allPrices: {
                    BTC: 50000,
                    ETH: 3000,
                    WBTC: 50000,
                    cbBTC: 50000,
                    cbETH: 3000,
                    USDC: 1.0,
                    DAI: 1.0,
                    AERO: 1.5,
                    BRETT: 0.15,
                    DEGEN: 0.01,
                    TOSHI: 0.0001
                }
            };
        }
    }

    async saveTokenPrices() {
        // Optional: Save token prices to a file or database for frontend consumption
        if (!this.tokenPrices) return;
        
        try {
            const fs = require('fs');
            const priceData = {
                timestamp: this.lastPriceUpdate,
                prices: this.tokenPrices,
                updateCount: this.updateCount
            };
            
            // Save to JSON file
            fs.writeFileSync(
                './token-prices.json',
                JSON.stringify(priceData, null, 2)
            );
            console.log('💾 Token prices saved to token-prices.json');
        } catch (error) {
            console.error('⚠️ Failed to save token prices:', error.message);
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
