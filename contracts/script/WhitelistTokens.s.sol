// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MomentumVault.sol";

contract WhitelistTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address vaultProxy = vm.envAddress("VAULT_PROXY");
        
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
        
        console.log("Whitelisting tokens in vault at:", vaultProxy);
        
        MomentumVault vault = MomentumVault(payable(vaultProxy));
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Whitelist all tokens
        console.log("Whitelisting Mock WETH:", mockWETH);
        vault.setTokenWhitelist(mockWETH, true);
        
        console.log("Whitelisting Mock USDC:", mockUSDC);
        vault.setTokenWhitelist(mockUSDC, true);
        
        console.log("Whitelisting Mock cbETH:", mockCbETH);
        vault.setTokenWhitelist(mockCbETH, true);
        
        console.log("Whitelisting Mock cbBTC:", mockCbBTC);
        vault.setTokenWhitelist(mockCbBTC, true);
        
        console.log("Whitelisting Mock WBTC:", mockWBTC);
        vault.setTokenWhitelist(mockWBTC, true);
        
        console.log("Whitelisting Mock DAI:", mockDAI);
        vault.setTokenWhitelist(mockDAI, true);
        
        console.log("Whitelisting Mock AERO:", mockAERO);
        vault.setTokenWhitelist(mockAERO, true);
        
        console.log("Whitelisting Mock BRETT:", mockBRETT);
        vault.setTokenWhitelist(mockBRETT, true);
        
        console.log("Whitelisting Mock DEGEN:", mockDEGEN);
        vault.setTokenWhitelist(mockDEGEN, true);
        
        console.log("Whitelisting Mock TOSHI:", mockTOSHI);
        vault.setTokenWhitelist(mockTOSHI, true);
        
        vm.stopBroadcast();
        
        console.log("\n=== WHITELISTING COMPLETE ===");
        console.log("All 10 mock tokens have been whitelisted in the vault");
        
        // Verify whitelisting
        console.log("\n=== VERIFICATION ===");
        console.log("Mock WETH whitelisted:", vault.whitelistedTokens(mockWETH));
        console.log("Mock USDC whitelisted:", vault.whitelistedTokens(mockUSDC));
        console.log("Mock cbETH whitelisted:", vault.whitelistedTokens(mockCbETH));
        console.log("Mock cbBTC whitelisted:", vault.whitelistedTokens(mockCbBTC));
        console.log("Mock WBTC whitelisted:", vault.whitelistedTokens(mockWBTC));
        console.log("Mock DAI whitelisted:", vault.whitelistedTokens(mockDAI));
        console.log("Mock AERO whitelisted:", vault.whitelistedTokens(mockAERO));
        console.log("Mock BRETT whitelisted:", vault.whitelistedTokens(mockBRETT));
        console.log("Mock DEGEN whitelisted:", vault.whitelistedTokens(mockDEGEN));
        console.log("Mock TOSHI whitelisted:", vault.whitelistedTokens(mockTOSHI));
    }
}

