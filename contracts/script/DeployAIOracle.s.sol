// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MomentumAIOracle.sol";
import "../src/MomentumPortfolioManager.sol";
import "../src/MomentumVault.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployAIOracleScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        // AI Oracle Bot address (set to zero address initially)
        address aiOracleBot = address(0);
        console.log("AI Oracle Bot will be set later via setAIOracleBot()");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Vault implementation
        MomentumVault vaultImplementation = new MomentumVault();
        console.log("MomentumVault implementation deployed at:", address(vaultImplementation));
        
        // Deploy Portfolio Manager implementation
        MomentumPortfolioManager portfolioManagerImplementation = new MomentumPortfolioManager();
        console.log("MomentumPortfolioManager implementation deployed at:", address(portfolioManagerImplementation));
        
        // Deploy AI Oracle implementation
        MomentumAIOracle aiOracleImplementation = new MomentumAIOracle();
        console.log("MomentumAIOracle implementation deployed at:", address(aiOracleImplementation));
        
        // Deploy Vault proxy with temporary portfolio manager
        bytes memory vaultInitData = abi.encodeWithSelector(
            MomentumVault.initialize.selector,
            deployer,
            address(0x1234567890123456789012345678901234567890) // temporary address
        );
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImplementation), vaultInitData);
        MomentumVault vault = MomentumVault(payable(address(vaultProxy)));
        console.log("MomentumVault proxy deployed at:", address(vault));
        
        // Deploy AI Oracle proxy first (needed for Portfolio Manager)
        bytes memory aiOracleInitData = abi.encodeWithSelector(
            MomentumAIOracle.initialize.selector,
            deployer,
            address(0), // temporary portfolio manager address
            aiOracleBot
        );
        ERC1967Proxy aiOracleProxy = new ERC1967Proxy(address(aiOracleImplementation), aiOracleInitData);
        MomentumAIOracle aiOracle = MomentumAIOracle(address(aiOracleProxy));
        console.log("MomentumAIOracle proxy deployed at:", address(aiOracle));
        
        // Deploy Portfolio Manager proxy with AI Oracle
        bytes memory portfolioManagerInitData = abi.encodeWithSelector(
            MomentumPortfolioManager.initialize.selector,
            deployer,
            address(vault),
            address(aiOracle)
        );
        ERC1967Proxy portfolioManagerProxy = new ERC1967Proxy(address(portfolioManagerImplementation), portfolioManagerInitData);
        MomentumPortfolioManager portfolioManager = MomentumPortfolioManager(address(portfolioManagerProxy));
        console.log("MomentumPortfolioManager proxy deployed at:", address(portfolioManager));
        
        // Update vault with correct portfolio manager
        vault.setPortfolioManager(address(portfolioManager));
        console.log("Vault portfolio manager updated");
        
        // Update AI Oracle with correct portfolio manager
        aiOracle.setPortfolioManager(address(portfolioManager));
        console.log("AI Oracle portfolio manager updated");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("Vault:", address(vault));
        console.log("Portfolio Manager:", address(portfolioManager));
        console.log("AI Oracle:", address(aiOracle));
        console.log("AI Oracle Bot:", aiOracleBot);
        console.log("Owner:", deployer);
        
        console.log("\n=== AI Oracle Bot Setup ===");
        console.log("1. Deploy your AI Oracle Bot Node.js application");
        console.log("2. Set the AI Oracle Bot address:");
        console.log("   cast send", address(aiOracle), "setAIOracleBot(address) <AI_ORACLE_BOT_ADDRESS> --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY");
        console.log("3. Test price updates from AI Oracle Bot:");
        console.log("   cast send", address(aiOracle), "updateMarketDataFromBot(uint256,uint256,uint256,uint256) 5000000000000 300000000000 1000000000000 25 --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY");
        console.log("4. Monitor contract events for price updates");
        
        console.log("\n=== Next Steps ===");
        console.log("1. Deploy and configure AI Oracle Bot");
        console.log("2. Set AI Oracle Bot address in contract");
        console.log("3. Test automated price updates");
        console.log("4. Deploy to mainnet and verify contracts");
    }
}
