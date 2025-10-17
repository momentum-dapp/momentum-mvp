# Momentum AI Oracle Implementation

## Overview

The `MomentumAIOracle` is a smart contract that serves as the "brain" of the Momentum portfolio management system. It monitors market conditions, analyzes data, and automatically triggers portfolio rebalancing based on predefined strategies.

## Features

### 🤖 **Automated Market Analysis**
- Real-time market condition assessment (Bullish, Bearish, Neutral)
- Volatility-based risk detection
- Price movement analysis
- Market cap monitoring

### 📊 **Portfolio Management**
- User portfolio creation and management
- Risk level assignment (Low, Medium, High)
- Automatic rebalancing triggers
- Cooldown mechanisms to prevent excessive rebalancing

### 🔒 **Security & Access Control**
- Owner-only administrative functions
- Pausable contract for emergency stops
- Upgradeable via UUPS pattern
- Input validation and error handling

## Contract Architecture

```
MomentumAIOracle
├── Market Data Management
│   ├── updateMarketData()
│   ├── getMarketData()
│   └── _analyzeMarketCondition()
├── Portfolio Management
│   ├── createPortfolio()
│   ├── updatePortfolio()
│   └── triggerRebalance()
├── User Management
│   ├── getUserProfile()
│   └── getActiveUsersCount()
└── Administrative
    ├── setPortfolioManager()
    ├── pause()/unpause()
    └── _authorizeUpgrade()
```

## Key Functions

### Market Analysis
```solidity
function updateMarketData(
    uint256 btcPrice,
    uint256 ethPrice,
    uint256 marketCap,
    uint256 volatility
) external onlyOwner
```

### Portfolio Creation
```solidity
function createPortfolio(
    address user, 
    RiskLevel riskLevel
) external onlyOwner
```

### Rebalancing
```solidity
function triggerRebalance(address user) external onlyOwner
function triggerRebalanceAll() external onlyOwner
```

## Market Condition Logic

### Bearish Market Detection
- Volatility > 30%
- BTC price drop > 20%
- Triggers: All portfolios move to 100% stablecoins

### Bullish Market Detection
- BTC price > 10% above baseline
- Volatility < 20%
- Triggers: Portfolios return to original allocations

### Neutral Market
- Default state
- Maintains current allocations

## Configuration Parameters

```solidity
uint256 public constant VOLATILITY_THRESHOLD = 30; // 30% volatility threshold
uint256 public constant PRICE_DROP_THRESHOLD = 20; // 20% price drop threshold
uint256 public constant REBALANCE_COOLDOWN = 1 hours; // Minimum time between rebalances
```

## Deployment

### Prerequisites
1. Deploy `MomentumVault` contract
2. Deploy `MomentumPortfolioManager` contract
3. Set up environment variables

### Deploy Script
```bash
forge script script/DeployAIOracle.s.sol --rpc-url $RPC_URL --broadcast --verify
```

### Manual Deployment
```solidity
// 1. Deploy contracts
MomentumVault vault = new MomentumVault();
MomentumPortfolioManager portfolioManager = new MomentumPortfolioManager();
MomentumAIOracle aiOracle = new MomentumAIOracle();

// 2. Initialize
vault.initialize(owner, address(0), 0);
portfolioManager.initialize(owner, address(vault), address(aiOracle));
aiOracle.initialize(owner, address(portfolioManager));
```

## Testing

### Run Tests
```bash
forge test --match-contract MomentumAIOracleTest -vv
```

### Test Coverage
- ✅ Contract initialization
- ✅ Market data updates
- ✅ Portfolio creation and updates
- ✅ Rebalancing triggers
- ✅ Market condition analysis
- ✅ Access control
- ✅ Pause/unpause functionality
- ✅ Cooldown mechanisms

## Integration with Portfolio Manager

The AI Oracle integrates seamlessly with the `MomentumPortfolioManager`:

1. **Portfolio Creation**: AI Oracle creates portfolios in the Portfolio Manager
2. **Market Updates**: AI Oracle updates market conditions in the Portfolio Manager
3. **Rebalancing**: AI Oracle triggers rebalancing in the Portfolio Manager
4. **User Management**: AI Oracle manages user profiles and risk levels

## Price Feed Integration

### Current Implementation
- Simplified price feed system using `mapping(string => uint256)`
- Manual price updates via `updateMarketData()`
- Support for BTC and ETH price feeds

### Future Enhancements
- AI Oracle Bot integration for automated price updates
- Multiple data source aggregation
- Real-time price updates
- Historical data analysis

## Security Considerations

### Access Control
- Only contract owner can update market data
- Only contract owner can create/update portfolios
- Portfolio Manager can only be changed by owner

### Rebalancing Protection
- 1-hour cooldown between rebalances per user
- Pausable contract for emergency stops
- Input validation on all functions

### Upgrade Safety
- UUPS upgradeable pattern
- Owner-only upgrade authorization
- State preservation during upgrades

## Monitoring & Maintenance

### Key Metrics to Monitor
- Market condition changes
- Rebalancing frequency
- User portfolio distributions
- Price feed accuracy

### Maintenance Tasks
- Regular price feed updates
- Market analysis parameter tuning
- User activity monitoring
- Contract upgrade planning

## Future Enhancements

### Advanced AI Features
- Machine learning integration
- Sentiment analysis
- Technical indicator analysis
- Multi-timeframe analysis

### External Integrations
- AI Oracle Bot for price data
- DeFi protocol integrations
- Cross-chain data feeds
- Real-time market data APIs

### Performance Optimizations
- Gas optimization
- Batch operations
- Event optimization
- Storage efficiency

## Troubleshooting

### Common Issues
1. **Rebalance cooldown**: Wait for cooldown period to expire
2. **Invalid risk level**: Use 0 (LOW), 1 (MEDIUM), or 2 (HIGH)
3. **Paused contract**: Unpause using `unpause()` function
4. **Invalid user**: Ensure user has an active portfolio

### Debug Commands
```bash
# Check market condition
cast call $AI_ORACLE "currentMarketCondition()" --rpc-url $RPC_URL

# Check user profile
cast call $AI_ORACLE "getUserProfile(address)" $USER_ADDRESS --rpc-url $RPC_URL

# Check market data
cast call $AI_ORACLE "getMarketData()" --rpc-url $RPC_URL
```

## Support

For technical support or questions about the AI Oracle implementation, please refer to the main project documentation or contact the development team.
