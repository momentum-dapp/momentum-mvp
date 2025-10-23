// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MomentumVault.sol";
import "../src/MomentumPortfolioManager.sol";

contract UpgradeContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        address vaultProxy = vm.envAddress("VAULT_PROXY");
        address portfolioManagerProxy = vm.envAddress("PORTFOLIO_MANAGER_PROXY");
        address swapManagerProxy = vm.envAddress("SWAP_MANAGER_PROXY");
        address weth = 0x4200000000000000000000000000000000000006; // WETH on Base Sepolia
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new Vault implementation
        MomentumVault newVaultImpl = new MomentumVault();
        console.log("New Vault Implementation deployed at:", address(newVaultImpl));
        
        // Deploy new Portfolio Manager implementation
        MomentumPortfolioManager newPMImpl = new MomentumPortfolioManager();
        console.log("New Portfolio Manager Implementation deployed at:", address(newPMImpl));
        
        // Upgrade Vault
        MomentumVault vault = MomentumVault(payable(vaultProxy));
        vault.upgradeToAndCall(address(newVaultImpl), "");
        console.log("Vault upgraded to version:", vault.version());
        
        // Set Swap Manager and WETH in Vault
        vault.setSwapManager(payable(swapManagerProxy));
        vault.setWETH(weth);
        console.log("Vault: Swap Manager and WETH set");
        
        // Upgrade Portfolio Manager
        MomentumPortfolioManager pm = MomentumPortfolioManager(portfolioManagerProxy);
        pm.upgradeToAndCall(address(newPMImpl), "");
        console.log("Portfolio Manager upgraded to version:", pm.version());
        
        vm.stopBroadcast();
    }
}

