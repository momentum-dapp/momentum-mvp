// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MomentumAIOracle.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title UpgradeAIOracle
 * @dev Script to upgrade MomentumAIOracle to v2.0.1 with multiple token price support
 * @author Momentum Team
 */
contract UpgradeAIOracle is Script {
    // Base Sepolia addresses - update these with your deployed addresses
    address constant PROXY_ADDRESS = 0x7e2372c80993FF043cFFA5e5d15bf7EB6A319161;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("====================================");
        console.log("Upgrading MomentumAIOracle to v2.0.1");
        console.log("====================================");
        console.log("");
        
        // Deploy new implementation
        console.log("Step 1: Deploying new implementation...");
        MomentumAIOracle newImplementation = new MomentumAIOracle();
        console.log("New implementation deployed at:", address(newImplementation));
        console.log("");
        
        // Upgrade the proxy
        console.log("Step 2: Upgrading proxy...");
        MomentumAIOracle proxy = MomentumAIOracle(PROXY_ADDRESS);
        proxy.upgradeToAndCall(address(newImplementation), "");
        console.log("Proxy upgraded successfully!");
        console.log("");
        
        // Verify upgrade
        console.log("Step 3: Verifying upgrade...");
        string memory version = proxy.version();
        console.log("Current version:", version);
        
        if (keccak256(bytes(version)) == keccak256(bytes("2.0.1"))) {
            console.log("Upgrade successful!");
        } else {
            console.log("Upgrade verification failed!");
        }
        console.log("");
        
        // Display new capabilities
        console.log("====================================");
        console.log("New Features in v2.0.1:");
        console.log("====================================");
        console.log("- Support for multiple token prices");
        console.log("- updateTokenPrices() - Update multiple tokens");
        console.log("- updateMarketDataAndPrices() - Update everything in one call");
        console.log("- getTokenPrice() - Get price for specific token");
        console.log("- getTokenPrices() - Get prices for multiple tokens");
        console.log("- getSupportedTokens() - List all supported tokens");
        console.log("- getSupportedTokensCount() - Get count of supported tokens");
        console.log("- isTokenPriceSupported() - Check if token is supported");
        console.log("- Graceful handling of PortfolioManager errors (v2.0.1 fix)");
        console.log("");
        
        console.log("====================================");
        console.log("Deployment Summary");
        console.log("====================================");
        console.log("Proxy Address:", PROXY_ADDRESS);
        console.log("New Implementation:", address(newImplementation));
        console.log("Version:", version);
        console.log("");
        
        vm.stopBroadcast();
    }
}

