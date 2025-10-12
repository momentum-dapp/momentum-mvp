// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./MomentumVault.sol";

/**
 * @title MomentumPortfolioManager
 * @dev Portfolio management contract for storing user strategies and managing allocations
 * @author Momentum Team
 */
contract MomentumPortfolioManager is 
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    // Enums
    enum RiskLevel { LOW, MEDIUM, HIGH }
    enum AssetType { WBTC, BIG_CAPS, MID_LOWER_CAPS, STABLECOINS }
    enum MarketCondition { BULLISH, BEARISH, NEUTRAL }

    // Structs
    struct Portfolio {
        RiskLevel riskLevel;
        mapping(AssetType => uint256) allocations; // percentage allocations (0-100)
        uint256 totalValue;
        uint256 lastRebalanced;
        bool isActive;
    }

    struct Strategy {
        mapping(AssetType => uint256) allocations;
        bool isActive;
    }

    // Events
    event PortfolioCreated(address indexed user, RiskLevel riskLevel, uint256 timestamp);
    event PortfolioUpdated(address indexed user, RiskLevel newRiskLevel, uint256 timestamp);
    event StrategyUpdated(RiskLevel riskLevel, uint256 timestamp);
    event RebalanceExecuted(address indexed user, uint256 timestamp);
    event MarketConditionChanged(MarketCondition newCondition, uint256 timestamp);
    event AIRecommendationGenerated(address indexed user, RiskLevel recommendedRisk, uint256 timestamp);

    // State variables
    mapping(address => Portfolio) public userPortfolios;
    mapping(RiskLevel => Strategy) public strategies;
    
    MomentumVault public vault;
    MarketCondition public currentMarketCondition;
    
    address public aiOracle;
    uint256 public constant REBALANCE_THRESHOLD = 5; // 5% deviation threshold
    uint256 public constant MAX_ALLOCATION = 100;
    
    address[] public activeUsers;
    mapping(address => bool) public isActiveUser;

    // Modifiers
    modifier onlyAIOracle() {
        require(msg.sender == aiOracle, "MomentumPortfolioManager: Not AI oracle");
        _;
    }

    modifier hasPortfolio(address user) {
        require(userPortfolios[user].isActive, "MomentumPortfolioManager: No active portfolio");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the portfolio manager contract
     * @param _owner The owner of the contract
     * @param _vault The vault contract address
     * @param _aiOracle The AI oracle address
     */
    function initialize(
        address _owner,
        address _vault,
        address _aiOracle
    ) public initializer {
        require(_owner != address(0), "MomentumPortfolioManager: Invalid owner");
        require(_vault != address(0), "MomentumPortfolioManager: Invalid vault");
        require(_aiOracle != address(0), "MomentumPortfolioManager: Invalid AI oracle");
        
        __Ownable_init(_owner);
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        vault = MomentumVault(_vault);
        aiOracle = _aiOracle;
        currentMarketCondition = MarketCondition.NEUTRAL;
        
        _initializeDefaultStrategies();
    }

    /**
     * @dev Initialize default investment strategies
     */
    function _initializeDefaultStrategies() internal {
        // Low Risk Strategy: WBTC 70%, Big Caps 20%, Stablecoins 10%
        strategies[RiskLevel.LOW].allocations[AssetType.WBTC] = 70;
        strategies[RiskLevel.LOW].allocations[AssetType.BIG_CAPS] = 20;
        strategies[RiskLevel.LOW].allocations[AssetType.MID_LOWER_CAPS] = 0;
        strategies[RiskLevel.LOW].allocations[AssetType.STABLECOINS] = 10;
        strategies[RiskLevel.LOW].isActive = true;

        // Medium Risk Strategy: WBTC 50%, Big Caps 30%, Mid/Lower Caps 15%, Stablecoins 5%
        strategies[RiskLevel.MEDIUM].allocations[AssetType.WBTC] = 50;
        strategies[RiskLevel.MEDIUM].allocations[AssetType.BIG_CAPS] = 30;
        strategies[RiskLevel.MEDIUM].allocations[AssetType.MID_LOWER_CAPS] = 15;
        strategies[RiskLevel.MEDIUM].allocations[AssetType.STABLECOINS] = 5;
        strategies[RiskLevel.MEDIUM].isActive = true;

        // High Risk Strategy: WBTC 30%, Big Caps 25%, Mid/Lower Caps 40%, Stablecoins 5%
        strategies[RiskLevel.HIGH].allocations[AssetType.WBTC] = 30;
        strategies[RiskLevel.HIGH].allocations[AssetType.BIG_CAPS] = 25;
        strategies[RiskLevel.HIGH].allocations[AssetType.MID_LOWER_CAPS] = 40;
        strategies[RiskLevel.HIGH].allocations[AssetType.STABLECOINS] = 5;
        strategies[RiskLevel.HIGH].isActive = true;
    }

    /**
     * @dev Create a new portfolio for a user
     * @param user The user address
     * @param riskLevel The selected risk level
     */
    function createPortfolio(address user, RiskLevel riskLevel) 
        external 
        onlyAIOracle 
        whenNotPaused 
    {
        require(user != address(0), "MomentumPortfolioManager: Invalid user");
        require(!userPortfolios[user].isActive, "MomentumPortfolioManager: Portfolio already exists");
        require(strategies[riskLevel].isActive, "MomentumPortfolioManager: Strategy not active");

        Portfolio storage portfolio = userPortfolios[user];
        portfolio.riskLevel = riskLevel;
        portfolio.isActive = true;
        portfolio.lastRebalanced = block.timestamp;

        // Set initial allocations based on strategy
        Strategy storage strategy = strategies[riskLevel];
        portfolio.allocations[AssetType.WBTC] = strategy.allocations[AssetType.WBTC];
        portfolio.allocations[AssetType.BIG_CAPS] = strategy.allocations[AssetType.BIG_CAPS];
        portfolio.allocations[AssetType.MID_LOWER_CAPS] = strategy.allocations[AssetType.MID_LOWER_CAPS];
        portfolio.allocations[AssetType.STABLECOINS] = strategy.allocations[AssetType.STABLECOINS];

        if (!isActiveUser[user]) {
            activeUsers.push(user);
            isActiveUser[user] = true;
        }

        emit PortfolioCreated(user, riskLevel, block.timestamp);
    }

    /**
     * @dev Update user's portfolio strategy
     * @param user The user address
     * @param newRiskLevel The new risk level
     */
    function updatePortfolio(address user, RiskLevel newRiskLevel) 
        external 
        onlyAIOracle 
        whenNotPaused 
        hasPortfolio(user)
    {
        require(strategies[newRiskLevel].isActive, "MomentumPortfolioManager: Strategy not active");

        Portfolio storage portfolio = userPortfolios[user];
        portfolio.riskLevel = newRiskLevel;

        // Update allocations based on new strategy
        Strategy storage strategy = strategies[newRiskLevel];
        portfolio.allocations[AssetType.WBTC] = strategy.allocations[AssetType.WBTC];
        portfolio.allocations[AssetType.BIG_CAPS] = strategy.allocations[AssetType.BIG_CAPS];
        portfolio.allocations[AssetType.MID_LOWER_CAPS] = strategy.allocations[AssetType.MID_LOWER_CAPS];
        portfolio.allocations[AssetType.STABLECOINS] = strategy.allocations[AssetType.STABLECOINS];

        emit PortfolioUpdated(user, newRiskLevel, block.timestamp);
    }

    /**
     * @dev Execute rebalancing for a user's portfolio
     * @param user The user address
     */
    function executeRebalance(address user) 
        external 
        onlyAIOracle 
        whenNotPaused 
        hasPortfolio(user)
    {
        Portfolio storage portfolio = userPortfolios[user];
        
        // In bearish market, move everything to stablecoins
        if (currentMarketCondition == MarketCondition.BEARISH) {
            portfolio.allocations[AssetType.WBTC] = 0;
            portfolio.allocations[AssetType.BIG_CAPS] = 0;
            portfolio.allocations[AssetType.MID_LOWER_CAPS] = 0;
            portfolio.allocations[AssetType.STABLECOINS] = 100;
        } else {
            // Restore original strategy allocations
            Strategy storage strategy = strategies[portfolio.riskLevel];
            portfolio.allocations[AssetType.WBTC] = strategy.allocations[AssetType.WBTC];
            portfolio.allocations[AssetType.BIG_CAPS] = strategy.allocations[AssetType.BIG_CAPS];
            portfolio.allocations[AssetType.MID_LOWER_CAPS] = strategy.allocations[AssetType.MID_LOWER_CAPS];
            portfolio.allocations[AssetType.STABLECOINS] = strategy.allocations[AssetType.STABLECOINS];
        }

        portfolio.lastRebalanced = block.timestamp;
        emit RebalanceExecuted(user, block.timestamp);
    }

    /**
     * @dev Update market condition (only AI oracle)
     * @param newCondition The new market condition
     */
    function updateMarketCondition(MarketCondition newCondition) 
        external 
        onlyAIOracle 
        whenNotPaused 
    {
        currentMarketCondition = newCondition;
        emit MarketConditionChanged(newCondition, block.timestamp);
        
        // Trigger rebalancing for all active users if market turns bearish
        if (newCondition == MarketCondition.BEARISH) {
            _rebalanceAllPortfolios();
        }
    }

    /**
     * @dev Rebalance all active portfolios (internal)
     */
    function _rebalanceAllPortfolios() internal {
        for (uint256 i = 0; i < activeUsers.length; i++) {
            address user = activeUsers[i];
            if (userPortfolios[user].isActive) {
                Portfolio storage portfolio = userPortfolios[user];
                
                if (currentMarketCondition == MarketCondition.BEARISH) {
                    portfolio.allocations[AssetType.WBTC] = 0;
                    portfolio.allocations[AssetType.BIG_CAPS] = 0;
                    portfolio.allocations[AssetType.MID_LOWER_CAPS] = 0;
                    portfolio.allocations[AssetType.STABLECOINS] = 100;
                }
                
                portfolio.lastRebalanced = block.timestamp;
                emit RebalanceExecuted(user, block.timestamp);
            }
        }
    }

    /**
     * @dev Update strategy allocations (only owner)
     * @param riskLevel The risk level to update
     * @param wbtc WBTC allocation percentage
     * @param bigCaps Big caps allocation percentage
     * @param midLowerCaps Mid/lower caps allocation percentage
     * @param stablecoins Stablecoins allocation percentage
     */
    function updateStrategy(
        RiskLevel riskLevel,
        uint256 wbtc,
        uint256 bigCaps,
        uint256 midLowerCaps,
        uint256 stablecoins
    ) external onlyOwner {
        require(wbtc + bigCaps + midLowerCaps + stablecoins == MAX_ALLOCATION, 
                "MomentumPortfolioManager: Allocations must sum to 100");

        Strategy storage strategy = strategies[riskLevel];
        strategy.allocations[AssetType.WBTC] = wbtc;
        strategy.allocations[AssetType.BIG_CAPS] = bigCaps;
        strategy.allocations[AssetType.MID_LOWER_CAPS] = midLowerCaps;
        strategy.allocations[AssetType.STABLECOINS] = stablecoins;

        emit StrategyUpdated(riskLevel, block.timestamp);
    }

    /**
     * @dev Set AI oracle address (only owner)
     * @param _aiOracle The new AI oracle address
     */
    function setAIOracle(address _aiOracle) external onlyOwner {
        require(_aiOracle != address(0), "MomentumPortfolioManager: Invalid AI oracle");
        aiOracle = _aiOracle;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getUserPortfolio(address user) external view returns (
        RiskLevel riskLevel,
        uint256[4] memory allocations,
        uint256 totalValue,
        uint256 lastRebalanced,
        bool isActive
    ) {
        Portfolio storage portfolio = userPortfolios[user];
        allocations[0] = portfolio.allocations[AssetType.WBTC];
        allocations[1] = portfolio.allocations[AssetType.BIG_CAPS];
        allocations[2] = portfolio.allocations[AssetType.MID_LOWER_CAPS];
        allocations[3] = portfolio.allocations[AssetType.STABLECOINS];
        
        return (
            portfolio.riskLevel,
            allocations,
            portfolio.totalValue,
            portfolio.lastRebalanced,
            portfolio.isActive
        );
    }

    function getStrategy(RiskLevel riskLevel) external view returns (uint256[4] memory allocations) {
        Strategy storage strategy = strategies[riskLevel];
        allocations[0] = strategy.allocations[AssetType.WBTC];
        allocations[1] = strategy.allocations[AssetType.BIG_CAPS];
        allocations[2] = strategy.allocations[AssetType.MID_LOWER_CAPS];
        allocations[3] = strategy.allocations[AssetType.STABLECOINS];
        
        return allocations;
    }

    function getActiveUsersCount() external view returns (uint256) {
        return activeUsers.length;
    }

    /**
     * @dev Authorize upgrade (only owner)
     * @param newImplementation The new implementation address
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Get the current version of the contract
     * @return The version string
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
