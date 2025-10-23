# Momentum MVP - Technical Architecture

## System Overview

Momentum is an AI-powered crypto portfolio management platform where users deposit funds once and AI automatically manages their assets according to personalized strategies.

## High-Level Architecture

```
┌─────────────────┐
│   User (EOA)    │
│   MetaMask/Web3 │
└────────┬────────┘
         │
         │ Connect Wallet
         ▼
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────┐  ┌──────────────┐
│   API       │  │  Smart       │
│   Routes    │  │  Contracts   │
│  (Next.js)  │  │  (Base)      │
└──────┬──────┘  └──────┬───────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│  Database   │  │  Uniswap V3  │
│  (Supabase) │  │   Router     │
└─────────────┘  └──────────────┘
       │                ▲
       │                │
       ▼                │
┌──────────────────────┴┐
│   AI Oracle Bot       │
│   (Off-chain)         │
└───────────────────────┘
```

## Smart Contract Architecture

### Contract Hierarchy

```
┌──────────────────────────┐
│   MomentumAIOracle       │ ← AI Oracle Bot
│   (UUPS Upgradeable)     │
└────────┬─────────────────┘
         │ triggers
         ▼
┌──────────────────────────┐
│ MomentumPortfolioManager │
│   (UUPS Upgradeable)     │
│   - Per-user strategies  │
│   - Custom allocations   │
└────────┬─────────────────┘
         │ instructs
         ▼
┌──────────────────────────┐
│    MomentumVault         │
│   (UUPS Upgradeable)     │
│   - User balances        │
│   - Deposits/withdrawals │
│   - Swap execution       │
└────────┬─────────────────┘
         │ delegates to
         ▼
┌──────────────────────────┐
│  MomentumSwapManager     │
│   (UUPS Upgradeable)     │
│   - Uniswap integration  │
│   - Slippage protection  │
└────────┬─────────────────┘
         │ calls
         ▼
┌──────────────────────────┐
│    Uniswap V3 Router     │
│    (External DEX)        │
└──────────────────────────┘
```

### Contract Responsibilities

#### MomentumAIOracle
- Receives market data from AI bot
- Analyzes conditions (BULLISH/BEARISH/NEUTRAL)
- Triggers rebalances
- Manages user profiles

#### MomentumPortfolioManager
- Stores risk level strategies (LOW/MEDIUM/HIGH)
- Manages per-user custom allocations
- Computes rebalance deltas
- Instructs vault to execute swaps

#### MomentumVault
- Custodian for all user funds
- Tracks per-user balances: `userBalances[user][token]`
- Handles deposits (standard, permit, ETH)
- Executes withdrawals
- Delegates swaps to SwapManager
- Updates balances with actual swap results

#### MomentumSwapManager
- Interfaces with Uniswap V3
- Executes single-hop and multi-hop swaps
- Provides price quotes
- Enforces slippage protection

## Data Flow

### 1. User Onboarding

```
User → MetaMask Connection
  → EOA Address Captured
    → Stored in Database
      → Strategy Selection (Low/Medium/High)
        → Optional: Custom Allocations
```

### 2. Deposit Flow

```
User → Approve Token (if not using permit)
  → Call vault.deposit() or vault.depositWithPermit()
    → Vault receives tokens
      → Updates userBalances[user][token]
        → Emit Deposit event
```

**For ETH:**
```
User → vault.depositETH{value}(minOut, path, fee, baseAsset)
  → Vault wraps to WETH
    → Vault → SwapManager.executeSwap(WETH → baseAsset)
      → Uniswap swap
        → Vault credits userBalances[user][baseAsset]
```

### 3. AI Market Analysis & Rebalance

```
AI Bot → Fetch market data
  → AIOracle.updateMarketDataFromBot(prices, volatility)
    → Analyze conditions
      → Update market condition
        → Trigger executeRebalance(user)
```

### 4. Rebalance Execution

```
AIOracle → PortfolioManager.executeRebalance(user)
  → Get target allocations (custom or template)
    → Compute current vs target deltas
      → For each required swap:
        PortfolioManager → Vault.swapAndRebalance(user, tokenFrom, tokenTo, amount, minOut, path, fee)
          → Vault → SwapManager.executeSwap(...)
            → SwapManager → Uniswap Router
              → Receive amountOut
                → Vault updates userBalances with actual amounts
                  → Emit SwapExecuted event
```

### 5. Portfolio View

```
Frontend → GET /api/portfolio
  → Returns metadata (strategy, target allocations)
    → Frontend → vault.getUserBalance(user, token) for each token
      → Display current holdings + targets
```

## State Management

### On-Chain State

**MomentumVault:**
```solidity
mapping(address => mapping(address => uint256)) userBalances;  // user => token => amount
mapping(address => bool) whitelistedTokens;
mapping(address => uint256) totalDeposits;  // token => total
address portfolioManager;
MomentumSwapManager swapManager;
IWETH9 weth;
```

**MomentumPortfolioManager:**
```solidity
mapping(address => Portfolio) userPortfolios;  // user => portfolio
mapping(RiskLevel => Strategy) strategies;     // risk level => template
mapping(address => mapping(AssetType => uint256)) userTargetAllocations;  // user => asset => %
mapping(address => bool) hasCustomAllocation;
MarketCondition currentMarketCondition;
```

### Off-Chain State (Database)

**Users Table:**
- `id`, `clerk_id`, `email`, `wallet_address`, `created_at`

