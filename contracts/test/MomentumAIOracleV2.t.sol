// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/MomentumAIOracle.sol";
import "../src/MomentumPortfolioManager.sol";
import "../src/MomentumVault.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title MomentumAIOracleV2Test
 * @dev Tests for MomentumAIOracle v2.0.0 multiple token price functionality
 */
contract MomentumAIOracleV2Test is Test {
    MomentumAIOracle public oracle;
    MomentumAIOracle public implementation;
    address public owner;
    address public aiBot;
    address public user1;

    function setUp() public {
        owner = address(this);
        aiBot = address(0x1234);
        user1 = address(0x5678);

        // Deploy implementation
        implementation = new MomentumAIOracle();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            MomentumAIOracle.initialize.selector,
            owner,
            address(0), // portfolioManager
            aiBot
        );

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        oracle = MomentumAIOracle(address(proxy));
    }

    function test_Version() public view {
        assertEq(oracle.version(), "2.0.0");
    }

    function test_UpdateTokenPrices() public {
        // Prepare test data
        string[] memory symbols = new string[](3);
        symbols[0] = "WBTC";
        symbols[1] = "USDC";
        symbols[2] = "AERO";

        uint256[] memory prices = new uint256[](3);
        prices[0] = 95000 * 1e8; // $95,000
        prices[1] = 1 * 1e8;     // $1
        prices[2] = 15 * 1e7;    // $1.5

        // Update prices as bot
        vm.prank(aiBot);
        oracle.updateTokenPrices(symbols, prices);

        // Verify prices were stored
        (uint256 wbtcPrice, uint256 wbtcTimestamp) = oracle.getTokenPrice("WBTC");
        assertEq(wbtcPrice, 95000 * 1e8);
        assertEq(wbtcTimestamp, block.timestamp);

        (uint256 usdcPrice, uint256 usdcTimestamp) = oracle.getTokenPrice("USDC");
        assertEq(usdcPrice, 1 * 1e8);
        assertEq(usdcTimestamp, block.timestamp);

        (uint256 aeroPrice, uint256 aeroTimestamp) = oracle.getTokenPrice("AERO");
        assertEq(aeroPrice, 15 * 1e7);
        assertEq(aeroTimestamp, block.timestamp);
    }

    function test_GetTokenPrices() public {
        // Setup
        string[] memory symbols = new string[](2);
        symbols[0] = "WBTC";
        symbols[1] = "USDC";

        uint256[] memory prices = new uint256[](2);
        prices[0] = 95000 * 1e8;
        prices[1] = 1 * 1e8;

        vm.prank(aiBot);
        oracle.updateTokenPrices(symbols, prices);

        // Test batch query
        (uint256[] memory queriedPrices, uint256[] memory timestamps) = oracle.getTokenPrices(symbols);

        assertEq(queriedPrices.length, 2);
        assertEq(timestamps.length, 2);
        assertEq(queriedPrices[0], 95000 * 1e8);
        assertEq(queriedPrices[1], 1 * 1e8);
        assertEq(timestamps[0], block.timestamp);
        assertEq(timestamps[1], block.timestamp);
    }

    function test_GetSupportedTokens() public {
        // Initially empty
        string[] memory tokens = oracle.getSupportedTokens();
        assertEq(tokens.length, 0);
        assertEq(oracle.getSupportedTokensCount(), 0);

        // Add some tokens
        string[] memory symbols = new string[](3);
        symbols[0] = "WBTC";
        symbols[1] = "USDC";
        symbols[2] = "AERO";

        uint256[] memory prices = new uint256[](3);
        prices[0] = 95000 * 1e8;
        prices[1] = 1 * 1e8;
        prices[2] = 15 * 1e7;

        vm.prank(aiBot);
        oracle.updateTokenPrices(symbols, prices);

        // Check supported tokens
        tokens = oracle.getSupportedTokens();
        assertEq(tokens.length, 3);
        assertEq(oracle.getSupportedTokensCount(), 3);
        assertEq(tokens[0], "WBTC");
        assertEq(tokens[1], "USDC");
        assertEq(tokens[2], "AERO");
    }

    function test_IsTokenSupported() public {
        // Initially not supported
        assertFalse(oracle.isTokenPriceSupported("WBTC"));

        // Add token
        string[] memory symbols = new string[](1);
        symbols[0] = "WBTC";

        uint256[] memory prices = new uint256[](1);
        prices[0] = 95000 * 1e8;

        vm.prank(aiBot);
        oracle.updateTokenPrices(symbols, prices);

        // Now supported
        assertTrue(oracle.isTokenPriceSupported("WBTC"));
        assertFalse(oracle.isTokenPriceSupported("UNKNOWN"));
    }

    function test_UpdateMarketDataAndPrices() public {
        // Warp to ensure we're past PRICE_UPDATE_INTERVAL
        vm.warp(block.timestamp + 6 minutes);
        
        // Prepare data
        uint256 btcPrice = 95000 * 1e8;
        uint256 ethPrice = 3500 * 1e8;
        uint256 marketCap = 2500 * 1e9;
        uint256 volatility = 25;

        string[] memory tokenSymbols = new string[](3);
        tokenSymbols[0] = "WBTC";
        tokenSymbols[1] = "USDC";
        tokenSymbols[2] = "AERO";

        uint256[] memory tokenPrices = new uint256[](3);
        tokenPrices[0] = 95000 * 1e8;
        tokenPrices[1] = 1 * 1e8;
        tokenPrices[2] = 15 * 1e7;

        // Update everything
        vm.prank(aiBot);
        oracle.updateMarketDataAndPrices(
            btcPrice,
            ethPrice,
            marketCap,
            volatility,
            tokenSymbols,
            tokenPrices
        );

        // Verify market data
        (
            uint256 storedBtcPrice,
            uint256 storedEthPrice,
            uint256 storedMarketCap,
            uint256 storedVolatility,
            uint256 timestamp
        ) = oracle.getMarketData();

        assertEq(storedBtcPrice, btcPrice);
        assertEq(storedEthPrice, ethPrice);
        assertEq(storedMarketCap, marketCap);
        assertEq(storedVolatility, volatility);
        assertEq(timestamp, block.timestamp);

        // Verify token prices
        (uint256 wbtcPrice, ) = oracle.getTokenPrice("WBTC");
        assertEq(wbtcPrice, 95000 * 1e8);

        (uint256 usdcPrice, ) = oracle.getTokenPrice("USDC");
        assertEq(usdcPrice, 1 * 1e8);

        // Verify supported tokens
        assertEq(oracle.getSupportedTokensCount(), 3);
    }

    function test_OnlyBotOrOwnerCanUpdate() public {
        string[] memory symbols = new string[](1);
        symbols[0] = "WBTC";

        uint256[] memory prices = new uint256[](1);
        prices[0] = 95000 * 1e8;

        // Random user cannot update
        vm.prank(user1);
        vm.expectRevert("MomentumAIOracle: Only AI Oracle Bot or owner can update");
        oracle.updateTokenPrices(symbols, prices);

        // Bot can update
        vm.prank(aiBot);
        oracle.updateTokenPrices(symbols, prices);

        // Owner can update
        vm.prank(owner);
        oracle.updateTokenPrices(symbols, prices);
    }

    function test_RevertOnInvalidPrices() public {
        string[] memory symbols = new string[](1);
        symbols[0] = "WBTC";

        uint256[] memory prices = new uint256[](1);
        prices[0] = 0; // Invalid price

        vm.prank(aiBot);
        vm.expectRevert("MomentumAIOracle: Invalid price");
        oracle.updateTokenPrices(symbols, prices);
    }

    function test_RevertOnArrayLengthMismatch() public {
        string[] memory symbols = new string[](2);
        symbols[0] = "WBTC";
        symbols[1] = "USDC";

        uint256[] memory prices = new uint256[](1);
        prices[0] = 95000 * 1e8;

        vm.prank(aiBot);
        vm.expectRevert("MomentumAIOracle: Arrays length mismatch");
        oracle.updateTokenPrices(symbols, prices);
    }

    function test_RevertOnEmptyArrays() public {
        string[] memory symbols = new string[](0);
        uint256[] memory prices = new uint256[](0);

        vm.prank(aiBot);
        vm.expectRevert("MomentumAIOracle: Empty arrays");
        oracle.updateTokenPrices(symbols, prices);
    }

    function test_RevertOnTooManyTokens() public {
        string[] memory symbols = new string[](51); // More than 50
        uint256[] memory prices = new uint256[](51);

        for (uint256 i = 0; i < 51; i++) {
            symbols[i] = string(abi.encodePacked("TOKEN", vm.toString(i)));
            prices[i] = 1 * 1e8;
        }

        vm.prank(aiBot);
        vm.expectRevert("MomentumAIOracle: Too many tokens");
        oracle.updateTokenPrices(symbols, prices);
    }

    function test_BackwardsCompatibility() public {
        // Warp to ensure we're past PRICE_UPDATE_INTERVAL
        vm.warp(block.timestamp + 6 minutes);
        
        // Old function should still work
        uint256 btcPrice = 95000 * 1e8;
        uint256 ethPrice = 3500 * 1e8;
        uint256 marketCap = 2500 * 1e9;
        uint256 volatility = 25;

        vm.prank(aiBot);
        oracle.updateMarketDataFromBot(btcPrice, ethPrice, marketCap, volatility);

        // Verify data stored
        (
            uint256 storedBtcPrice,
            uint256 storedEthPrice,
            uint256 storedMarketCap,
            uint256 storedVolatility,
            uint256 timestamp
        ) = oracle.getMarketData();

        assertEq(storedBtcPrice, btcPrice);
        assertEq(storedEthPrice, ethPrice);
        assertEq(storedMarketCap, marketCap);
        assertEq(storedVolatility, volatility);
        assertEq(timestamp, block.timestamp);

        // BTC and ETH should be in price feeds
        assertEq(oracle.getPriceFeed("BTC"), btcPrice);
        assertEq(oracle.getPriceFeed("ETH"), ethPrice);
    }

    function test_UpdateRateLimit() public {
        // Warp to ensure we're past initial PRICE_UPDATE_INTERVAL
        vm.warp(block.timestamp + 6 minutes);
        
        uint256 btcPrice = 95000 * 1e8;
        uint256 ethPrice = 3500 * 1e8;
        uint256 marketCap = 2500 * 1e9;
        uint256 volatility = 25;

        string[] memory tokenSymbols = new string[](0);
        uint256[] memory tokenPrices = new uint256[](0);

        // First update should work
        vm.prank(aiBot);
        oracle.updateMarketDataAndPrices(
            btcPrice,
            ethPrice,
            marketCap,
            volatility,
            tokenSymbols,
            tokenPrices
        );

        // Immediate second update should fail
        vm.prank(aiBot);
        vm.expectRevert("MomentumAIOracle: Price update too frequent");
        oracle.updateMarketDataAndPrices(
            btcPrice,
            ethPrice,
            marketCap,
            volatility,
            tokenSymbols,
            tokenPrices
        );

        // After 5 minutes, should work
        vm.warp(block.timestamp + 5 minutes + 1);
        vm.prank(aiBot);
        oracle.updateMarketDataAndPrices(
            btcPrice,
            ethPrice,
            marketCap,
            volatility,
            tokenSymbols,
            tokenPrices
        );
    }
}

