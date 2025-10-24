// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/MomentumAIOracle.sol";
import "../src/MomentumPortfolioManager.sol";
import "../src/MomentumVault.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MomentumAIOracleTest is Test {
    MomentumAIOracle public aiOracle;
    MomentumPortfolioManager public portfolioManager;
    MomentumVault public vault;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    function setUp() public {
        // Deploy contracts
        MomentumVault vaultImpl = new MomentumVault();
        MomentumPortfolioManager portfolioManagerImpl = new MomentumPortfolioManager();
        MomentumAIOracle aiOracleImpl = new MomentumAIOracle();
        
        // Deploy vault proxy
        bytes memory vaultInitData = abi.encodeWithSelector(
            MomentumVault.initialize.selector,
            owner,
            address(0x123) // temporary address
        );
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultInitData);
        vault = MomentumVault(payable(address(vaultProxy)));
        
        // Deploy portfolio manager proxy
        bytes memory portfolioManagerInitData = abi.encodeWithSelector(
            MomentumPortfolioManager.initialize.selector,
            owner,
            address(vault),
            address(0x456) // temporary AI Oracle address
        );
        ERC1967Proxy portfolioManagerProxy = new ERC1967Proxy(address(portfolioManagerImpl), portfolioManagerInitData);
        portfolioManager = MomentumPortfolioManager(address(portfolioManagerProxy));
        
        // Deploy AI Oracle proxy
        bytes memory aiOracleInitData = abi.encodeWithSelector(
            MomentumAIOracle.initialize.selector,
            owner,
            address(portfolioManager),
            address(0) // AI Oracle Bot address
        );
        ERC1967Proxy aiOracleProxy = new ERC1967Proxy(address(aiOracleImpl), aiOracleInitData);
        aiOracle = MomentumAIOracle(address(aiOracleProxy));
        
        // Set correct portfolio manager in vault
        vm.prank(owner);
        vault.setPortfolioManager(address(portfolioManager));
        // Set AI Oracle in portfolio manager
        vm.prank(owner);
        portfolioManager.setAIOracle(address(aiOracle));
    }
    
    function testInitialization() public view {
        assertEq(address(aiOracle.portfolioManager()), address(portfolioManager));
        assertEq(aiOracle.owner(), owner);
        assertTrue(aiOracle.currentMarketCondition() == MomentumAIOracle.MarketCondition.NEUTRAL);
    }
    
    function testUpdateMarketDataFromBot() public {
        uint256 btcPrice = 60000 * 1e8; // $60,000
        uint256 ethPrice = 4000 * 1e8;  // $4,000
        uint256 marketCap = 1200000000000;
        uint256 volatility = 15;
        
        // Wait for price update interval (5 minutes)
        vm.warp(block.timestamp + 5 minutes + 1);
        
        // Call automated update from AI Oracle Bot (simulated by owner)
        vm.prank(owner);
        aiOracle.updateMarketDataFromBot(btcPrice, ethPrice, marketCap, volatility);
        
        (uint256 returnedBtcPrice, uint256 returnedEthPrice, uint256 returnedMarketCap, uint256 returnedVolatility, uint256 timestamp) = aiOracle.getMarketData();
        
        assertEq(returnedBtcPrice, btcPrice);
        assertEq(returnedEthPrice, ethPrice);
        assertEq(returnedMarketCap, marketCap);
        assertEq(returnedVolatility, volatility);
        assertEq(timestamp, block.timestamp);
    }
    
    function testUpdateMarketData() public {
        uint256 btcPrice = 60000 * 1e8;
        uint256 ethPrice = 4000 * 1e8;
        uint256 marketCap = 1200000000000;
        uint256 volatility = 15;
        
        vm.prank(owner);
        aiOracle.updateMarketData(btcPrice, ethPrice, marketCap, volatility);
        
        (uint256 returnedBtcPrice, uint256 returnedEthPrice, uint256 returnedMarketCap, uint256 returnedVolatility, uint256 timestamp) = aiOracle.getMarketData();
        
        assertEq(returnedBtcPrice, btcPrice);
        assertEq(returnedEthPrice, ethPrice);
        assertEq(returnedMarketCap, marketCap);
        assertEq(returnedVolatility, volatility);
        assertEq(timestamp, block.timestamp);
    }
    
    function testCreatePortfolio() public {
        vm.prank(owner);
        aiOracle.createPortfolio(user1, MomentumAIOracle.RiskLevel.MEDIUM);
        
        (address userAddress, MomentumAIOracle.RiskLevel riskLevel, uint256 lastInteraction, bool isActive) = aiOracle.getUserProfile(user1);
        
        assertEq(userAddress, user1);
        assertTrue(riskLevel == MomentumAIOracle.RiskLevel.MEDIUM);
        assertTrue(isActive);
        assertEq(lastInteraction, block.timestamp);
    }
    
    function testUpdatePortfolio() public {
        // First create a portfolio
        vm.prank(owner);
        aiOracle.createPortfolio(user1, MomentumAIOracle.RiskLevel.LOW);
        
        // Then update it
        vm.prank(owner);
        aiOracle.updatePortfolio(user1, MomentumAIOracle.RiskLevel.HIGH);
        
        (, MomentumAIOracle.RiskLevel riskLevel, , bool isActive) = aiOracle.getUserProfile(user1);
        
        assertTrue(riskLevel == MomentumAIOracle.RiskLevel.HIGH);
        assertTrue(isActive);
    }
    
    function testTriggerRebalance() public {
        // Create portfolio
        vm.prank(owner);
        aiOracle.createPortfolio(user1, MomentumAIOracle.RiskLevel.MEDIUM);
        
        // Update market data to trigger bearish condition
        vm.prank(owner);
        aiOracle.updateMarketData(40000 * 1e8, 2000 * 1e8, 800000000000, 35); // High volatility
        
        // Wait for rebalance cooldown (1 hour)
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Trigger rebalance
        vm.prank(owner);
        aiOracle.triggerRebalance(user1);
        
        // Check that rebalance was triggered
        (, , uint256 lastInteraction, ) = aiOracle.getUserProfile(user1);
        assertEq(lastInteraction, block.timestamp);
    }
    
    function testMarketConditionAnalysis() public {
        // Test bearish condition (high volatility)
        vm.prank(owner);
        aiOracle.updateMarketData(50000 * 1e8, 3000 * 1e8, 1000000000000, 35);
        
        assertTrue(aiOracle.currentMarketCondition() == MomentumAIOracle.MarketCondition.BEARISH);
        
        // Test bullish condition
        vm.prank(owner);
        aiOracle.updateMarketData(56000 * 1e8, 3300 * 1e8, 1100000000000, 15);
        
        assertTrue(aiOracle.currentMarketCondition() == MomentumAIOracle.MarketCondition.BULLISH);
        
        // Test neutral condition
        vm.prank(owner);
        aiOracle.updateMarketData(51000 * 1e8, 3000 * 1e8, 1000000000000, 25);
        
        assertTrue(aiOracle.currentMarketCondition() == MomentumAIOracle.MarketCondition.NEUTRAL);
    }
    
    function testRebalanceCooldown() public {
        // Create portfolio
        vm.prank(owner);
        aiOracle.createPortfolio(user1, MomentumAIOracle.RiskLevel.MEDIUM);
        
        // Wait for initial rebalance cooldown
        vm.warp(block.timestamp + 1 hours + 1);
        
        // First rebalance should work
        vm.prank(owner);
        aiOracle.triggerRebalance(user1);
        
        // Second rebalance should fail due to cooldown
        vm.prank(owner);
        vm.expectRevert("MomentumAIOracle: Rebalance cooldown not met");
        aiOracle.triggerRebalance(user1);
        
        // After cooldown period, should work again
        vm.warp(block.timestamp + 1 hours + 1);
        vm.prank(owner);
        aiOracle.triggerRebalance(user1);
    }
    
    function testOnlyOwnerFunctions() public {
        // Test that non-owner cannot call restricted functions
        vm.prank(user1);
        vm.expectRevert();
        aiOracle.updateMarketData(50000 * 1e8, 3000 * 1e8, 1000000000000, 25);
        
        vm.prank(user1);
        vm.expectRevert();
        aiOracle.createPortfolio(user2, MomentumAIOracle.RiskLevel.LOW);
        
        vm.prank(user1);
        vm.expectRevert();
        aiOracle.pause();
    }
    
    function testPauseUnpause() public {
        vm.prank(owner);
        aiOracle.pause();
        
        // Should not be able to call functions when paused
        vm.prank(owner);
        vm.expectRevert();
        aiOracle.updateMarketData(50000 * 1e8, 3000 * 1e8, 1000000000000, 25);
        
        vm.prank(owner);
        aiOracle.unpause();
        
        // Should work again after unpause
        vm.prank(owner);
        aiOracle.updateMarketData(50000 * 1e8, 3000 * 1e8, 1000000000000, 25);
    }
}
