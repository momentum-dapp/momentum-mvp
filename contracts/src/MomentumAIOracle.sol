// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./MomentumPortfolioManager.sol";

/**
 * @title MomentumAIOracle
 * @dev AI Oracle contract for automated portfolio management decisions
 * @author Momentum Team
 */
contract MomentumAIOracle is 
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    // Enums
    enum MarketCondition { BULLISH, BEARISH, NEUTRAL }
    enum RiskLevel { LOW, MEDIUM, HIGH }

    // Structs
    struct MarketData {
        uint256 btcPrice;
        uint256 ethPrice;
        uint256 marketCap;
        uint256 volatility;
        uint256 timestamp;
    }

    struct UserProfile {
        address user;
        RiskLevel riskLevel;
        uint256 lastInteraction;
        bool isActive;
    }

    // Events
    event MarketConditionUpdated(MarketCondition newCondition, uint256 timestamp);
    event PortfolioCreated(address indexed user, RiskLevel riskLevel, uint256 timestamp);
    event PortfolioUpdated(address indexed user, RiskLevel newRiskLevel, uint256 timestamp);
    event RebalanceTriggered(address indexed user, uint256 timestamp);
    event MarketDataUpdated(uint256 btcPrice, uint256 ethPrice, uint256 volatility, uint256 timestamp);

    // State variables
    MomentumPortfolioManager public portfolioManager;
    
    MarketCondition public currentMarketCondition;
    MarketData public latestMarketData;
    
    // AI Oracle Bot integration
    address public aiOracleBot;
    
    // Market analysis parameters
    uint256 public constant VOLATILITY_THRESHOLD = 30; // 30% volatility threshold
    uint256 public constant PRICE_DROP_THRESHOLD = 20; // 20% price drop threshold
    uint256 public constant REBALANCE_COOLDOWN = 1 hours; // Minimum time between rebalances
    uint256 public constant PRICE_UPDATE_INTERVAL = 5 minutes; // Minimum time between price updates
    
    // User management
    mapping(address => UserProfile) public userProfiles;
    address[] public activeUsers;
    mapping(address => bool) public isActiveUser;
    
    // Market data sources
    mapping(string => uint256) public priceFeeds; // token => price
    mapping(string => uint256) public lastPriceUpdate; // token => timestamp
    uint256 public lastAutomatedUpdate;

    // Modifiers
    modifier onlyPortfolioManager() {
        require(msg.sender == address(portfolioManager), "MomentumAIOracle: Not portfolio manager");
        _;
    }

    modifier validRiskLevel(RiskLevel riskLevel) {
        require(uint256(riskLevel) <= 2, "MomentumAIOracle: Invalid risk level");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the AI Oracle contract
     * @param _owner The owner of the contract
     * @param _portfolioManager The portfolio manager contract address
     * @param _aiOracleBot The AI Oracle Bot address (can be zero address initially)
     */
    function initialize(
        address _owner,
        address _portfolioManager,
        address _aiOracleBot
    ) public initializer {
        require(_owner != address(0), "MomentumAIOracle: Invalid owner");
        
        __Ownable_init(_owner);
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        if (_portfolioManager != address(0)) {
            portfolioManager = MomentumPortfolioManager(_portfolioManager);
        }
        aiOracleBot = _aiOracleBot;
        currentMarketCondition = MarketCondition.NEUTRAL;
        
        // Initialize with default market data
        latestMarketData = MarketData({
            btcPrice: 50000 * 1e8, // $50,000 in 8 decimals
            ethPrice: 3000 * 1e8,  // $3,000 in 8 decimals
            marketCap: 1000000000000, // $1T
            volatility: 25, // 25%
            timestamp: block.timestamp
        });
    }

    /**
     * @dev Update market data from AI Oracle Bot (AUTOMATED)
     * This function can be called by the AI Oracle Bot to update prices
     */
    function updateMarketDataFromBot(
        uint256 btcPrice,
        uint256 ethPrice,
        uint256 marketCap,
        uint256 volatility
    ) external whenNotPaused {
        require(
            msg.sender == aiOracleBot || msg.sender == owner(),
            "MomentumAIOracle: Only AI Oracle Bot or owner can update"
        );
        require(
            block.timestamp >= lastAutomatedUpdate + PRICE_UPDATE_INTERVAL,
            "MomentumAIOracle: Price update too frequent"
        );
        require(btcPrice > 0 && ethPrice > 0, "MomentumAIOracle: Invalid price data");

        latestMarketData = MarketData({
            btcPrice: btcPrice,
            ethPrice: ethPrice,
            marketCap: marketCap,
            volatility: volatility,
            timestamp: block.timestamp
        });

        // Update price feeds
        priceFeeds["BTC"] = btcPrice;
        priceFeeds["ETH"] = ethPrice;
        lastPriceUpdate["BTC"] = block.timestamp;
        lastPriceUpdate["ETH"] = block.timestamp;
        lastAutomatedUpdate = block.timestamp;

        emit MarketDataUpdated(btcPrice, ethPrice, volatility, block.timestamp);

        // Analyze market condition and trigger rebalancing if needed
        _analyzeMarketCondition();
    }

    /**
     * @dev Update market data manually (owner only - for testing/emergency)
     * @param btcPrice BTC price in 8 decimals
     * @param ethPrice ETH price in 8 decimals
     * @param marketCap Total market cap
     * @param volatility Market volatility percentage
     */
    function updateMarketData(
        uint256 btcPrice,
        uint256 ethPrice,
        uint256 marketCap,
        uint256 volatility
    ) external onlyOwner whenNotPaused {
        latestMarketData = MarketData({
            btcPrice: btcPrice,
            ethPrice: ethPrice,
            marketCap: marketCap,
            volatility: volatility,
            timestamp: block.timestamp
        });

        // Update price feeds
        priceFeeds["BTC"] = btcPrice;
        priceFeeds["ETH"] = ethPrice;
        lastPriceUpdate["BTC"] = block.timestamp;
        lastPriceUpdate["ETH"] = block.timestamp;

        emit MarketDataUpdated(btcPrice, ethPrice, volatility, block.timestamp);

        // Analyze market condition and trigger rebalancing if needed
        _analyzeMarketCondition();
    }

    /**
     * @dev Analyze market condition based on current data
     */
    function _analyzeMarketCondition() internal {
        MarketCondition newCondition = _determineMarketCondition();
        
        if (newCondition != currentMarketCondition) {
            currentMarketCondition = newCondition;
            emit MarketConditionUpdated(newCondition, block.timestamp);
            
            // Update portfolio manager
            portfolioManager.updateMarketCondition(
                MomentumPortfolioManager.MarketCondition(uint256(newCondition))
            );
        }
    }

    /**
     * @dev Determine market condition based on current data
     * @return MarketCondition The determined market condition
     */
    function _determineMarketCondition() internal view returns (MarketCondition) {
        // Simple market analysis logic
        // In a real implementation, this would be much more sophisticated
        
        // Check for bearish conditions
        if (latestMarketData.volatility > VOLATILITY_THRESHOLD) {
            return MarketCondition.BEARISH;
        }
        
        // Check for price drops (simplified)
        if (latestMarketData.btcPrice < (50000 * 1e8 * (100 - PRICE_DROP_THRESHOLD)) / 100) {
            return MarketCondition.BEARISH;
        }
        
        // Check for bullish conditions
        if (latestMarketData.btcPrice > (50000 * 1e8 * 110) / 100 && 
            latestMarketData.volatility < 20) {
            return MarketCondition.BULLISH;
        }
        
        return MarketCondition.NEUTRAL;
    }

    /**
     * @dev Create a new portfolio for a user
     * @param user The user address
     * @param riskLevel The selected risk level
     */
    function createPortfolio(address user, RiskLevel riskLevel) 
        external 
        onlyOwner 
        whenNotPaused 
        validRiskLevel(riskLevel)
    {
        require(user != address(0), "MomentumAIOracle: Invalid user");
        require(!userProfiles[user].isActive, "MomentumAIOracle: User already has portfolio");

        // Create user profile
        userProfiles[user] = UserProfile({
            user: user,
            riskLevel: riskLevel,
            lastInteraction: block.timestamp,
            isActive: true
        });

        // Add to active users
        if (!isActiveUser[user]) {
            activeUsers.push(user);
            isActiveUser[user] = true;
        }

        // Create portfolio in portfolio manager
        portfolioManager.createPortfolio(
            user, 
            MomentumPortfolioManager.RiskLevel(uint256(riskLevel))
        );

        emit PortfolioCreated(user, riskLevel, block.timestamp);
    }

    /**
     * @dev Update user's portfolio risk level
     * @param user The user address
     * @param newRiskLevel The new risk level
     */
    function updatePortfolio(address user, RiskLevel newRiskLevel) 
        external 
        onlyOwner 
        whenNotPaused 
        validRiskLevel(newRiskLevel)
    {
        require(userProfiles[user].isActive, "MomentumAIOracle: User has no portfolio");

        userProfiles[user].riskLevel = newRiskLevel;
        userProfiles[user].lastInteraction = block.timestamp;

        // Update portfolio in portfolio manager
        portfolioManager.updatePortfolio(
            user, 
            MomentumPortfolioManager.RiskLevel(uint256(newRiskLevel))
        );

        emit PortfolioUpdated(user, newRiskLevel, block.timestamp);
    }

    /**
     * @dev Trigger rebalancing for a specific user
     * @param user The user address
     */
    function triggerRebalance(address user) external onlyOwner whenNotPaused {
        require(userProfiles[user].isActive, "MomentumAIOracle: User has no portfolio");
        require(
            block.timestamp >= userProfiles[user].lastInteraction + REBALANCE_COOLDOWN,
            "MomentumAIOracle: Rebalance cooldown not met"
        );

        userProfiles[user].lastInteraction = block.timestamp;

        // Execute rebalance in portfolio manager
        portfolioManager.executeRebalance(user);

        emit RebalanceTriggered(user, block.timestamp);
    }

    /**
     * @dev Trigger rebalancing for all active users
     */
    function triggerRebalanceAll() external onlyOwner whenNotPaused {
        for (uint256 i = 0; i < activeUsers.length; i++) {
            address user = activeUsers[i];
            if (userProfiles[user].isActive) {
                if (block.timestamp >= userProfiles[user].lastInteraction + REBALANCE_COOLDOWN) {
                    userProfiles[user].lastInteraction = block.timestamp;
                    portfolioManager.executeRebalance(user);
                    emit RebalanceTriggered(user, block.timestamp);
                }
            }
        }
    }

    /**
     * @dev Calculate volatility based on price changes (simplified)
     * @param btcPrice Current BTC price
     * @param ethPrice Current ETH price
     * @return volatility Volatility percentage
     */
    function _calculateVolatility(uint256 btcPrice, uint256 ethPrice) internal view returns (uint256) {
        // Simplified volatility calculation
        // In production, use more sophisticated methods with historical data
        uint256 btcChange = 0;
        uint256 ethChange = 0;
        
        if (latestMarketData.btcPrice > 0) {
            if (btcPrice > latestMarketData.btcPrice) {
                btcChange = ((btcPrice - latestMarketData.btcPrice) * 100) / latestMarketData.btcPrice;
            } else {
                btcChange = ((latestMarketData.btcPrice - btcPrice) * 100) / latestMarketData.btcPrice;
            }
        }
        
        if (latestMarketData.ethPrice > 0) {
            if (ethPrice > latestMarketData.ethPrice) {
                ethChange = ((ethPrice - latestMarketData.ethPrice) * 100) / latestMarketData.ethPrice;
            } else {
                ethChange = ((latestMarketData.ethPrice - ethPrice) * 100) / latestMarketData.ethPrice;
            }
        }
        
        // Return average volatility
        return (btcChange + ethChange) / 2;
    }

    /**
     * @dev Estimate market cap based on BTC and ETH prices (simplified)
     * @param btcPrice Current BTC price
     * @param ethPrice Current ETH price
     * @return marketCap Estimated total market cap
     */
    function _estimateMarketCap(uint256 btcPrice, uint256 ethPrice) internal pure returns (uint256) {
        // Simplified market cap estimation
        // BTC: ~19.7M supply, ETH: ~120M supply
        uint256 btcMarketCap = (btcPrice * 19700000) / 1e8; // Convert from 8 decimals
        uint256 ethMarketCap = (ethPrice * 120000000) / 1e8; // Convert from 8 decimals
        
        // Estimate total crypto market cap (BTC + ETH typically ~60% of total)
        return ((btcMarketCap + ethMarketCap) * 100) / 60;
    }

    /**
     * @dev Set portfolio manager address (only owner)
     * @param _portfolioManager The new portfolio manager address
     */
    function setPortfolioManager(address _portfolioManager) external onlyOwner {
        require(_portfolioManager != address(0), "MomentumAIOracle: Invalid portfolio manager");
        portfolioManager = MomentumPortfolioManager(_portfolioManager);
    }

    /**
     * @dev Set AI Oracle Bot address (only owner)
     * @param _aiOracleBot AI Oracle Bot address
     */
    function setAIOracleBot(address _aiOracleBot) external onlyOwner {
        aiOracleBot = _aiOracleBot;
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
    function getUserProfile(address user) external view returns (
        address userAddress,
        RiskLevel riskLevel,
        uint256 lastInteraction,
        bool isActive
    ) {
        UserProfile storage profile = userProfiles[user];
        return (
            profile.user,
            profile.riskLevel,
            profile.lastInteraction,
            profile.isActive
        );
    }

    function getMarketData() external view returns (
        uint256 btcPrice,
        uint256 ethPrice,
        uint256 marketCap,
        uint256 volatility,
        uint256 timestamp
    ) {
        return (
            latestMarketData.btcPrice,
            latestMarketData.ethPrice,
            latestMarketData.marketCap,
            latestMarketData.volatility,
            latestMarketData.timestamp
        );
    }

    function getActiveUsersCount() external view returns (uint256) {
        return activeUsers.length;
    }

    function getPriceFeed(string memory token) external view returns (uint256) {
        return priceFeeds[token];
    }

    function getAIOracleBot() external view returns (address) {
        return aiOracleBot;
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
