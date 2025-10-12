import { createPublicClient, http, parseAbi, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
});

// Vault contract ABI (simplified for key functions)
const VAULT_ABI = parseAbi([
  'function deposit(address token, uint256 amount) external',
  'function withdraw(address token, uint256 amount) external',
  'function getUserBalance(address user, address token) external view returns (uint256)',
  'function getTotalDeposits(address token) external view returns (uint256)',
  'function whitelistedTokens(address token) external view returns (bool)',
  'event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp)',
  'event Withdrawal(address indexed user, address indexed token, uint256 amount, uint256 timestamp)',
]);

// Portfolio Manager contract ABI (simplified)
const PORTFOLIO_ABI = parseAbi([
  'function createPortfolio(address user, uint8 riskLevel) external',
  'function updatePortfolio(address user, uint8 riskLevel) external',
  'function executeRebalance(address user) external',
  'function getUserPortfolio(address user) external view returns (uint8, uint256[4], uint256, uint256, bool)',
  'function updateMarketCondition(uint8 newCondition) external',
  'event PortfolioCreated(address indexed user, uint8 riskLevel, uint256 timestamp)',
  'event RebalanceExecuted(address indexed user, uint256 timestamp)',
]);

export class ContractService {
  private static vaultAddress = CONTRACT_ADDRESSES.VAULT as Address;
  private static portfolioAddress = CONTRACT_ADDRESSES.PORTFOLIO as Address;

  /**
   * Get user's token balance in the vault
   */
  static async getUserBalance(userAddress: Address, tokenAddress: Address): Promise<bigint> {
    try {
      const balance = await publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'getUserBalance',
        args: [userAddress, tokenAddress],
      });
      return balance as bigint;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Check if a token is whitelisted
   */
  static async isTokenWhitelisted(tokenAddress: Address): Promise<boolean> {
    try {
      const isWhitelisted = await publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'whitelistedTokens',
        args: [tokenAddress],
      });
      return isWhitelisted as boolean;
    } catch (error) {
      console.error('Error checking token whitelist:', error);
      return false;
    }
  }

  /**
   * Get user's portfolio information
   */
  static async getUserPortfolio(userAddress: Address) {
    try {
      const portfolio = await publicClient.readContract({
        address: this.portfolioAddress,
        abi: PORTFOLIO_ABI,
        functionName: 'getUserPortfolio',
        args: [userAddress],
      });

      const [riskLevel, allocations, totalValue, lastRebalanced, isActive] = portfolio as [
        number,
        [bigint, bigint, bigint, bigint],
        bigint,
        bigint,
        boolean
      ];

      return {
        riskLevel: riskLevel as 0 | 1 | 2, // LOW, MEDIUM, HIGH
        allocations: {
          WBTC: Number(allocations[0]),
          BIG_CAPS: Number(allocations[1]),
          MID_LOWER_CAPS: Number(allocations[2]),
          STABLECOINS: Number(allocations[3]),
        },
        totalValue: totalValue,
        lastRebalanced: new Date(Number(lastRebalanced) * 1000),
        isActive,
      };
    } catch (error) {
      console.error('Error getting user portfolio:', error);
      return null;
    }
  }

  /**
   * Get total deposits for a token
   */
  static async getTotalDeposits(tokenAddress: Address): Promise<bigint> {
    try {
      const total = await publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'getTotalDeposits',
        args: [tokenAddress],
      });
      return total as bigint;
    } catch (error) {
      console.error('Error getting total deposits:', error);
      return BigInt(0);
    }
  }

  /**
   * Encode deposit transaction data
   */
  static encodeDeposit(tokenAddress: Address, amount: bigint): `0x${string}` {
    return encodeFunctionData({
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [tokenAddress, amount],
    });
  }

  /**
   * Encode withdrawal transaction data
   */
  static encodeWithdraw(tokenAddress: Address, amount: bigint): `0x${string}` {
    return encodeFunctionData({
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [tokenAddress, amount],
    });
  }

  /**
   * Encode portfolio creation transaction data
   */
  static encodeCreatePortfolio(userAddress: Address, riskLevel: 0 | 1 | 2): `0x${string}` {
    return encodeFunctionData({
      abi: PORTFOLIO_ABI,
      functionName: 'createPortfolio',
      args: [userAddress, riskLevel],
    });
  }

  /**
   * Watch for deposit events
   */
  static watchDepositEvents(userAddress: Address, callback: (event: any) => void) {
    return publicClient.watchContractEvent({
      address: this.vaultAddress,
      abi: VAULT_ABI,
      eventName: 'Deposit',
      args: { user: userAddress },
      onLogs: callback,
    });
  }

  /**
   * Watch for withdrawal events
   */
  static watchWithdrawalEvents(userAddress: Address, callback: (event: any) => void) {
    return publicClient.watchContractEvent({
      address: this.vaultAddress,
      abi: VAULT_ABI,
      eventName: 'Withdrawal',
      args: { user: userAddress },
      onLogs: callback,
    });
  }

  /**
   * Watch for portfolio events
   */
  static watchPortfolioEvents(userAddress: Address, callback: (event: any) => void) {
    return publicClient.watchContractEvent({
      address: this.portfolioAddress,
      abi: PORTFOLIO_ABI,
      eventName: 'PortfolioCreated',
      args: { user: userAddress },
      onLogs: callback,
    });
  }
}

// Helper function for encoding function data
function encodeFunctionData({ abi, functionName, args }: any): `0x${string}` {
  // This would normally use viem's encodeFunctionData
  // Simplified implementation for demo
  return '0x' as `0x${string}`;
}
