// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IQuoter.sol";
import "./interfaces/IWETH9.sol";

/**
 * @title MomentumSwapManager
 * @dev Manages token swaps through Uniswap V3
 * @author Momentum Team
 */
contract MomentumSwapManager is 
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;

    // State variables
    ISwapRouter public swapRouter;
    IQuoter public quoter;
    IWETH9 public weth;
    
    address public vault;
    uint256 public maxSlippageBps; // Max slippage in basis points (e.g., 100 = 1%)
    
    // Uniswap V3 pool fees
    uint24 public constant POOL_FEE_LOW = 500;      // 0.05%
    uint24 public constant POOL_FEE_MEDIUM = 3000;  // 0.3%
    uint24 public constant POOL_FEE_HIGH = 10000;   // 1%

    // Events
    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address recipient
    );
    event VaultUpdated(address indexed oldVault, address indexed newVault);
    event MaxSlippageUpdated(uint256 oldSlippage, uint256 newSlippage);
    event RouterUpdated(address indexed newRouter);

    // Modifiers
    modifier onlyVault() {
        require(msg.sender == vault, "MomentumSwapManager: Only vault can call");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the swap manager
     * @param _owner The owner of the contract
     * @param _swapRouter Uniswap V3 SwapRouter address
     * @param _quoter Uniswap V3 Quoter address
     * @param _weth WETH9 address
     * @param _vault Vault address that can trigger swaps
     */
    function initialize(
        address _owner,
        address _swapRouter,
        address _quoter,
        address _weth,
        address _vault
    ) public initializer {
        require(_owner != address(0), "MomentumSwapManager: Invalid owner");
        require(_swapRouter != address(0), "MomentumSwapManager: Invalid router");
        require(_quoter != address(0), "MomentumSwapManager: Invalid quoter");
        require(_weth != address(0), "MomentumSwapManager: Invalid WETH");
        
        __Ownable_init(_owner);
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        swapRouter = ISwapRouter(_swapRouter);
        quoter = IQuoter(_quoter);
        weth = IWETH9(_weth);
        vault = _vault;
        maxSlippageBps = 100; // Default 1% max slippage
    }

    /**
     * @dev Execute a single-hop swap
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input token
     * @param amountOutMinimum Minimum amount of output token (slippage protection)
     * @param fee Pool fee tier
     * @param recipient Address to receive output tokens
     * @return amountOut Actual amount of output tokens received
     */
    function executeSwapSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint24 fee,
        address recipient
    ) external onlyVault whenNotPaused returns (uint256 amountOut) {
        require(tokenIn != address(0) && tokenOut != address(0), "MomentumSwapManager: Invalid tokens");
        require(amountIn > 0, "MomentumSwapManager: Invalid amount");
        require(recipient != address(0), "MomentumSwapManager: Invalid recipient");

        // Transfer tokens from vault to this contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router to spend tokens
        IERC20(tokenIn).safeIncreaseAllowance(address(swapRouter), amountIn);

        // Execute swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: recipient,
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle(params);

        require(amountOut >= amountOutMinimum, "MomentumSwapManager: Insufficient output amount");

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, recipient);

        return amountOut;
    }

    /**
     * @dev Execute a multi-hop swap
     * @param path Encoded path (token addresses and pool fees)
     * @param amountIn Amount of input token
     * @param amountOutMinimum Minimum amount of output token (slippage protection)
     * @param recipient Address to receive output tokens
     * @return amountOut Actual amount of output tokens received
     */
    function executeSwapMultiHop(
        bytes memory path,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient
    ) external onlyVault whenNotPaused returns (uint256 amountOut) {
        require(path.length > 0, "MomentumSwapManager: Invalid path");
        require(amountIn > 0, "MomentumSwapManager: Invalid amount");
        require(recipient != address(0), "MomentumSwapManager: Invalid recipient");

        // Extract first token from path
        address tokenIn;
        assembly {
            tokenIn := mload(add(path, 32))
        }

        // Transfer tokens from vault to this contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router to spend tokens
        IERC20(tokenIn).safeIncreaseAllowance(address(swapRouter), amountIn);

        // Execute swap
        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: recipient,
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum
        });

        amountOut = swapRouter.exactInput(params);

        require(amountOut >= amountOutMinimum, "MomentumSwapManager: Insufficient output amount");

        address tokenOut;
        assembly {
            let pathLength := mload(path)
            tokenOut := mload(add(add(path, 32), sub(pathLength, 20)))
        }

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, recipient);

        return amountOut;
    }

    /**
     * @dev Get quote for single-hop swap
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param fee Pool fee tier
     * @param amountIn Amount of input token
     * @return amountOut Expected amount of output token
     */
    function getQuoteSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        return quoter.quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, 0);
    }

    /**
     * @dev Get quote for multi-hop swap
     * @param path Encoded path
     * @param amountIn Amount of input token
     * @return amountOut Expected amount of output token
     */
    function getQuoteMultiHop(
        bytes memory path,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        return quoter.quoteExactInput(path, amountIn);
    }

    /**
     * @dev Calculate minimum output with slippage tolerance
     * @param amountOut Expected output amount
     * @param slippageBps Slippage tolerance in basis points
     * @return minAmountOut Minimum acceptable output amount
     */
    function calculateMinAmountOut(
        uint256 amountOut,
        uint256 slippageBps
    ) public pure returns (uint256 minAmountOut) {
        require(slippageBps <= 10000, "MomentumSwapManager: Invalid slippage");
        return (amountOut * (10000 - slippageBps)) / 10000;
    }

    /**
     * @dev Wrap ETH to WETH
     * @param amount Amount of ETH to wrap
     */
    function wrapETH(uint256 amount) external payable onlyVault {
        require(msg.value == amount, "MomentumSwapManager: Incorrect ETH amount");
        weth.deposit{value: amount}();
        IERC20(address(weth)).safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Unwrap WETH to ETH
     * @param amount Amount of WETH to unwrap
     * @param recipient Address to receive ETH
     */
    function unwrapWETH(uint256 amount, address recipient) external onlyVault {
        IERC20(address(weth)).safeTransferFrom(msg.sender, address(this), amount);
        weth.withdraw(amount);
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "MomentumSwapManager: ETH transfer failed");
    }

    /**
     * @dev Set vault address
     * @param _vault New vault address
     */
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "MomentumSwapManager: Invalid vault");
        address oldVault = vault;
        vault = _vault;
        emit VaultUpdated(oldVault, _vault);
    }

    /**
     * @dev Set max slippage
     * @param _maxSlippageBps New max slippage in basis points
     */
    function setMaxSlippage(uint256 _maxSlippageBps) external onlyOwner {
        require(_maxSlippageBps <= 1000, "MomentumSwapManager: Slippage too high"); // Max 10%
        uint256 oldSlippage = maxSlippageBps;
        maxSlippageBps = _maxSlippageBps;
        emit MaxSlippageUpdated(oldSlippage, _maxSlippageBps);
    }

    /**
     * @dev Update swap router address
     * @param _swapRouter New router address
     */
    function setSwapRouter(address _swapRouter) external onlyOwner {
        require(_swapRouter != address(0), "MomentumSwapManager: Invalid router");
        swapRouter = ISwapRouter(_swapRouter);
        emit RouterUpdated(_swapRouter);
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
     * @dev Emergency token recovery
     * @param token Token address
     * @param amount Amount to recover
     */
    function emergencyRecoverToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Emergency ETH recovery
     */
    function emergencyRecoverETH() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "MomentumSwapManager: ETH transfer failed");
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

    // Allow contract to receive ETH
    receive() external payable {}
}

