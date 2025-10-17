const { ethers } = require('ethers');
require('dotenv').config();

async function testSetup() {
    console.log('🧪 Testing AI Oracle Bot Setup...\n');

    // Check environment variables
    console.log('1. Checking environment variables...');
    const requiredVars = ['RPC_URL', 'PRIVATE_KEY', 'AI_ORACLE_ADDRESS'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.log('❌ Missing environment variables:', missingVars.join(', '));
        console.log('💡 Please copy env.example to .env and fill in your values');
        return;
    }
    console.log('✅ All environment variables present');

    // Test RPC connection
    console.log('\n2. Testing RPC connection...');
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const network = await provider.getNetwork();
        console.log(`✅ Connected to ${network.name} (Chain ID: ${network.chainId})`);
    } catch (error) {
        console.log('❌ RPC connection failed:', error.message);
        return;
    }

    // Test wallet
    console.log('\n3. Testing wallet...');
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const balance = await wallet.getBalance();
        console.log(`✅ Wallet address: ${wallet.address}`);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance === 0n) {
            console.log('⚠️  Warning: Wallet has no ETH. Add some for gas fees.');
        }
    } catch (error) {
        console.log('❌ Wallet test failed:', error.message);
        return;
    }

    // Test contract connection
    console.log('\n4. Testing contract connection...');
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.AI_ORACLE_ADDRESS, [
            'function currentMarketCondition() external view returns (uint8)',
            'function getMarketData() external view returns (uint256, uint256, uint256, uint256, uint256)',
            'function getActiveUsersCount() external view returns (uint256)'
        ], wallet);

        const marketCondition = await contract.currentMarketCondition();
        const [btcPrice, ethPrice, marketCap, volatility, timestamp] = await contract.getMarketData();
        const activeUsers = await contract.getActiveUsersCount();

        console.log('✅ Contract connection successful');
        console.log(`📊 Market condition: ${marketCondition}`);
        console.log(`📈 BTC Price: $${(Number(btcPrice) / 1e8).toLocaleString()}`);
        console.log(`📈 ETH Price: $${(Number(ethPrice) / 1e8).toLocaleString()}`);
        console.log(`👥 Active users: ${activeUsers}`);
    } catch (error) {
        console.log('❌ Contract connection failed:', error.message);
        console.log('💡 Make sure your contract is deployed and the address is correct');
        return;
    }

    console.log('\n🎉 All tests passed! Your bot is ready to deploy.');
    console.log('\nNext steps:');
    console.log('1. Run locally: npm start');
    console.log('2. Deploy to Vercel: npm run deploy');
    console.log('3. Set up monitoring');
}

testSetup().catch(console.error);
