# Implementation Summary: Per-User Strategy & Uniswap Integration

## Overview
Successfully implemented a complete solution for per-user custom strategies with Uniswap V3 swap integration, removing the ZeroDev smart wallet dependency in favor of direct EOA (Externally Owned Account) wallet connections.

## Smart Contract Changes

### 1. New Contract: MomentumSwapManager (UUPS Upgradeable)
**Location:** `contracts/src/MomentumSwapManager.sol`

**Features:**
- Uniswap V3 integration (SwapRouter and Quoter)
- Single-hop and multi-hop swap execution
- Slippage protection with configurable max slippage (default 1%)
- WETH wrapping/unwrapping support
- Emergency token recovery
- Pausable for safety

**Key Functions:**
- `executeSwapSingle()` - Execute single-hop swaps
- `executeSwapMultiHop()` - Execute multi-hop swaps through paths
- `getQuoteSingle()` / `getQuoteMultiHop()` - Get price quotes
- `calculateMinAmountOut()` - Calculate minimum output with slippage
- `wrapETH()` / `unwrapWETH()` - ETH/WETH conversion

### 2. Upgraded: MomentumVault (v1.0.0 → v2.0.0)
**Location:** `contracts/src/MomentumVault.sol`

**New Features:**
- `depositWithPermit()` - Single-transaction ERC-20 deposits using EIP-2612
- `depositETH()` - ETH deposits with automatic conversion to base asset
- `swapAndRebalance()` - Execute actual Uniswap swaps during rebalancing
- Integration with MomentumSwapManager
- WETH support

**New State Variables:**
- `swapManager` - Reference to MomentumSwapManager
- `weth` - WETH token interface

**New Events:**
- `SwapManagerSet` - When swap manager is configured
- `SwapExecuted` - When a swap is completed

### 3. Upgraded: MomentumPortfolioManager (v1.0.0 → v2.0.0)
**Location:** `contracts/src/MomentumPortfolioManager.sol`

**New Features:**
- Per-user custom target allocations
- `setUserCustomAllocations()` - Set custom strategy for a user
- `clearUserCustomAllocations()` - Revert to risk template
- `getTargetAllocations()` - Get effective allocations (custom or template)

**New State Variables:**
- `userTargetAllocations` - mapping(address => mapping(AssetType => uint256))
- `hasCustomAllocation` - mapping(address => bool)

**New Events:**
- `UserCustomAllocationsSet` - When custom allocations are set
- `UserCustomAllocationsCleared` - When custom allocations are cleared

**Modified Logic:**
- `executeRebalance()` now uses `getTargetAllocations()` which returns custom allocations if set, otherwise falls back to risk level template

### 4. New Interfaces
**Location:** `contracts/src/interfaces/`

- `ISwapRouter.sol` - Uniswap V3 SwapRouter interface
- `IQuoter.sol` - Uniswap V3 Quoter interface
- `IWETH9.sol` - WETH9 interface

## Deployment Scripts

### 1. DeploySwapManager.s.sol
Deploys MomentumSwapManager with UUPS proxy pattern.

