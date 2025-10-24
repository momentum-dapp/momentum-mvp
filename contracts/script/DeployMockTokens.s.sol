// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/mocks/MockERC20.sol";

contract DeployMockTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying mock tokens with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. WETH (Already exists on Base Sepolia: 0x4200000000000000000000000000000000000006)
        // We'll deploy a mock version for consistency
        MockERC20 mockWETH = new MockERC20(
            "Wrapped Ether (Mock)",
            "WETH",
            18,
            1000000 * 10**18  // 1M WETH
        );
        console.log("Mock WETH deployed at:", address(mockWETH));
        
        // 2. USDC (Already exists on Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e)
        // Deploy mock for consistency
        MockERC20 mockUSDC = new MockERC20(
            "USD Coin (Mock)",
            "USDC",
            6,
            10000000 * 10**6  // 10M USDC
        );
        console.log("Mock USDC deployed at:", address(mockUSDC));
        
        // 3. cbETH - Coinbase Wrapped Staked ETH
        MockERC20 mockCbETH = new MockERC20(
            "Coinbase Wrapped Staked ETH (Mock)",
            "cbETH",
            18,
            100000 * 10**18  // 100K cbETH
        );
        console.log("Mock cbETH deployed at:", address(mockCbETH));
        
        // 4. cbBTC - Coinbase Wrapped BTC
        MockERC20 mockCbBTC = new MockERC20(
            "Coinbase Wrapped BTC (Mock)",
            "cbBTC",
            8,
            10000 * 10**8  // 10K cbBTC
        );
        console.log("Mock cbBTC deployed at:", address(mockCbBTC));
        
        // 5. WBTC - Wrapped Bitcoin
        MockERC20 mockWBTC = new MockERC20(
            "Wrapped Bitcoin (Mock)",
            "WBTC",
            8,
            21000 * 10**8  // 21K WBTC (total supply reference)
        );
        console.log("Mock WBTC deployed at:", address(mockWBTC));
        
        // 6. DAI - Dai Stablecoin
        MockERC20 mockDAI = new MockERC20(
            "Dai Stablecoin (Mock)",
            "DAI",
            18,
            10000000 * 10**18  // 10M DAI
        );
        console.log("Mock DAI deployed at:", address(mockDAI));
        
        // 7. AERO - Aerodrome Finance
        MockERC20 mockAERO = new MockERC20(
            "Aerodrome Finance (Mock)",
            "AERO",
            18,
            1000000 * 10**18  // 1M AERO
        );
        console.log("Mock AERO deployed at:", address(mockAERO));
        
        // 8. BRETT - Base meme coin
        MockERC20 mockBRETT = new MockERC20(
            "Brett (Mock)",
            "BRETT",
            18,
            10000000000 * 10**18  // 10B BRETT (meme coin supply)
        );
        console.log("Mock BRETT deployed at:", address(mockBRETT));
        
        // 9. DEGEN - Degen token
        MockERC20 mockDEGEN = new MockERC20(
            "Degen (Mock)",
            "DEGEN",
            18,
            37000000000 * 10**18  // 37B DEGEN
        );
        console.log("Mock DEGEN deployed at:", address(mockDEGEN));
        
        // 10. TOSHI - Base ecosystem token
        MockERC20 mockTOSHI = new MockERC20(
            "Toshi (Mock)",
            "TOSHI",
            18,
            1000000000 * 10**18  // 1B TOSHI
        );
        console.log("Mock TOSHI deployed at:", address(mockTOSHI));
        
        vm.stopBroadcast();
        
        // Print summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Mock WETH:", address(mockWETH));
        console.log("Mock USDC:", address(mockUSDC));
        console.log("Mock cbETH:", address(mockCbETH));
        console.log("Mock cbBTC:", address(mockCbBTC));
        console.log("Mock WBTC:", address(mockWBTC));
        console.log("Mock DAI:", address(mockDAI));
        console.log("Mock AERO:", address(mockAERO));
        console.log("Mock BRETT:", address(mockBRETT));
        console.log("Mock DEGEN:", address(mockDEGEN));
        console.log("Mock TOSHI:", address(mockTOSHI));
        console.log("\n=== Copy these addresses to your .env file ===");
    }
}

