'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient, usePublicClient } from 'wagmi';
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { formatCurrency, formatTokenAmount } from '@/lib/utils';
import { formatUnits, type Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { VaultService, getTokenBySymbol } from '@/lib/web3/vault-service';
import { ASSETS } from '@/lib/contracts/addresses';

interface Web3ActionsProps {
  portfolio: {
    id: string;
    totalValue: number;
    allocations: {
      WBTC: number;
      BIG_CAPS: number;
      MID_LOWER_CAPS: number;
      STABLECOINS: number;
    };
  };
  onTransactionComplete: () => void;
}

interface TokenAsset {
  symbol: string;
  name: string;
  balance: string;
  address: string;
  decimals: number;
}

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

// Use tokens from addresses configuration
const TOKENS = {
  USDC: ASSETS.USDC,
  WETH: ASSETS.WETH,
  WBTC: ASSETS.WBTC,
};

export default function Web3Actions({ portfolio, onTransactionComplete }: Web3ActionsProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: baseSepolia.id });
  const publicClient = usePublicClient({ chainId: baseSepolia.id });
  
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [transactionError, setTransactionError] = useState<string>('');
  const [walletAssets, setWalletAssets] = useState<TokenAsset[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [vaultService, setVaultService] = useState<VaultService | null>(null);

  // Initialize VaultService when wallet client is available
  useEffect(() => {
    if (walletClient && publicClient) {
      console.log('✅ VaultService initialized with wallet client');
      setVaultService(new VaultService(walletClient, publicClient));
    } else {
      console.log('⏳ Waiting for wallet client...', { walletClient: !!walletClient, publicClient: !!publicClient });
    }
  }, [walletClient, publicClient]);

  // Fetch ETH balance using wagmi hook
  const { data: ethBalance } = useBalance({
    address: address,
    chainId: baseSepolia.id,
  });

  // Fetch wallet token balances
  useEffect(() => {
    const fetchWalletBalances = async () => {
      if (!address || !isConnected) {
        setWalletAssets([]);
        return;
      }

      setLoadingBalances(true);
      try {
        const balances: TokenAsset[] = [];

        // Add ETH balance
        if (ethBalance) {
          balances.push({
            symbol: 'ETH',
            name: 'Ethereum',
            balance: formatUnits(ethBalance.value, 18),
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
          });
        }

        // Fetch ERC20 token balances using fetch API for RPC calls
        const rpcUrl = `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
        
        for (const [symbol, token] of Object.entries(TOKENS)) {
          try {
            // Skip if it's a placeholder address
            if (token.address === '0x0000000000000000000000000000000000000000') {
              balances.push({
                symbol,
                name: token.name,
                balance: '0',
                address: token.address,
                decimals: token.decimals,
              });
              continue;
            }

            // Encode the balanceOf call
            const data = `0x70a08231000000000000000000000000${address.slice(2)}`;
            
            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                  {
                    to: token.address,
                    data: data,
                  },
                  'latest',
                ],
              }),
            });

            const result = await response.json();
            
            if (result.result) {
              const balance = BigInt(result.result);
              balances.push({
                symbol,
                name: token.name,
                balance: formatUnits(balance, token.decimals),
                address: token.address,
                decimals: token.decimals,
              });
            } else {
              balances.push({
                symbol,
                name: token.name,
                balance: '0',
                address: token.address,
                decimals: token.decimals,
              });
            }
          } catch (error) {
            console.error(`Error fetching ${symbol} balance:`, error);
            balances.push({
              symbol,
              name: token.name,
              balance: '0',
              address: token.address,
              decimals: token.decimals,
            });
          }
        }

        setWalletAssets(balances);
      } catch (error) {
        console.error('Error fetching wallet balances:', error);
      } finally {
        setLoadingBalances(false);
      }
    };

    fetchWalletBalances();
  }, [address, isConnected, ethBalance]);

  // Get assets to display based on action type
  const getDisplayAssets = (): TokenAsset[] => {
    if (activeAction === 'withdraw') {
      // Only show USDC for withdrawals
      return walletAssets.filter(asset => asset.symbol === 'USDC');
    }
    // Show all wallet assets with balance > 0 for deposits
    return walletAssets.filter(asset => parseFloat(asset.balance) > 0);
  };

  // Reset selected asset when action changes or when assets are loaded
  useEffect(() => {
    if (activeAction && walletAssets.length > 0) {
      const displayAssets = getDisplayAssets();
      if (displayAssets.length > 0) {
        // For withdraw, default to USDC; for deposit, default to first available asset
        setSelectedAsset(displayAssets[0].symbol);
      }
    }
  }, [activeAction, walletAssets]);

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    if (!amount || !selectedAsset || !address || !vaultService) {
      setTransactionError('Missing required parameters');
      return;
    }

    setIsProcessing(true);
    setTransactionError('');
    setTransactionStatus('');
    
    try {
      const tokenInfo = getTokenBySymbol(selectedAsset);
      if (!tokenInfo) {
        throw new Error(`Token ${selectedAsset} not found`);
      }

      let txHash: `0x${string}`;
      let approvalHash: `0x${string}` | undefined;

      if (type === 'deposit') {
        setTransactionStatus('Preparing deposit...');
        
        // Check if token is whitelisted
        const isWhitelisted = await vaultService.isTokenWhitelisted(tokenInfo.address);
        if (!isWhitelisted) {
          throw new Error(`Token ${selectedAsset} is not whitelisted in the vault`);
        }

        // Execute deposit (includes approval if needed)
        const result = await vaultService.deposit({
          tokenAddress: tokenInfo.address,
          amount: amount,
          decimals: tokenInfo.decimals,
          userAddress: address as Address,
        });

        txHash = result.depositHash;
        approvalHash = result.approvalHash;
        
        if (approvalHash) {
          setTransactionStatus('Token approved. Deposit confirmed!');
        } else {
          setTransactionStatus('Deposit confirmed!');
        }
      } else {
        // Withdraw
        setTransactionStatus('Preparing withdrawal...');
        
        txHash = await vaultService.withdraw({
          tokenAddress: tokenInfo.address,
          amount: amount,
          decimals: tokenInfo.decimals,
          userAddress: address as Address,
        });
        
        setTransactionStatus('Withdrawal confirmed!');
      }

      // Record transaction in database
      setTransactionStatus('Recording transaction...');
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          asset: selectedAsset,
          txHash: txHash,
          approvalHash: approvalHash,
          portfolioId: portfolio.id,
          status: 'completed',
        }),
      });

      if (!response.ok) {
        console.error('Failed to record transaction in database');
        // Don't throw - transaction succeeded on-chain
      }

      // Success - reset form and refresh
      setTimeout(() => {
        setAmount('');
        setActiveAction(null);
        setTransactionStatus('');
        onTransactionComplete();
      }, 2000);

    } catch (error) {
      console.error('Transaction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setTransactionError(errorMessage);
      setTransactionStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Wallet connection handled by WalletAuthContext

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Portfolio Actions</h3>
      
      {!activeAction ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveAction('deposit')}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowDownIcon className="h-4 w-4 mr-2" />
            Deposit Funds
          </button>
          
          <button
            onClick={() => setActiveAction('withdraw')}
            className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowUpIcon className="h-4 w-4 mr-2" />
            Withdraw Funds
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white capitalize">
              {activeAction} Funds
            </h4>
            <button
              onClick={() => setActiveAction(null)}
              className="text-gray-300 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Select Asset
            </label>
            {loadingBalances ? (
              <div className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-gray-400">
                Loading balances...
              </div>
            ) : (
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={getDisplayAssets().length === 0}
              >
                {getDisplayAssets().length === 0 ? (
                  <option value="">
                    {activeAction === 'withdraw' 
                      ? 'No USDC available to withdraw' 
                      : 'No assets with balance to deposit'}
                  </option>
                ) : (
                  getDisplayAssets().map((asset) => {
                    const formattedBalance = parseFloat(asset.balance).toFixed(
                      asset.decimals === 18 ? 6 : asset.decimals === 8 ? 8 : 2
                    );
                    return (
                      <option key={asset.symbol} value={asset.symbol} className="bg-gray-800">
                        {asset.name} ({asset.symbol}) - Balance: {formattedBalance}
                      </option>
                    );
                  })
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-300 text-sm">{selectedAsset}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleTransaction(activeAction)}
              disabled={!amount || isProcessing || !vaultService || !address}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeAction === 'deposit'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!vaultService ? 'Initializing vault service...' : !amount ? 'Enter an amount' : ''}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : !vaultService ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Initializing...
                </div>
              ) : (
                `${activeAction === 'deposit' ? 'Deposit' : 'Withdraw'} ${selectedAsset}`
              )}
            </button>
            
            <button
              onClick={() => setActiveAction(null)}
              className="px-4 py-2 border border-white/20 text-gray-200 rounded-md hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Transaction Status */}
          {transactionStatus && (
            <div className="bg-blue-500/20 p-3 rounded-md border border-blue-500/30">
              <p className="text-sm text-blue-200">
                <strong>Status:</strong> {transactionStatus}
              </p>
            </div>
          )}

          {/* Transaction Error */}
          {transactionError && (
            <div className="bg-red-500/20 p-3 rounded-md border border-red-500/30">
              <p className="text-sm text-red-200">
                <strong>Error:</strong> {transactionError}
              </p>
            </div>
          )}

          {activeAction === 'deposit' && !transactionStatus && !transactionError && (
            <div className="bg-blue-500/20 p-3 rounded-md border border-blue-500/30">
              <p className="text-sm text-blue-200">
                <strong>Note:</strong> Deposited funds will be automatically allocated according to your portfolio strategy.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Connected Wallet:</span>
          <span className="font-mono text-white">
            {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
          </span>
        </div>
      </div>
    </div>
  );
}