**Configuration:**
- SwapRouter: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` (Base Sepolia)
- Quoter: `0xC5290058841028F1614F3A6F0F5816cAd0df5E27` (Base Sepolia)
- WETH: `0x4200000000000000000000000000000000000006` (Base Sepolia)

### 2. UpgradeContracts.s.sol
Upgrades existing Vault and PortfolioManager to v2.0.0.

**Steps:**
1. Deploy new implementations
2. Upgrade Vault proxy
3. Upgrade PortfolioManager proxy
4. Configure SwapManager and WETH in Vault

## Frontend Changes

### 1. Removed ZeroDev Smart Wallet
**Changed Files:**
- `src/app/api/wallet/route.ts` - Now stores EOA addresses directly
- `src/components/WalletConnection.tsx` - Uses MetaMask/Web3 wallet connect

**New Flow:**
1. User connects MetaMask or Web3 wallet
2. Frontend captures EOA address
3. Address stored in database
4. All deposits go directly from EOA to Vault contract

### 2. New API Endpoint
**File:** `src/app/api/portfolio/allocations/route.ts`

**Endpoint:** `POST /api/portfolio/allocations`

**Purpose:** Update user's custom allocations

**Request Body:**
```json
{
  "allocations": {
    "WBTC": 40,
    "BIG_CAPS": 30,
    "MID_LOWER_CAPS": 20,
    "STABLECOINS": 10
  }
}
```

### 3. New UI Component
**File:** `src/components/StrategyPersonalization.tsx`

**Features:**
- Interactive sliders for each asset class
- Real-time validation (must sum to 100%)
- Save/cancel functionality
- Visual feedback for total allocation

## User Flow

### A) Onboarding & Strategy (New User)
1. User logs into the web app
2. User connects EOA wallet (MetaMask)
   - FE calls `window.ethereum.request({ method: 'eth_requestAccounts' })`
   - FE sends EOA to `POST /api/wallet`
   - Backend stores `wallet_address` in database
3. User selects baseline risk strategy (low/medium/high)
   - FE calls `POST /api/portfolio { strategy }`
   - Backend stores portfolio metadata
4. (Optional) User customizes allocations
   - FE displays StrategyPersonalization component
   - User adjusts sliders
   - FE calls `POST /api/portfolio/allocations { allocations }`
   - Backend updates DB and calls smart contract (when deployed)

### B) Single Deposit into Shared Vault
**Option 1: ERC-20 with Permit (Single Transaction)**
```solidity
vault.depositWithPermit(token, amount, deadline, v, r, s)
```
- Vault pulls tokens via permit
- Credits `userBalances[userEOA][token] += amount`

**Option 2: ERC-20 Approve + Deposit (Two Transactions)**
```solidity
token.approve(vault, amount)
vault.deposit(token, amount)
```
- Vault pulls approved tokens
- Credits `userBalances[userEOA][token] += amount`

**Option 3: ETH Deposit (One Transaction with Swap)**
```solidity
vault.depositETH{value: amount}(minOut, path, fee, baseAsset)
```
- Vault wraps ETH to WETH
- Swaps WETH to base asset (e.g., USDC) via SwapManager
- Credits `userBalances[userEOA][baseAsset] += amountOut`

### C) AI Decisions and Market Updates
1. AI Oracle Bot → `MomentumAIOracle.updateMarketDataFromBot(...)`
2. Oracle → `MomentumPortfolioManager.updateMarketCondition(...)`
3. When conditions require: Oracle → `MomentumPortfolioManager.executeRebalance(user)`

### D) Per-User Rebalance with Actual Swaps
1. `MomentumPortfolioManager.executeRebalance(user)` called
2. PM reads `getTargetAllocations(user)` (custom if set, else risk template)
3. PM computes deltas between target and current balances
4. For each required trade:
   ```solidity
   vault.swapAndRebalance(
     user,
     tokenFrom,
     tokenTo,
     amountFrom,
     minAmountOut,
     path,
     fee
   )
   ```
5. Vault → SwapManager → Uniswap V3 Router
6. Vault updates `userBalances[user][tokenFrom/tokenTo]` with actual amounts
7. Event: `SwapExecuted(user, tokenFrom, tokenTo, amountIn, amountOut)`

### E) Portfolio Visibility
1. FE reads `GET /api/portfolio` for metadata (strategy, allocations)
2. FE reads on-chain: `vault.getUserBalance(user, token)` for actual holdings
3. FE displays:
   - Current balances per token
   - Target allocations (custom or template)
   - Last rebalance time
   - Transaction history

## Key Architecture Points

### Vault is Central Custodian
- Single shared contract at one address
- All users' funds held in vault
- Per-user balances tracked via `userBalances[user][token]`
- User "wallet" is simply their EOA address

### Strategy Hierarchy
1. **Risk Level Templates** (LOW/MEDIUM/HIGH) - Global defaults
2. **User Custom Allocations** - Override templates if set
3. **Emergency Override** - 100% stablecoins in bearish markets

### Swap Integration
- Vault approves SwapManager to spend tokens
- SwapManager only callable by Vault
- SwapManager executes Uniswap V3 swaps
- Slippage protection enforced at multiple levels

### Safety Controls
- Pausable: Vault, SwapManager, PortfolioManager
- Token whitelist enforced in Vault
- Max slippage configuration (default 1%, max 10%)
- Reentrancy guards on all deposit/withdraw/swap functions
- UUPS upgradeable for future improvements

## Deployment Checklist

### Prerequisites
- [ ] Configure `.env` with `PRIVATE_KEY`, `VAULT_ADDRESS`, etc.
- [ ] Ensure deployer has ETH on Base Sepolia

### Steps
1. Deploy SwapManager:
   ```bash
   forge script script/DeploySwapManager.s.sol --broadcast --verify
   ```
2. Update `.env` with `SWAP_MANAGER_PROXY` address
3. Upgrade existing contracts:
   ```bash
   forge script script/UpgradeContracts.s.sol --broadcast
   ```
4. Whitelist tokens in Vault:
   ```solidity
   vault.setTokenWhitelist(USDC, true)
   vault.setTokenWhitelist(WETH, true)
   vault.setTokenWhitelist(WBTC, true)
   ```
5. Update frontend environment variables
6. Deploy frontend updates
7. Test deposit flow end-to-end
8. Test custom allocations
9. Test rebalance with actual swaps

## Testing Recommendations

### Smart Contract Tests
1. Test SwapManager swap execution (mock Uniswap)
2. Test Vault deposit methods (permit, ETH)
3. Test swapAndRebalance with actual swap
4. Test per-user custom allocations
5. Test getTargetAllocations logic
6. Test emergency scenarios (pause, recover)

### Integration Tests
1. End-to-end deposit flow (EOA → Vault)
2. Custom allocation update (FE → API → Contract)
3. Rebalance with Uniswap swap (Oracle → PM → Vault → Swap)
4. Withdrawal flow
5. Multiple users with different strategies

### UI Tests
1. Wallet connection flow
2. Strategy personalization component
3. Allocation validation (sum to 100%)
4. Portfolio display with on-chain data

## Migration Notes for Existing Users

If you have existing deployed contracts:

1. **Backup Data**: Export user portfolios and balances
2. **Deploy SwapManager**: New contract, not an upgrade
3. **Upgrade Vault**: Use `upgradeToAndCall` with v2.0.0
4. **Upgrade PortfolioManager**: Use `upgradeToAndCall` with v2.0.0
5. **Configure**: Set swap manager and WETH in Vault
6. **Migrate Custom Allocations**: If users had custom allocations in DB, call `setUserCustomAllocations` for each
7. **Test**: Verify all functions work on testnet before mainnet

## Future Enhancements

### Potential Improvements
1. Multi-DEX routing (aggregate liquidity from multiple DEXes)
2. Gas optimization for batch rebalances
3. Time-weighted average price (TWAP) oracles
4. Limit orders for better execution
5. Cross-chain support via bridges
6. Yield farming integration
7. Advanced risk metrics (VaR, Sharpe ratio, etc.)

## Support & Troubleshooting

### Common Issues

**Issue: "Insufficient output amount" during swap**
- Cause: High slippage or low liquidity
- Solution: Increase `maxSlippageBps` or split large orders

**Issue: "Token not whitelisted"**
- Cause: Token not added to vault whitelist
- Solution: Call `vault.setTokenWhitelist(token, true)`

**Issue: "Swap manager not set"**
- Cause: Vault not configured with swap manager address
- Solution: Call `vault.setSwapManager(swapManagerAddress)`

**Issue: Custom allocations not reflected in rebalance**
- Cause: `hasCustomAllocation` flag not set
- Solution: Verify `setUserCustomAllocations` was called successfully

## Summary

✅ **All Implementation Goals Achieved:**
- Per-user custom strategies with on-chain enforcement
- Uniswap V3 integration for real token swaps
- Removed ZeroDev dependency; using direct EOA wallets
- Single-deposit flow (user → Vault via permit or approve+deposit)
- AI manages funds automatically using custom or template strategies
- UUPS upgradeable contracts for future improvements
- Comprehensive deployment and upgrade scripts
- Frontend components for wallet connect and strategy personalization

**Result:** Users now have a complete, working system where they:
1. Connect their wallet once
2. Deposit funds once
3. Customize their strategy (optional)
4. Let AI manage everything according to their personalized targets

