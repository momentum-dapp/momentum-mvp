const { ethers } = require('ethers');
require('dotenv').config();

// Test script for conditional updates
class ConditionalUpdateTester {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.lastPrices = { btc: 50000, eth: 3000 };
        this.gasPriceHistory = [];
        this.updateCount = 0;
        this.skippedCount = 0;
    }

    async initialize() {
        try {
            console.log('🧪 Initializing Conditional Update Tester...');
            
            if (!process.env.RPC_URL || !process.env.AI_ORACLE_ADDRESS) {
                throw new Error('Missing RPC_URL or AI_ORACLE_ADDRESS in environment');
            }

            this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            this.contract = new ethers.Contract(process.env.AI_ORACLE_ADDRESS, [
                'function getMarketData() external view returns (uint256, uint256, uint256, uint256, uint256)',
                'function currentMarketCondition() external view returns (uint8)'
            ], this.provider);

            console.log('✅ Tester initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    // Simulate different scenarios
    async testScenario(scenarioName, mockData) {
        console.log(`\n🧪 Testing Scenario: ${scenarioName}`);
        console.log('='.repeat(50));

        const {
            gasPriceGwei = 0.005,
            btcPrice = 50000,
            ethPrice = 3000,
            volatility = 25,
            hoursSinceLastUpdate = 0.5
        } = mockData;

        // Simulate gas price history
        this.gasPriceHistory.push(gasPriceGwei);
        if (this.gasPriceHistory.length > 100) {
            this.gasPriceHistory.shift();
        }

        // Calculate price changes
        const btcChange = Math.abs(btcPrice - this.lastPrices.btc) / this.lastPrices.btc * 100;
        const ethChange = Math.abs(ethPrice - this.lastPrices.eth) / this.lastPrices.eth * 100;
        const maxChange = Math.max(btcChange, ethChange);

        // Simulate conditional logic
        const PRICE_CHANGE_THRESHOLD = 5;
        const MAX_GAS_PRICE = 0.01;
        const dynamicPriceThreshold = Math.max(PRICE_CHANGE_THRESHOLD, volatility / 10);

        console.log(`📊 Input Data:`);
        console.log(`   Gas Price: ${gasPriceGwei} gwei`);
        console.log(`   BTC Price: $${btcPrice.toLocaleString()} (${btcChange.toFixed(2)}% change)`);
        console.log(`   ETH Price: $${ethPrice.toLocaleString()} (${ethChange.toFixed(2)}% change)`);
        console.log(`   Volatility: ${volatility}%`);
        console.log(`   Hours since last update: ${hoursSinceLastUpdate}`);

        console.log(`\n🔍 Conditional Logic Analysis:`);
        
        // Gas price check
        const gasPriceOk = gasPriceGwei <= MAX_GAS_PRICE;
        console.log(`   Gas price check: ${gasPriceOk ? '✅ PASS' : '❌ FAIL'} (${gasPriceGwei} <= ${MAX_GAS_PRICE})`);

        // Price change check
        const priceChangeOk = maxChange > dynamicPriceThreshold;
        console.log(`   Price change check: ${priceChangeOk ? '✅ PASS' : '❌ FAIL'} (${maxChange.toFixed(2)}% > ${dynamicPriceThreshold.toFixed(2)}%)`);

        // Force update check
        const forceUpdate = hoursSinceLastUpdate > 2;
        console.log(`   Force update check: ${forceUpdate ? '✅ PASS' : '❌ FAIL'} (${hoursSinceLastUpdate}h > 2h)`);

        // Final decision
        const shouldUpdate = gasPriceOk && (priceChangeOk || forceUpdate);
        console.log(`\n🎯 Decision: ${shouldUpdate ? '✅ UPDATE' : '⏭️ SKIP'}`);

        if (shouldUpdate) {
            this.updateCount++;
            console.log(`   Reason: ${priceChangeOk ? 'Price change threshold exceeded' : 'Force update required'}`);
        } else {
            this.skippedCount++;
            console.log(`   Reason: ${!gasPriceOk ? 'Gas price too high' : 'Price change below threshold'}`);
        }

        // Update last prices for next test
        this.lastPrices.btc = btcPrice;
        this.lastPrices.eth = ethPrice;

        return shouldUpdate;
    }

    async runAllTests() {
        console.log('🚀 Running Conditional Update Tests');
        console.log('=====================================\n');

        const scenarios = [
            {
                name: 'Normal Update (Price Change)',
                data: { gasPriceGwei: 0.005, btcPrice: 52500, ethPrice: 3150, volatility: 25, hoursSinceLastUpdate: 0.5 }
            },
            {
                name: 'Skip - Low Price Change',
                data: { gasPriceGwei: 0.005, btcPrice: 50100, ethPrice: 3005, volatility: 25, hoursSinceLastUpdate: 0.5 }
            },
            {
                name: 'Skip - High Gas Price',
                data: { gasPriceGwei: 0.015, btcPrice: 52500, ethPrice: 3150, volatility: 25, hoursSinceLastUpdate: 0.5 }
            },
            {
                name: 'Force Update - Long Time',
                data: { gasPriceGwei: 0.005, btcPrice: 50100, ethPrice: 3005, volatility: 25, hoursSinceLastUpdate: 3.0 }
            },
            {
                name: 'High Volatility Market',
                data: { gasPriceGwei: 0.005, btcPrice: 52000, ethPrice: 3100, volatility: 60, hoursSinceLastUpdate: 0.5 }
            },
            {
                name: 'Low Volatility Market',
                data: { gasPriceGwei: 0.005, btcPrice: 50100, ethPrice: 3005, volatility: 10, hoursSinceLastUpdate: 0.5 }
            },
            {
                name: 'Emergency Update (High Price Change)',
                data: { gasPriceGwei: 0.008, btcPrice: 60000, ethPrice: 3600, volatility: 80, hoursSinceLastUpdate: 0.5 }
            }
        ];

        for (const scenario of scenarios) {
            await this.testScenario(scenario.name, scenario.data);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

        console.log(`\n📊 Test Summary:`);
        console.log(`   Updates: ${this.updateCount}`);
        console.log(`   Skips: ${this.skippedCount}`);
        console.log(`   Total: ${this.updateCount + this.skippedCount}`);
        console.log(`   Update Rate: ${((this.updateCount / (this.updateCount + this.skippedCount)) * 100).toFixed(1)}%`);
    }

    async testWithRealData() {
        console.log('\n🔗 Testing with Real Contract Data');
        console.log('=====================================');

        try {
            const [btcPrice, ethPrice, marketCap, volatility, timestamp] = await this.contract.getMarketData();
            const marketCondition = await this.contract.currentMarketCondition();
            
            const realData = {
                gasPriceGwei: 0.005, // Simulated
                btcPrice: Number(btcPrice) / 1e8,
                ethPrice: Number(ethPrice) / 1e8,
                volatility: Number(volatility),
                hoursSinceLastUpdate: 0.5
            };

            await this.testScenario('Real Contract Data', realData);
            
        } catch (error) {
            console.error('❌ Error testing with real data:', error.message);
        }
    }
}

// Run the tests
async function main() {
    const tester = new ConditionalUpdateTester();
    
    const initialized = await tester.initialize();
    if (!initialized) {
        console.error('❌ Failed to initialize tester');
        process.exit(1);
    }

    await tester.runAllTests();
    await tester.testWithRealData();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ConditionalUpdateTester;
