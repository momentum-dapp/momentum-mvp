// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/MomentumAIOracle.sol";
import "../src/MomentumPortfolioManager.sol";
import "../src/MomentumVault.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract SimpleAIOracleTest is Test {
    MomentumAIOracle public aiOracle;
    MomentumPortfolioManager public portfolioManager;
    MomentumVault public vault;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    
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
        vault = MomentumVault(address(vaultProxy));
        
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
    
    function testCreatePortfolio() public {
        vm.prank(owner);
        aiOracle.createPortfolio(user1, MomentumAIOracle.RiskLevel.MEDIUM);
        
        (address userAddress, MomentumAIOracle.RiskLevel riskLevel, uint256 lastInteraction, bool isActive) = aiOracle.getUserProfile(user1);
        
        assertEq(userAddress, user1);
        assertTrue(riskLevel == MomentumAIOracle.RiskLevel.MEDIUM);
        assertTrue(isActive);
        assertEq(lastInteraction, block.timestamp);
    }
    
    function testMarketConditionAnalysis() public {
        // Test bearish condition (high volatility)
        uint256 btcPrice = 40000 * 1e8; // Price drop
        uint256 ethPrice = 2000 * 1e8;  // Price drop
        uint256 marketCap = 800000000000;
        uint256 volatility = 35; // High volatility
        
        vm.prank(owner);
        aiOracle.updateMarketDataFromBot(btcPrice, ethPrice, marketCap, volatility);
        
        assertTrue(aiOracle.currentMarketCondition() == MomentumAIOracle.MarketCondition.BEARISH);
    }
}
