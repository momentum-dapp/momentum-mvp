// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "./MomentumSwapManager.sol";
import "./interfaces/IWETH9.sol";

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
    event SwapManagerSet(address indexed swapManager);
    event SwapExecuted(address indexed user, address indexed tokenFrom, address indexed tokenTo, uint256 amountIn, uint256 amountOut);

    // State variables
    mapping(address => mapping(address => uint256)) public userBalances; // user => token => balance
    mapping(address => bool) public whitelistedTokens;
    mapping(address => uint256) public totalDeposits; // token => total amount
    
    address public portfolioManager;
    MomentumSwapManager public swapManager;
    IWETH9 public weth;
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
     * @dev Deposit tokens with permit (EIP-2612) - single transaction
     * @param token The token address to deposit
     * @param amount The amount to deposit
     * @param deadline Permit deadline
     * @param v Permit signature v
     * @param r Permit signature r
     * @param s Permit signature s
     */
    function depositWithPermit(
        address token,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused nonReentrant onlyWhitelistedToken(token) {
        require(amount > 0, "MomentumVault: Amount must be greater than 0");
        
        // Execute permit
        IERC20Permit(token).permit(msg.sender, address(this), amount, deadline, v, r, s);
        
        // Transfer tokens
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        userBalances[msg.sender][token] += amount;
        totalDeposits[token] += amount;
        
        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @dev Deposit ETH and convert to base asset (e.g., USDC) in one transaction
     * @param minAmountOut Minimum amount of output token (slippage protection)
     * @param path Swap path from WETH to base asset
     * @param fee Uniswap pool fee
     * @param baseAsset The base asset to receive (e.g., USDC)
     */
    function depositETH(
        uint256 minAmountOut,
        bytes memory path,
        uint24 fee,
        address baseAsset
    ) external payable whenNotPaused nonReentrant onlyWhitelistedToken(baseAsset) {
        require(msg.value > 0, "MomentumVault: Must send ETH");
        require(address(swapManager) != address(0), "MomentumVault: Swap manager not set");
        
        // Wrap ETH to WETH
        weth.deposit{value: msg.value}();
        
        // Approve swap manager to spend WETH
        IERC20(address(weth)).safeIncreaseAllowance(address(swapManager), msg.value);
        
        // Execute swap through swap manager
        uint256 amountOut;
        if (path.length > 0) {
            // Multi-hop swap
            amountOut = swapManager.executeSwapMultiHop(
                path,
                msg.value,
                minAmountOut,
                address(this)
            );
        } else {
            // Single-hop swap
            amountOut = swapManager.executeSwapSingle(
                address(weth),
                baseAsset,
                msg.value,
                minAmountOut,
                fee,
                address(this)
            );
        }
        
        // Credit user balance
        userBalances[msg.sender][baseAsset] += amountOut;
        totalDeposits[baseAsset] += amountOut;
        
        emit Deposit(msg.sender, baseAsset, amountOut, block.timestamp);
    }

    /**
     * @dev Execute swap and rebalance for a user (only portfolio manager)
     * @param user The user address
     * @param tokenFrom The token to swap from
     * @param tokenTo The token to swap to
     * @param amountFrom The amount to swap
     * @param minAmountOut Minimum amount out (slippage protection)
     * @param path Swap path (empty for single-hop)
     * @param fee Uniswap pool fee
     */
    function swapAndRebalance(
        address user,
        address tokenFrom,
        address tokenTo,
        uint256 amountFrom,
        uint256 minAmountOut,
        bytes memory path,
        uint24 fee
    ) external onlyPortfolioManager whenNotPaused nonReentrant returns (uint256 amountOut) {
        require(userBalances[user][tokenFrom] >= amountFrom, "MomentumVault: Insufficient balance");
        require(whitelistedTokens[tokenFrom] && whitelistedTokens[tokenTo], "MomentumVault: Tokens not whitelisted");
        require(address(swapManager) != address(0), "MomentumVault: Swap manager not set");
        require(amountFrom > 0, "MomentumVault: Amount must be greater than 0");
        
        // Approve swap manager to spend tokens
        IERC20(tokenFrom).safeIncreaseAllowance(address(swapManager), amountFrom);
        
        // Execute swap through swap manager
        if (path.length > 0) {
            // Multi-hop swap
            amountOut = swapManager.executeSwapMultiHop(
                path,
                amountFrom,
                minAmountOut,
                address(this)
            );
        } else {
            // Single-hop swap
            amountOut = swapManager.executeSwapSingle(
                tokenFrom,
                tokenTo,
                amountFrom,
                minAmountOut,
                fee,
                address(this)
            );
        }
        
        // Update user balances with actual amounts
        userBalances[user][tokenFrom] -= amountFrom;
        userBalances[user][tokenTo] += amountOut;
        
        // Update total deposits
        totalDeposits[tokenFrom] -= amountFrom;
        totalDeposits[tokenTo] += amountOut;
        
        emit SwapExecuted(user, tokenFrom, tokenTo, amountFrom, amountOut);
        
        return amountOut;
    }

    /**
     * @dev Transfer tokens for rebalancing (only portfolio manager)
     * DEPRECATED: Use swapAndRebalance instead for actual swaps
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
     * @dev Set the swap manager address
     * @param _swapManager The new swap manager address
     */
    function setSwapManager(address payable _swapManager) external onlyOwner {
        require(_swapManager != address(0), "MomentumVault: Invalid swap manager");
        swapManager = MomentumSwapManager(_swapManager);
        emit SwapManagerSet(_swapManager);
    }

    /**
     * @dev Set the WETH address
     * @param _weth The WETH address
     */
    function setWETH(address _weth) external onlyOwner {
        require(_weth != address(0), "MomentumVault: Invalid WETH");
        weth = IWETH9(_weth);
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
        return "2.0.0";
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