**Portfolios Table:**
- `id`, `user_id`, `strategy`, `wbtc_allocation`, `big_caps_allocation`, `mid_lower_caps_allocation`, `stablecoins_allocation`, `total_value`, `last_rebalanced`, `is_active`

**Transactions Table:**
- `id`, `user_id`, `portfolio_id`, `type` (deposit/withdrawal/rebalance/swap), `amount`, `asset`, `tx_hash`, `status`, `created_at`

## Security Model

### Access Control

**Vault:**
- `onlyOwner`: pause, unpause, whitelist tokens, set managers
- `onlyPortfolioManager`: swapAndRebalance
- `anyone` (when not paused): deposit, depositWithPermit, depositETH
- `user` (own funds): withdraw

**PortfolioManager:**
- `onlyOwner`: updateStrategy, setAIOracle, pause, unpause
- `onlyAIOracle`: createPortfolio, updatePortfolio, executeRebalance, updateMarketCondition
- `onlyAIOracle OR onlyOwner`: setUserCustomAllocations, clearUserCustomAllocations

**SwapManager:**
- `onlyOwner`: setVault, setMaxSlippage, pause, unpause, emergencyRecover
- `onlyVault`: executeSwapSingle, executeSwapMultiHop, wrapETH, unwrapWETH

### Safety Mechanisms

1. **Reentrancy Guards**: All deposit/withdraw/swap functions
2. **Pausable**: Emergency pause for all contracts
3. **Token Whitelist**: Only approved tokens accepted
4. **Slippage Protection**: Min output enforced on every swap
5. **UUPS Upgradeable**: Future fixes without data migration
6. **Balance Validation**: Sufficient balance checks before operations

## Integration Points

### Uniswap V3 (Base Sepolia)

- **SwapRouter**: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`
- **Quoter**: `0xC5290058841028F1614F3A6F0F5816cAd0df5E27`
- **WETH**: `0x4200000000000000000000000000000000000006`

### External APIs

- **Clerk**: User authentication
- **Supabase**: Database for metadata
- **Alchemy/Infura**: RPC providers for Base Sepolia
- **CoinGecko/CoinMarketCap**: Market data for AI bot

## Scalability Considerations

### Current Limits

- Max 50 whitelisted tokens in Vault
- Rebalance cooldown: 1 hour per user
- Price update interval: 5 minutes minimum

### Gas Optimization

- Batch rebalances for multiple users
- Use single-hop swaps when possible
- Approve tokens once, reuse approval
- Pack storage variables efficiently

### Future Scaling

- Layer 2 deployment (Optimism, Arbitrum)
- Cross-chain bridges for multi-chain support
- Off-chain computation with on-chain verification
- Aggregated liquidity from multiple DEXes

## Monitoring & Observability

### On-Chain Events

- `Deposit(user, token, amount, timestamp)`
- `Withdrawal(user, token, amount, timestamp)`
- `SwapExecuted(user, tokenFrom, tokenTo, amountIn, amountOut)`
- `RebalanceExecuted(user, timestamp)`
- `UserCustomAllocationsSet(user, wbtc, bigCaps, midLowerCaps, stablecoins)`
- `MarketConditionChanged(newCondition, timestamp)`

### Metrics to Track

- Total value locked (TVL)
- User count and growth
- Average portfolio value
- Rebalance frequency and success rate
- Swap slippage and execution quality
- Gas costs per operation
- AI prediction accuracy

## Development Workflow

### Local Development

1. Clone repository
2. Install dependencies: `npm install` (FE), `forge install` (contracts)
3. Set up `.env` files
4. Run local blockchain: `anvil`
5. Deploy contracts: `forge script script/Deploy.s.sol`
6. Run frontend: `npm run dev`

### Testing

**Smart Contracts:**
```bash
forge test
forge test --match-test testSwapAndRebalance -vvv
```

**Frontend:**
```bash
npm test
npm run test:e2e
```

### Deployment

**Testnet (Base Sepolia):**
```bash
forge script script/DeploySwapManager.s.sol --rpc-url base-sepolia --broadcast --verify
forge script script/UpgradeContracts.s.sol --rpc-url base-sepolia --broadcast
```

**Frontend:**
```bash
npm run build
vercel deploy --prod
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Web3**: viem, wagmi
- **State**: React hooks
- **Auth**: Clerk

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Supabase Client

### Smart Contracts
- **Language**: Solidity 0.8.23
- **Framework**: Foundry (forge, cast, anvil)
- **Libraries**: OpenZeppelin Contracts Upgradeable
- **Patterns**: UUPS Proxy, ReentrancyGuard, Pausable

### Infrastructure
- **Blockchain**: Base Sepolia (testnet), Base (mainnet)
- **RPC**: Alchemy
- **DEX**: Uniswap V3
- **Hosting**: Vercel (FE), Supabase (DB)

## Glossary

- **EOA**: Externally Owned Account (user's wallet address)
- **UUPS**: Universal Upgradeable Proxy Standard
- **TVL**: Total Value Locked
- **Slippage**: Difference between expected and actual swap price
- **Rebalance**: Adjusting portfolio to match target allocations
- **Permit**: EIP-2612 standard for gasless approvals
- **WETH**: Wrapped Ether (ERC-20 version of ETH)

## Support

For issues, questions, or contributions:
- GitHub Issues: [Repository URL]
- Documentation: See `IMPLEMENTATION_SUMMARY.md`
- Deployment Guide: See `COMPLETE_DEPLOYMENT_GUIDE.md`

