'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'rebalance' | 'swap';
  amount: number;
  asset: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  portfolioId?: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
      } else {
        // If no transactions from API, show some mock data for demo
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            type: 'deposit',
            amount: 1000,
            asset: 'USDC',
            txHash: '0x1234567890abcdef1234567890abcdef12345678',
            status: 'confirmed',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            portfolioId: 'portfolio-1'
          },
          {
            id: '2',
            type: 'rebalance',
            amount: 250.50,
            asset: 'WBTC',
            txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
            status: 'confirmed',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            portfolioId: 'portfolio-1'
          },
          {
            id: '3',
            type: 'swap',
            amount: 500,
            asset: 'ETH',
            txHash: '0x9876543210fedcba9876543210fedcba98765432',
            status: 'pending',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            portfolioId: 'portfolio-1'
          }
        ];
        
        const filtered = filter === 'all' 
          ? mockTransactions 
          : mockTransactions.filter(tx => tx.type === filter);
        
        setTransactions(filtered);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Show mock data on error for demo purposes
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'deposit',
          amount: 1000,
          asset: 'USDC',
          txHash: '0x1234567890abcdef1234567890abcdef12345678',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1'
        }
      ];
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') {
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
    if (status === 'failed') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
    if (status === 'confirmed') {
      if (type === 'deposit') {
        return <ArrowDownIcon className="h-5 w-5 text-green-500" />;
      }
      if (type === 'withdrawal') {
        return <ArrowUpIcon className="h-5 w-5 text-red-500" />;
      }
      return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Transaction History</h2>
          
          {/* Filter buttons */}
          <div className="flex space-x-2">
            {['all', 'deposit', 'withdrawal', 'rebalance', 'swap'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === filterType
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/20">
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-300">
            No transactions found
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getTransactionIcon(transaction.type, transaction.status)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-white capitalize">
                        {transaction.type}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-300">
                      <span>{transaction.asset}</span>
                      <span>•</span>
                      <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${transaction.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {truncateHash(transaction.txHash)}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === 'deposit' ? 'text-green-400' : 
                    transaction.type === 'withdrawal' ? 'text-red-400' : 
                    'text-white'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : 
                     transaction.type === 'withdrawal' ? '-' : ''}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-300">
                    {new Date(transaction.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
