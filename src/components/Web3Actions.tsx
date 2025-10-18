'use client';

import { useState, useEffect } from 'react';
// Removed wagmi hooks - using custody wallet instead
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { formatCurrency, formatTokenAmount } from '@/lib/utils';

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

export default function Web3Actions({ portfolio, onTransactionComplete }: Web3ActionsProps) {
  // Using custody wallet - no need for external wallet connection
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletAddress();
  }, []);

  const fetchWalletAddress = async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();
      setWalletAddress(data.walletAddress);
    } catch (error) {
      console.error('Error fetching wallet address:', error);
    }
  };

  const assets = [
    { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00' },
    { symbol: 'ETH', name: 'Ethereum', balance: '0.5432' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.0123' },
  ];

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    if (!amount || !selectedAsset) return;

    setIsProcessing(true);
    
    try {
      // In a real implementation, this would:
      // 1. Prepare the transaction data
      // 2. Execute the smart wallet transaction
      // 3. Wait for confirmation
      // 4. Update the database

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create transaction record
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          asset: selectedAsset,
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock hash
          portfolioId: portfolio.id,
        }),
      });

      if (response.ok) {
        setAmount('');
        setActiveAction(null);
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed wallet connection logic - using custody wallet

  // Remove wallet connection requirement - using custody wallet instead

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
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {assets.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.name} ({asset.symbol}) - Balance: {asset.balance}
                </option>
              ))}
            </select>
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
              disabled={!amount || isProcessing}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeAction === 'deposit'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
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

          {activeAction === 'deposit' && (
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
          <span className="text-gray-300">Custody Wallet:</span>
          <span className="font-mono text-white">
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Available'}
          </span>
        </div>
      </div>
    </div>
  );
}
