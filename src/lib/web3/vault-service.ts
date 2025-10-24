import { 
  type Address, 
  parseUnits, 
  formatUnits,
  type WalletClient,
  type PublicClient,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { VAULT_ABI, ERC20_ABI } from '@/lib/contracts/vaultABI';
import { CONTRACT_ADDRESSES, ASSETS } from '@/lib/contracts/addresses';

export interface DepositParams {
  tokenAddress: Address;
  amount: string; // Human readable amount (e.g., "100.5")
  decimals: number;
  userAddress: Address;
}

export interface WithdrawParams {
  tokenAddress: Address;
  amount: string; // Human readable amount
  decimals: number;
  userAddress: Address;
}

export class VaultService {
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private vaultAddress: Address;

  constructor(walletClient: WalletClient, publicClient: PublicClient) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.vaultAddress = CONTRACT_ADDRESSES.VAULT;
  }

  /**
   * Check if user has approved the vault to spend their tokens
   */
  async checkAllowance(tokenAddress: Address, userAddress: Address): Promise<bigint> {
    try {
      const allowance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, this.vaultAddress],
      });
      return allowance as bigint;
    } catch (error) {
      console.error('Error checking allowance:', error);
      return BigInt(0);
    }
  }

  /**
   * Approve the vault to spend tokens
   */
  async approveToken(
    tokenAddress: Address,
    amount: bigint,
    userAddress: Address
  ): Promise<`0x${string}`> {
    try {
      const hash = await this.walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [this.vaultAddress, amount],
        account: userAddress,
        chain: baseSepolia,
      });
      
      // Wait for transaction confirmation
      await this.publicClient.waitForTransactionReceipt({ hash });
      
      return hash;
    } catch (error) {
      console.error('Error approving token:', error);
      throw new Error(`Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deposit tokens into the vault
   * This is a two-step process:
   * 1. Approve the vault to spend tokens (if not already approved)
   * 2. Call deposit on the vault contract
   */
  async deposit({
    tokenAddress,
    amount,
    decimals,
    userAddress,
  }: DepositParams): Promise<{
    approvalHash?: `0x${string}`;
    depositHash: `0x${string}`;
  }> {
    try {
      // Convert human-readable amount to wei/base units
      const amountInWei = parseUnits(amount, decimals);
      
      // Check current allowance
      const currentAllowance = await this.checkAllowance(tokenAddress, userAddress);
      
      let approvalHash: `0x${string}` | undefined;
      
      // If allowance is insufficient, approve first
      if (currentAllowance < amountInWei) {
        console.log('Approving token spend...');
        approvalHash = await this.approveToken(tokenAddress, amountInWei, userAddress);
        console.log('Token approved:', approvalHash);
      }
      
      // Execute deposit
      console.log('Depositing to vault...');
      const depositHash = await this.walletClient.writeContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [tokenAddress, amountInWei],
        account: userAddress,
        chain: baseSepolia,
      });
      
      // Wait for deposit confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: depositHash,
        confirmations: 1,
      });
      
      console.log('Deposit confirmed:', depositHash);
      
      return {
        approvalHash,
        depositHash,
      };
    } catch (error) {
      console.error('Error depositing:', error);
      throw new Error(`Failed to deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Withdraw tokens from the vault
   */
  async withdraw({
    tokenAddress,
    amount,
    decimals,
    userAddress,
  }: WithdrawParams): Promise<`0x${string}`> {
    try {
      // Convert human-readable amount to wei/base units
      const amountInWei = parseUnits(amount, decimals);
      
      // Check user balance in vault
      const vaultBalance = await this.getUserBalance(userAddress, tokenAddress);
      
      if (vaultBalance < amountInWei) {
        throw new Error('Insufficient balance in vault');
      }
      
      // Execute withdrawal
      console.log('Withdrawing from vault...');
      const hash = await this.walletClient.writeContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [tokenAddress, amountInWei],
        account: userAddress,
        chain: baseSepolia,
      });
      
      // Wait for withdrawal confirmation
      await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
      });
      
      console.log('Withdrawal confirmed:', hash);
      
      return hash;
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw new Error(`Failed to withdraw: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's balance in the vault for a specific token
   */
  async getUserBalance(userAddress: Address, tokenAddress: Address): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'getUserBalance',
        args: [userAddress, tokenAddress],
      });
      return balance as bigint;
    } catch (error) {
      console.error('Error getting vault balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Get user's wallet balance for a specific token
   */
  async getWalletBalance(userAddress: Address, tokenAddress: Address): Promise<bigint> {
    try {
      // Handle native ETH
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        return await this.publicClient.getBalance({ address: userAddress });
      }
      
      const balance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      });
      return balance as bigint;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Check if a token is whitelisted in the vault
   */
  async isTokenWhitelisted(tokenAddress: Address): Promise<boolean> {
    try {
      const isWhitelisted = await this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'whitelistedTokens',
        args: [tokenAddress],
      });
      return isWhitelisted as boolean;
    } catch (error) {
      console.error('Error checking whitelist:', error);
      return false;
    }
  }

  /**
   * Get formatted balance (human-readable)
   */
  formatBalance(balance: bigint, decimals: number): string {
    return formatUnits(balance, decimals);
  }

  /**
   * Parse amount to wei/base units
   */
  parseAmount(amount: string, decimals: number): bigint {
    return parseUnits(amount, decimals);
  }
}

/**
 * Helper function to get token info by symbol
 */
export function getTokenBySymbol(symbol: string): {
  address: Address;
  decimals: number;
  name: string;
} | null {
  const asset = ASSETS[symbol as keyof typeof ASSETS];
  if (!asset) return null;
  
  return {
    address: asset.address,
    decimals: asset.decimals,
    name: asset.name,
  };
}

