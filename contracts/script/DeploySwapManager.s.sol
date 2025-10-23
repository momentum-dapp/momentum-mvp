// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MomentumSwapManager.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeploySwapManager is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Uniswap V3 addresses on Base Sepolia
        address swapRouter = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4; // Uniswap V3 SwapRouter on Base Sepolia
        address quoter = 0xC5290058841028F1614F3A6F0F5816cAd0df5E27; // Uniswap V3 Quoter on Base Sepolia
        address weth = 0x4200000000000000000000000000000000000006; // WETH on Base Sepolia
        address vault = vm.envAddress("VAULT_ADDRESS"); // Set this in .env
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy implementation
        MomentumSwapManager implementation = new MomentumSwapManager();
        console.log("SwapManager Implementation deployed at:", address(implementation));
        
        // Encode initialize call
        bytes memory initData = abi.encodeWithSelector(
            MomentumSwapManager.initialize.selector,
            deployer,
            swapRouter,
            quoter,
            weth,
            vault
        );
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        console.log("SwapManager Proxy deployed at:", address(proxy));
        
        // Verify deployment
        MomentumSwapManager swapManager = MomentumSwapManager(payable(address(proxy)));
        console.log("Owner:", swapManager.owner());
        console.log("Vault:", swapManager.vault());
        console.log("Max Slippage:", swapManager.maxSlippageBps());
        
        vm.stopBroadcast();
    }
}

