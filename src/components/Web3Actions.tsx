'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance, useWalletClient, useConfig, useSwitchChain } from 'wagmi';
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { formatCurrency, formatTokenAmount } from '@/lib/utils';
import { formatUnits, type Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { VaultService, getTokenBySymbol } from '@/lib/web3/vault-service';
import { ASSETS, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { getPublicClient, getWalletClient } from '@wagmi/core';

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
  const { address, isConnected, status, chain } = useAccount();
  const config = useConfig();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  // Get public client - this is always available from config
  const publicClient = useMemo(() => {
    return getPublicClient(config, { chainId: baseSepolia.id });
  }, [config]);
  
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [transactionError, setTransactionError] = useState<string>('');
  const [walletAssets, setWalletAssets] = useState<TokenAsset[]>([]);
  const [vaultAssets, setVaultAssets] = useState<TokenAsset[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingVaultBalances, setLoadingVaultBalances] = useState(false);
  const [vaultBalancesRefreshKey, setVaultBalancesRefreshKey] = useState(0);

  // Don't pre-initialize vault service - create it on-demand when needed
  // This avoids issues with useWalletClient not returning data reliably
  console.log('🔍 Web3Actions state:', { 
    isConnected,
    hasAddress: !!address,
    address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'none',
    hasPublicClient: !!publicClient,
    chainId: chain?.id,
    isCorrectChain: chain?.id === baseSepolia.id,
  });

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

  // Fetch vault token balances
  useEffect(() => {
    const fetchVaultBalances = async () => {
      if (!address || !isConnected || !publicClient) {
        console.log('🔍 Skipping vault balance fetch:', { address, isConnected, hasPublicClient: !!publicClient });
        setVaultAssets([]);
        return;
      }

      console.log('🔍 Starting vault balance fetch for address:', address);
      setLoadingVaultBalances(true);
      try {
        const balances: TokenAsset[] = [];

        // Fetch vault balances for all tokens
        for (const [symbol, token] of Object.entries(TOKENS)) {
          try {
            // Skip if it's a placeholder address
            if (token.address === '0x0000000000000000000000000000000000000000') {
              console.log(`⏭️ Skipping ${symbol} (placeholder address)`);
              continue;
            }

            console.log(`🔍 Fetching vault balance for ${symbol} (${token.address})`);

            // Use RPC call to get vault balance
            const rpcUrl = `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
            
            // Encode getUserBalance call: getUserBalance(address user, address token)
            // Function signature: getUserBalance(address,address) -> 0x6805d6ad
            const userAddressHex = address.toLowerCase().slice(2).padStart(64, '0');
            const tokenAddressHex = token.address.toLowerCase().slice(2).padStart(64, '0');
            const data = `0x6805d6ad${userAddressHex}${tokenAddressHex}`;
            
            console.log(`📤 RPC Call for ${symbol}:`, {
              to: CONTRACT_ADDRESSES.VAULT,
              data: data,
              userAddressHex,
              tokenAddressHex,
            });

            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                  {
                    to: CONTRACT_ADDRESSES.VAULT.toLowerCase(),
                    data: data,
                  },
                  'latest',
                ],
              }),
            });

            const result = await response.json();
            console.log(`📥 RPC Response for ${symbol}:`, result);
            
            if (result.result) {
              const balance = BigInt(result.result);
              const formattedBalance = formatUnits(balance, token.decimals);
              
              console.log(`💰 ${symbol} vault balance:`, {
                raw: result.result,
                balance: balance.toString(),
                formatted: formattedBalance,
              });
              
              // Only add tokens with non-zero balance
              if (balance > BigInt(0)) {
                console.log(`✅ Adding ${symbol} to vault assets`);
                balances.push({
                  symbol,
                  name: token.name,
                  balance: formattedBalance,
                  address: token.address,
                  decimals: token.decimals,
                });
              } else {
                console.log(`⏭️ Skipping ${symbol} (zero balance)`);
              }
            } else {
              console.log(`❌ No result for ${symbol}:`, result);
            }
          } catch (error) {
            console.error(`❌ Error fetching vault balance for ${symbol}:`, error);
          }
        }

        console.log('✅ Final vault assets:', balances);
        setVaultAssets(balances);
      } catch (error) {
        console.error('❌ Error fetching vault balances:', error);
      } finally {
        setLoadingVaultBalances(false);
      }
    };

    // Only fetch vault balances when withdraw action is active
    if (activeAction === 'withdraw') {
      console.log('🔄 Withdraw action active, fetching vault balances...');
      fetchVaultBalances();
    }
  }, [address, isConnected, publicClient, activeAction, vaultBalancesRefreshKey]);

  // Get assets to display based on action type
  const getDisplayAssets = (): TokenAsset[] => {
    if (activeAction === 'withdraw') {
      // Show vault assets for withdrawals
      return vaultAssets;
    }
    // Show all wallet assets with balance > 0 for deposits
    return walletAssets.filter(asset => parseFloat(asset.balance) > 0);
  };

  // Reset selected asset when action changes or when assets are loaded
  useEffect(() => {
    if (activeAction) {
      const displayAssets = activeAction === 'withdraw' ? vaultAssets : walletAssets.filter(asset => parseFloat(asset.balance) > 0);
      console.log('🔄 Selected asset update:', { activeAction, displayAssetsCount: displayAssets.length, displayAssets });
      if (displayAssets.length > 0) {
        // For withdraw, default to first vault asset; for deposit, default to first available wallet asset
        setSelectedAsset(displayAssets[0].symbol);
        console.log('✅ Set selected asset to:', displayAssets[0].symbol);
      } else {
        console.log('⚠️ No assets available for', activeAction);
      }
    }
  }, [activeAction, walletAssets, vaultAssets]);

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    if (!amount || !selectedAsset || !address) {
      setTransactionError('Missing required parameters');
      return;
    }

    setIsProcessing(true);
    setTransactionError('');
    setTransactionStatus('');
    
    try {
      // Check if we're on the correct chain
      if (chain?.id !== baseSepolia.id) {
        setTransactionStatus('Switching to Base Sepolia network...');
        try {
          await switchChain({ chainId: baseSepolia.id });
          // Wait a bit for the chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError) {
          throw new Error(
            `Please switch to Base Sepolia network in your wallet. Current chain: ${chain?.name || 'Unknown'} (ID: ${chain?.id}), Required: Base Sepolia (ID: ${baseSepolia.id})`
          );
        }
      }

      // Get wallet client on-demand (this works reliably unlike the hook)
      setTransactionStatus('Connecting to wallet...');
      const walletClient = await getWalletClient(config, { 
        chainId: baseSepolia.id,
        account: address 
      });
      
      if (!walletClient) {
        throw new Error('Failed to get wallet client. Please ensure your wallet is connected.');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      console.log('✅ Got wallet client for transaction');
      
      // Create VaultService instance for this transaction
      const vaultService = new VaultService(walletClient, publicClient);
      
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
      
      // Validate portfolio ID is a valid UUID before sending
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(portfolio.id);
      
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
          portfolioId: isValidUUID ? portfolio.id : null,
          status: 'completed',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to record transaction in database:', errorData);
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
            disabled={!isConnected || !address}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isConnected ? 'Connect your wallet first' : ''}
          >
            <ArrowDownIcon className="h-4 w-4 mr-2" />
            Deposit Funds
          </button>
          
          <button
            onClick={() => setActiveAction('withdraw')}
            disabled={!isConnected || !address}
            className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isConnected ? 'Connect your wallet first' : ''}
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

          {/* Wrong Network Warning */}
          {chain?.id !== baseSepolia.id && (
            <div className="bg-yellow-500/20 p-3 rounded-md border border-yellow-500/30">
              <p className="text-sm text-yellow-200">
                <strong>⚠️ Wrong Network:</strong> You're on {chain?.name || 'Unknown'} (ID: {chain?.id}). 
                This app requires Base Sepolia testnet. Click the button below to switch networks automatically.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-200">
                Select Asset
              </label>
              {activeAction === 'withdraw' && (
                <button
                  onClick={() => setVaultBalancesRefreshKey(prev => prev + 1)}
                  disabled={loadingVaultBalances}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500"
                  title="Refresh vault balances"
                >
                  {loadingVaultBalances ? '🔄 Refreshing...' : '🔄 Refresh'}
                </button>
              )}
            </div>
            {(activeAction === 'withdraw' ? loadingVaultBalances : loadingBalances) ? (
              <div className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-gray-400">
                Loading {activeAction === 'withdraw' ? 'vault' : 'wallet'} balances...
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
                      ? 'No tokens in vault to withdraw' 
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
              disabled={!amount || isProcessing || !isConnected || !address || isSwitchingChain}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeAction === 'deposit'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={
                !isConnected 
                  ? 'Connect your wallet first' 
                  : chain?.id !== baseSepolia.id
                  ? 'Wrong network - will switch to Base Sepolia'
                  : !amount 
                  ? 'Enter an amount' 
                  : ''
              }
            >
              {isProcessing || isSwitchingChain ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSwitchingChain ? 'Switching Network...' : 'Processing...'}
                </div>
              ) : chain?.id !== baseSepolia.id ? (
                `Switch to Base Sepolia & ${activeAction === 'deposit' ? 'Deposit' : 'Withdraw'}`
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
