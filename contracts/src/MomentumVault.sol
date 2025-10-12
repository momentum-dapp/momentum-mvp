// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MomentumVault
 * @dev UUPS upgradeable vault contract for secure fund deposits and withdrawals
 * @author Momentum Team
 */
contract MomentumVault is 
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event EmergencyWithdrawal(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event TokenWhitelisted(address indexed token, bool whitelisted);
    event PortfolioManagerSet(address indexed portfolioManager);

    // State variables
    mapping(address => mapping(address => uint256)) public userBalances; // user => token => balance
    mapping(address => bool) public whitelistedTokens;
    mapping(address => uint256) public totalDeposits; // token => total amount
    
    address public portfolioManager;
    uint256 public constant MAX_TOKENS = 50;
    address[] public supportedTokens;

    // Modifiers
    modifier onlyPortfolioManager() {
        require(msg.sender == portfolioManager, "MomentumVault: Not portfolio manager");
        _;
    }

    modifier onlyWhitelistedToken(address token) {
        require(whitelistedTokens[token], "MomentumVault: Token not whitelisted");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the vault contract
     * @param _owner The owner of the contract
     * @param _portfolioManager The portfolio manager address
     */
    function initialize(address _owner, address _portfolioManager) public initializer {
        require(_owner != address(0), "MomentumVault: Invalid owner");
        require(_portfolioManager != address(0), "MomentumVault: Invalid portfolio manager");
        
        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        portfolioManager = _portfolioManager;
        emit PortfolioManagerSet(_portfolioManager);
    }

    /**
     * @dev Deposit tokens into the vault
     * @param token The token address to deposit
     * @param amount The amount to deposit
     */
    function deposit(address token, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyWhitelistedToken(token)
    {
        require(amount > 0, "MomentumVault: Amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        userBalances[msg.sender][token] += amount;
        totalDeposits[token] += amount;
        
        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @dev Withdraw tokens from the vault
     * @param token The token address to withdraw
     * @param amount The amount to withdraw
     */
    function withdraw(address token, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyWhitelistedToken(token)
    {
        require(amount > 0, "MomentumVault: Amount must be greater than 0");
        require(userBalances[msg.sender][token] >= amount, "MomentumVault: Insufficient balance");
        
        userBalances[msg.sender][token] -= amount;
        totalDeposits[token] -= amount;
        
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @dev Emergency withdrawal function (only when paused)
     * @param token The token address to withdraw
     */
    function emergencyWithdraw(address token) external whenPaused nonReentrant {
        uint256 balance = userBalances[msg.sender][token];
        require(balance > 0, "MomentumVault: No balance to withdraw");
        
        userBalances[msg.sender][token] = 0;
        totalDeposits[token] -= balance;
        
        IERC20(token).safeTransfer(msg.sender, balance);
        
        emit EmergencyWithdrawal(msg.sender, token, balance, block.timestamp);
    }

    /**
     * @dev Transfer tokens for rebalancing (only portfolio manager)
     * @param from The user address to transfer from
     * @param tokenFrom The token to transfer from
     * @param tokenTo The token to transfer to
     * @param amountFrom The amount to transfer from
     * @param amountTo The amount to transfer to
     */
    function rebalance(
        address from,
        address tokenFrom,
        address tokenTo,
        uint256 amountFrom,
        uint256 amountTo
    ) external onlyPortfolioManager whenNotPaused {
        require(userBalances[from][tokenFrom] >= amountFrom, "MomentumVault: Insufficient balance");
        require(whitelistedTokens[tokenFrom] && whitelistedTokens[tokenTo], "MomentumVault: Tokens not whitelisted");
        
        // Update balances
        userBalances[from][tokenFrom] -= amountFrom;
        userBalances[from][tokenTo] += amountTo;
        
        // Update total deposits
        totalDeposits[tokenFrom] -= amountFrom;
        totalDeposits[tokenTo] += amountTo;
        
        // The actual token swap should be handled by the portfolio manager
        // This function only updates the internal accounting
    }

    /**
     * @dev Whitelist or remove a token
     * @param token The token address
     * @param whitelisted Whether to whitelist or remove
     */
    function setTokenWhitelist(address token, bool whitelisted) external onlyOwner {
        require(token != address(0), "MomentumVault: Invalid token address");
        
        if (whitelisted && !whitelistedTokens[token]) {
            require(supportedTokens.length < MAX_TOKENS, "MomentumVault: Too many tokens");
            supportedTokens.push(token);
        } else if (!whitelisted && whitelistedTokens[token]) {
            // Remove from supportedTokens array
            for (uint256 i = 0; i < supportedTokens.length; i++) {
                if (supportedTokens[i] == token) {
                    supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                    supportedTokens.pop();
                    break;
                }
            }
        }
        
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }

    /**
     * @dev Set the portfolio manager address
     * @param _portfolioManager The new portfolio manager address
     */
    function setPortfolioManager(address _portfolioManager) external onlyOwner {
        require(_portfolioManager != address(0), "MomentumVault: Invalid portfolio manager");
        portfolioManager = _portfolioManager;
        emit PortfolioManagerSet(_portfolioManager);
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

    /**
     * @dev Get user balance for a specific token
     * @param user The user address
     * @param token The token address
     * @return The user's balance
     */
    function getUserBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }

    /**
     * @dev Get all supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    /**
     * @dev Get total deposits for a token
     * @param token The token address
     * @return The total deposits
     */
    function getTotalDeposits(address token) external view returns (uint256) {
        return totalDeposits[token];
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
