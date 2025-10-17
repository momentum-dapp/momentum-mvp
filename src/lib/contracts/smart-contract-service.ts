import { createPublicClient, createWalletClient, http, parseEther, formatEther, type Address } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, ASSETS, STRATEGIES } from './addresses';

// Use Base Sepolia for development, Base for production
const chain = process.env.NODE_ENV === 'production' ? base : baseSepolia;
const rpcUrl = process.env.NODE_ENV === 'production' 
  ? `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  : `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

// Mock contract ABIs - in production these would be the actual contract ABIs
const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'asset', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'asset', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'rebalance',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'strategy', type: 'uint8' },
      { name: 'allocations', type: 'uint256[]' }
    ],
    outputs: []
  },
  {
    name: 'emergencyRebalanceToStablecoin',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'getPortfolioValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getUserAllocations',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  }
] as const;

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export class SmartContractService {
  private static getWalletClient(privateKey: string) {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });
  }

  /**
   * Execute a strategy on the smart contract
   */
  static async executeStrategy(
    userWalletAddress: Address,
    strategy: 'low' | 'medium' | 'high',
    privateKey: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // In a real implementation, this would be the actual contract address
      const vaultAddress = CONTRACT_ADDRESSES.VAULT as Address || '0x1234567890123456789012345678901234567890' as Address;
      
      if (!vaultAddress) {
        throw new Error('Vault contract address not configured');
      }

      const walletClient = this.getWalletClient(privateKey);
      const strategyConfig = STRATEGIES[strategy];
      
      // Convert allocations to array format expected by contract
      const allocations = [
        BigInt(strategyConfig.allocations.WBTC),
        BigInt(strategyConfig.allocations.BIG_CAPS),
        BigInt(strategyConfig.allocations.MID_LOWER_CAPS),
        BigInt(strategyConfig.allocations.STABLECOINS),
      ];

      // Map strategy to enum value
      const strategyEnum = strategy === 'low' ? 0 : strategy === 'medium' ? 1 : 2;

      // For MVP, simulate the transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}` as `0x${string}`;
      
      // In production, this would be:
      // const txHash = await walletClient.writeContract({
      //   address: vaultAddress,
      //   abi: VAULT_ABI,
      //   functionName: 'rebalance',
      //   args: [strategyEnum, allocations],
      // });

      console.log(`Strategy ${strategy} executed for user ${userWalletAddress}`);
      console.log(`Allocations: ${allocations.join(', ')}`);
      
      return {
        success: true,
        txHash: mockTxHash,
      };
    } catch (error) {
      console.error('Error executing strategy:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Emergency rebalance to stablecoin
   */
  static async emergencyRebalanceToStablecoin(
    userWalletAddress: Address,
    privateKey: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const vaultAddress = CONTRACT_ADDRESSES.VAULT as Address || '0x1234567890123456789012345678901234567890' as Address;
      
      if (!vaultAddress) {
        throw new Error('Vault contract address not configured');
      }

      const walletClient = this.getWalletClient(privateKey);

      // For MVP, simulate the transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}` as `0x${string}`;
      
      // In production, this would be:
      // const txHash = await walletClient.writeContract({
      //   address: vaultAddress,
      //   abi: VAULT_ABI,
      //   functionName: 'emergencyRebalanceToStablecoin',
      //   args: [],
      // });

      console.log(`Emergency rebalance to stablecoin executed for user ${userWalletAddress}`);
      
      return {
        success: true,
        txHash: mockTxHash,
      };
    } catch (error) {
      console.error('Error executing emergency rebalance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get portfolio value from smart contract
   */
  static async getPortfolioValue(userWalletAddress: Address): Promise<bigint | null> {
    try {
      const vaultAddress = CONTRACT_ADDRESSES.VAULT as Address || '0x1234567890123456789012345678901234567890' as Address;
      
      if (!vaultAddress) {
        return null;
      }

      // For MVP, return mock data
      // In production, this would be:
      // const value = await publicClient.readContract({
      //   address: vaultAddress,
      //   abi: VAULT_ABI,
      //   functionName: 'getPortfolioValue',
      //   args: [userWalletAddress],
      // });

      // Mock portfolio value
      const mockValue = parseEther('10.5'); // 10.5 ETH equivalent
      return mockValue;
    } catch (error) {
      console.error('Error getting portfolio value:', error);
      return null;
    }
  }

  /**
   * Get user allocations from smart contract
   */
  static async getUserAllocations(userWalletAddress: Address): Promise<number[] | null> {
    try {
      const vaultAddress = CONTRACT_ADDRESSES.VAULT as Address || '0x1234567890123456789012345678901234567890' as Address;
      
      if (!vaultAddress) {
        return null;
      }

      // For MVP, return mock data
      // In production, this would be:
      // const allocations = await publicClient.readContract({
      //   address: vaultAddress,
      //   abi: VAULT_ABI,
      //   functionName: 'getUserAllocations',
      //   args: [userWalletAddress],
      // });

      // Mock allocations for medium strategy
      return [50, 30, 15, 5]; // WBTC, BIG_CAPS, MID_LOWER_CAPS, STABLECOINS
    } catch (error) {
      console.error('Error getting user allocations:', error);
      return null;
    }
  }

  /**
   * Get token balance for a user
   */
  static async getTokenBalance(
    userWalletAddress: Address,
    tokenAddress: Address
  ): Promise<bigint | null> {
    try {
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // ETH balance
        return await publicClient.getBalance({ address: userWalletAddress });
      } else {
        // ERC20 token balance
        const balance = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [userWalletAddress],
        });
        return balance;
      }
    } catch (error) {
      console.error('Error getting token balance:', error);
      return null;
    }
  }

  /**
   * Deposit funds to the vault
   */
  static async deposit(
    userWalletAddress: Address,
    amount: bigint,
    assetAddress: Address,
    privateKey: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const vaultAddress = CONTRACT_ADDRESSES.VAULT as Address || '0x1234567890123456789012345678901234567890' as Address;
      
      if (!vaultAddress) {
        throw new Error('Vault contract address not configured');
      }

      const walletClient = this.getWalletClient(privateKey);

      // For MVP, simulate the transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}` as `0x${string}`;
      
      // In production, this would be:
      // const txHash = await walletClient.writeContract({
      //   address: vaultAddress,
      //   abi: VAULT_ABI,
      //   functionName: 'deposit',
      //   args: [amount, assetAddress],
      //   value: assetAddress === '0x0000000000000000000000000000000000000000' ? amount : 0n,
      // });

      console.log(`Deposit of ${formatEther(amount)} executed for user ${userWalletAddress}`);
      
      return {
        success: true,
        txHash: mockTxHash,
      };
    } catch (error) {
      console.error('Error executing deposit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Withdraw funds from the vault
   */
  static async withdraw(
    userWalletAddress: Address,
    amount: bigint,
    assetAddress: Address,
    privateKey: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const vaultAddress = CONTRACT_ADDRESSES.VAULT as Address || '0x1234567890123456789012345678901234567890' as Address;
      
      if (!vaultAddress) {
        throw new Error('Vault contract address not configured');
      }

      const walletClient = this.getWalletClient(privateKey);

      // For MVP, simulate the transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}` as `0x${string}`;
      
      // In production, this would be:
      // const txHash = await walletClient.writeContract({
      //   address: vaultAddress,
      //   abi: VAULT_ABI,
      //   functionName: 'withdraw',
      //   args: [amount, assetAddress],
      // });

      console.log(`Withdrawal of ${formatEther(amount)} executed for user ${userWalletAddress}`);
      
      return {
        success: true,
        txHash: mockTxHash,
      };
    } catch (error) {
      console.error('Error executing withdrawal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
