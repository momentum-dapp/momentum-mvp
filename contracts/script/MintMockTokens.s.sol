// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/mocks/MockERC20.sol";

contract MintMockTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get recipient address from env (defaults to deployer if not set)
        address recipient;
        try vm.envAddress("MINT_RECIPIENT") returns (address _recipient) {
            recipient = _recipient;
        } catch {
            recipient = vm.addr(deployerPrivateKey);
            console.log("MINT_RECIPIENT not set, using deployer address");
        }
        
        // Get mint amounts from env (defaults to 10,000 of each token)
        uint256 mintAmount;
        try vm.envUint("MINT_AMOUNT") returns (uint256 _amount) {
            mintAmount = _amount;
        } catch {
            mintAmount = 10000; // Default 10,000 tokens
            console.log("MINT_AMOUNT not set, using default: 10,000");
        }
        
        console.log("Minting tokens to:", recipient);
        console.log("Amount per token:", mintAmount);
        
        // Load mock token addresses from environment
        address mockWETH = vm.envAddress("MOCK_WETH");
        address mockUSDC = vm.envAddress("MOCK_USDC");
        address mockCbETH = vm.envAddress("MOCK_CBETH");
        address mockCbBTC = vm.envAddress("MOCK_CBBTC");
        address mockWBTC = vm.envAddress("MOCK_WBTC");
        address mockDAI = vm.envAddress("MOCK_DAI");
        address mockAERO = vm.envAddress("MOCK_AERO");
        address mockBRETT = vm.envAddress("MOCK_BRETT");
        address mockDEGEN = vm.envAddress("MOCK_DEGEN");
        address mockTOSHI = vm.envAddress("MOCK_TOSHI");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Mint WETH (18 decimals)
        if (mockWETH != address(0)) {
            uint256 amount = mintAmount * 10**18;
            MockERC20(mockWETH).mint(recipient, amount);
            console.log("Minted WETH:", amount, "to", recipient);
        }
        
        // Mint USDC (6 decimals)
        if (mockUSDC != address(0)) {
            uint256 amount = mintAmount * 10**6;
            MockERC20(mockUSDC).mint(recipient, amount);
            console.log("Minted USDC:", amount, "to", recipient);
        }
        
        // Mint cbETH (18 decimals)
        if (mockCbETH != address(0)) {
            uint256 amount = mintAmount * 10**18;
            MockERC20(mockCbETH).mint(recipient, amount);
            console.log("Minted cbETH:", amount, "to", recipient);
        }
        
        // Mint cbBTC (8 decimals)
        if (mockCbBTC != address(0)) {
            uint256 amount = mintAmount * 10**8;
            MockERC20(mockCbBTC).mint(recipient, amount);
            console.log("Minted cbBTC:", amount, "to", recipient);
        }
        
        // Mint WBTC (8 decimals)
        if (mockWBTC != address(0)) {
            uint256 amount = mintAmount * 10**8;
            MockERC20(mockWBTC).mint(recipient, amount);
            console.log("Minted WBTC:", amount, "to", recipient);
        }
        
        // Mint DAI (18 decimals)
        if (mockDAI != address(0)) {
            uint256 amount = mintAmount * 10**18;
            MockERC20(mockDAI).mint(recipient, amount);
            console.log("Minted DAI:", amount, "to", recipient);
        }
        
        // Mint AERO (18 decimals)
        if (mockAERO != address(0)) {
            uint256 amount = mintAmount * 10**18;
            MockERC20(mockAERO).mint(recipient, amount);
            console.log("Minted AERO:", amount, "to", recipient);
        }
        
        // Mint BRETT (18 decimals)
        if (mockBRETT != address(0)) {
            uint256 amount = mintAmount * 10**18;
            MockERC20(mockBRETT).mint(recipient, amount);
            console.log("Minted BRETT:", amount, "to", recipient);
        }
        
        // Mint DEGEN (18 decimals)
        if (mockDEGEN != address(0)) {
            uint256 amount = mintAmount * 10**18;
            MockERC20(mockDEGEN).mint(recipient, amount);
            console.log("Minted DEGEN:", amount, "to", recipient);
        }
        
        // Mint TOSHI (18 decimals)
        if (mockTOSHI != address(0)) {
            uint256 amount = mintAmount * 10**18;
            MockERC20(mockTOSHI).mint(recipient, amount);
            console.log("Minted TOSHI:", amount, "to", recipient);
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== MINTING COMPLETE ===");
        console.log("Recipient:", recipient);
        console.log("Amount per token:", mintAmount, "(in human-readable units)");
        console.log("\nVerify balances:");
        console.log("cast call $MOCK_USDC 'balanceOf(address)(uint256)'", recipient, "--rpc-url base-sepolia");
    }
}

