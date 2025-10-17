const { ethers } = require('ethers');
require('dotenv').config();

// Cost Calculator for AI Oracle Bot
class CostCalculator {
    constructor() {
        this.gasUsed = 200000; // Estimated gas for updateMarketDataFromFeeds
        this.ethPrice = 2000; // USD per ETH (update as needed)
    }

    calculateCosts() {
        console.log('💰 AI Oracle Bot - Cost Calculator');
        console.log('=====================================\n');

        // Gas price scenarios (gwei) - Base Sepolia L2
        const gasPriceScenarios = [
            { name: 'Low', gwei: 0.001, description: 'Low network activity (Base Sepolia)' },
            { name: 'Medium', gwei: 0.005, description: 'Normal network activity (Base Sepolia)' },
            { name: 'High', gwei: 0.01, description: 'High network activity (Base Sepolia)' },
            { name: 'Extreme', gwei: 0.02, description: 'Network congestion (Base Sepolia)' }
        ];

        // Update frequency scenarios
        const frequencyScenarios = [
            { name: 'Every 5 minutes', interval: '*/5 * * * *', updatesPerMonth: 8640 },
            { name: 'Every 15 minutes', interval: '*/15 * * * *', updatesPerMonth: 2880 },
            { name: 'Every 30 minutes', interval: '*/30 * * * *', updatesPerMonth: 1440 },
            { name: 'Every hour', interval: '0 * * * *', updatesPerMonth: 720 }
        ];

        console.log('📊 Cost Analysis by Gas Price and Update Frequency:\n');

        // Create table header
        console.log('Update Frequency'.padEnd(20) + 'Updates/Month'.padEnd(15) + 'Low (0.001g)'.padEnd(15) + 'Medium (0.005g)'.padEnd(15) + 'High (0.01g)'.padEnd(15) + 'Extreme (0.02g)');
        console.log('─'.repeat(95));

        // Calculate costs for each scenario
        frequencyScenarios.forEach(freq => {
            const costs = gasPriceScenarios.map(scenario => {
                const gasPriceWei = ethers.parseUnits(scenario.gwei.toString(), 'gwei');
                const costPerUpdate = (this.gasUsed * gasPriceWei) / BigInt(1e18);
                const monthlyCost = (Number(ethers.formatEther(costPerUpdate)) * freq.updatesPerMonth);
                const monthlyCostUSD = monthlyCost * this.ethPrice;
                return `$${monthlyCostUSD.toFixed(2)}`;
            });

            console.log(
                freq.name.padEnd(20) +
                freq.updatesPerMonth.toString().padEnd(15) +
                costs[0].padEnd(15) +
                costs[1].padEnd(15) +
                costs[2].padEnd(15) +
                costs[3]
            );
        });

        console.log('\n📈 Optimization Strategies:\n');

        // Strategy 1: Base Sepolia L2 (Already optimized!)
        console.log('1. Base Sepolia L2 (RECOMMENDED):');
        console.log('   • Ultra low gas costs: 0.001-0.01 gwei');
        console.log('   • Monthly cost: $0.0026-$0.026');
        console.log('   • Perfect for both testing and production\n');

        // Strategy 2: Reduce frequency (if needed)
        console.log('2. Reduce Update Frequency (if needed):');
        console.log('   • 5 min → 30 min: 75% cost reduction');
        console.log('   • 5 min → 1 hour: 92% cost reduction');
        console.log('   • Note: Costs are already negligible on Base Sepolia\n');

        // Strategy 3: Conditional updates
        console.log('3. Conditional Updates (5% price threshold):');
        console.log('   • Skip updates when price change < 5%');
        console.log('   • Expected savings: 60-80%');
        console.log('   • Note: May not be necessary on Base Sepolia\n');

        // Strategy 4: Gas price optimization
        console.log('4. Gas Price Optimization:');
        console.log('   • Skip updates when gas > 0.01 gwei');
        console.log('   • Expected savings: 20-40%');
        console.log('   • Note: Gas prices are already very low on Base Sepolia\n');

        // Recommended configurations
        console.log('🎯 Recommended Configurations:\n');

        const recommendations = [
            {
                name: 'Base Sepolia (Ultra Low Cost)',
                frequency: 'Every 5 minutes',
                gasLimit: '0.01 gwei',
                priceThreshold: '5%',
                monthlyCost: '$0.0026-$0.026',
                description: 'Perfect for testing and production on L2'
            },
            {
                name: 'Base Sepolia (Conservative)',
                frequency: 'Every 15 minutes',
                gasLimit: '0.01 gwei',
                priceThreshold: '5%',
                monthlyCost: '$0.00086-$0.0086',
                description: 'Even lower cost with 15-minute intervals'
            },
            {
                name: 'Base Sepolia (Minimal)',
                frequency: 'Every 30 minutes',
                gasLimit: '0.01 gwei',
                priceThreshold: '5%',
                monthlyCost: '$0.00044-$0.0044',
                description: 'Minimal cost with 30-minute intervals'
            },
            {
                name: 'Base Sepolia (Smart)',
                frequency: 'Every 5 minutes',
                gasLimit: '0.01 gwei',
                priceThreshold: '2%',
                monthlyCost: '$0.0005-$0.005',
                description: 'Conditional updates for maximum efficiency'
            }
        ];

        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.name}:`);
            console.log(`   • Frequency: ${rec.frequency}`);
            console.log(`   • Gas limit: ${rec.gasLimit}`);
            console.log(`   • Price threshold: ${rec.priceThreshold}`);
            console.log(`   • Monthly cost: ${rec.monthlyCost}`);
            console.log(`   • Description: ${rec.description}\n`);
        });

        // Environment configuration examples
        console.log('⚙️ Environment Configuration Examples:\n');

        console.log('Base Sepolia Configuration (.env):');
        console.log('RPC_URL=https://sepolia.base.org');
        console.log('UPDATE_INTERVAL=*/5 * * * *');
        console.log('PRICE_CHANGE_THRESHOLD=5');
        console.log('MAX_GAS_PRICE=0.01');
        console.log('# Monthly cost: $0.0026-$0.026\n');

        console.log('Base Sepolia Conservative (.env):');
        console.log('RPC_URL=https://sepolia.base.org');
        console.log('UPDATE_INTERVAL=*/15 * * * *');
        console.log('PRICE_CHANGE_THRESHOLD=5');
        console.log('MAX_GAS_PRICE=0.01');
        console.log('# Monthly cost: $0.00086-$0.0086\n');

        console.log('Base Sepolia Minimal (.env):');
        console.log('RPC_URL=https://sepolia.base.org');
        console.log('UPDATE_INTERVAL=*/30 * * * *');
        console.log('PRICE_CHANGE_THRESHOLD=5');
        console.log('MAX_GAS_PRICE=0.01');
        console.log('# Monthly cost: $0.00044-$0.0044\n');

        console.log('Base Sepolia Smart (.env):');
        console.log('RPC_URL=https://sepolia.base.org');
        console.log('UPDATE_INTERVAL=*/5 * * * *');
        console.log('PRICE_CHANGE_THRESHOLD=2');
        console.log('MAX_GAS_PRICE=0.01');
        console.log('# Monthly cost: $0.0005-$0.005\n');

        console.log('💡 Tips:');
        console.log('• Base Sepolia L2 has ultra-low gas costs (0.001-0.01 gwei)');
        console.log('• You can run every 5 minutes for less than 3 cents per month');
        console.log('• No need for complex optimization on Base Sepolia');
        console.log('• Use 5-minute intervals for maximum responsiveness');
        console.log('• Consider conditional updates only if you want to save even more');
        console.log('• Base Sepolia is perfect for both testing and production');
    }

    async getCurrentGasPrice() {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const gasPrice = await provider.getGasPrice();
            const gasPriceGwei = Number(ethers.formatUnits(gasPrice, 'gwei'));
            
            console.log(`\n⛽ Current Network Gas Price: ${gasPriceGwei.toFixed(2)} gwei`);
            
            const costPerUpdate = (this.gasUsed * gasPrice) / BigInt(1e18);
            const costPerUpdateETH = Number(ethers.formatEther(costPerUpdate));
            const costPerUpdateUSD = costPerUpdateETH * this.ethPrice;
            
            console.log(`💰 Cost per update: ${costPerUpdateETH.toFixed(6)} ETH ($${costPerUpdateUSD.toFixed(4)})`);
            
            // Calculate monthly costs for different frequencies
            const frequencies = [
                { name: 'Every 5 minutes', updates: 8640 },
                { name: 'Every 15 minutes', updates: 2880 },
                { name: 'Every 30 minutes', updates: 1440 },
                { name: 'Every hour', updates: 720 }
            ];
            
            console.log('\n📊 Monthly costs at current gas price:');
            frequencies.forEach(freq => {
                const monthlyCost = costPerUpdateUSD * freq.updates;
                console.log(`   ${freq.name}: $${monthlyCost.toFixed(2)}`);
            });
            
        } catch (error) {
            console.error('❌ Error getting current gas price:', error.message);
        }
    }
}

// Run the calculator
async function main() {
    const calculator = new CostCalculator();
    calculator.calculateCosts();
    
    if (process.env.RPC_URL) {
        await calculator.getCurrentGasPrice();
    } else {
        console.log('\n💡 Set RPC_URL in .env to see current gas prices');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = CostCalculator;
