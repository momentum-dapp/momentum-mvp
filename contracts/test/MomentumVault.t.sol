// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {MomentumVault} from "../src/MomentumVault.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MomentumVaultTest is Test {
    MomentumVault public vault;
    ERC20Mock public token;
    
    address public owner = address(0x1);
    address public portfolioManager = address(0x2);
    address public user = address(0x3);
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 public constant DEPOSIT_AMOUNT = 1000 * 10**18;

    function setUp() public {
        // Deploy mock token
        token = new ERC20Mock();
        token.mint(user, INITIAL_SUPPLY);
        
        // Deploy vault implementation
        MomentumVault implementation = new MomentumVault();
        
        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            MomentumVault.initialize.selector,
            owner,
            portfolioManager
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        vault = MomentumVault(address(proxy));
        
        // Whitelist token
        vm.prank(owner);
        vault.setTokenWhitelist(address(token), true);
        
        // Approve vault to spend user tokens
        vm.prank(user);
        token.approve(address(vault), INITIAL_SUPPLY);
    }

    function testInitialization() public {
        assertEq(vault.owner(), owner);
        assertEq(vault.portfolioManager(), portfolioManager);
        assertTrue(vault.whitelistedTokens(address(token)));
    }

    function testDeposit() public {
        vm.prank(user);
        vault.deposit(address(token), DEPOSIT_AMOUNT);
        
        assertEq(vault.getUserBalance(user, address(token)), DEPOSIT_AMOUNT);
        assertEq(vault.getTotalDeposits(address(token)), DEPOSIT_AMOUNT);
        assertEq(token.balanceOf(address(vault)), DEPOSIT_AMOUNT);
    }

    function testWithdraw() public {
        // First deposit
        vm.prank(user);
        vault.deposit(address(token), DEPOSIT_AMOUNT);
        
        // Then withdraw half
        uint256 withdrawAmount = DEPOSIT_AMOUNT / 2;
        vm.prank(user);
        vault.withdraw(address(token), withdrawAmount);
        
        assertEq(vault.getUserBalance(user, address(token)), DEPOSIT_AMOUNT - withdrawAmount);
        assertEq(vault.getTotalDeposits(address(token)), DEPOSIT_AMOUNT - withdrawAmount);
    }

    function test_RevertWhen_DepositNonWhitelistedToken() public {
        ERC20Mock nonWhitelistedToken = new ERC20Mock();
        nonWhitelistedToken.mint(user, INITIAL_SUPPLY);
        
        vm.prank(user);
        nonWhitelistedToken.approve(address(vault), INITIAL_SUPPLY);
        
        vm.expectRevert("MomentumVault: Token not whitelisted");
        vm.prank(user);
        vault.deposit(address(nonWhitelistedToken), DEPOSIT_AMOUNT);
    }

    function test_RevertWhen_WithdrawInsufficientBalance() public {
        vm.expectRevert("MomentumVault: Insufficient balance");
        vm.prank(user);
        vault.withdraw(address(token), DEPOSIT_AMOUNT);
    }

    function testPauseUnpause() public {
        vm.prank(owner);
        vault.pause();
        
        assertTrue(vault.paused());
        
        vm.expectRevert();
        vm.prank(user);
        vault.deposit(address(token), DEPOSIT_AMOUNT);
        
        vm.prank(owner);
        vault.unpause();
        
        assertFalse(vault.paused());
        
        vm.prank(user);
        vault.deposit(address(token), DEPOSIT_AMOUNT);
        
        assertEq(vault.getUserBalance(user, address(token)), DEPOSIT_AMOUNT);
    }

    function testEmergencyWithdraw() public {
        // First deposit
        vm.prank(user);
        vault.deposit(address(token), DEPOSIT_AMOUNT);
        
        // Pause the contract
        vm.prank(owner);
        vault.pause();
        
        // Emergency withdraw
        vm.prank(user);
        vault.emergencyWithdraw(address(token));
        
        assertEq(vault.getUserBalance(user, address(token)), 0);
        assertEq(token.balanceOf(user), INITIAL_SUPPLY);
    }
}
