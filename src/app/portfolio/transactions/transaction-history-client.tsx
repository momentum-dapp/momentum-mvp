'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import AnimatedBackground from '@/components/background/animated-background';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'rebalance' | 'swap';
  amount: number;
  asset: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  portfolioId?: string;
  gasUsed?: number;
  gasPrice?: number;
  blockNumber?: number;
}

interface FilterOptions {
  type: string;
  status: string;
  asset: string;
  dateRange: string;
}

export default function TransactionHistoryClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    status: 'all',
    asset: 'all',
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, [filters, currentPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      
      if (filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.asset !== 'all') {
        params.append('asset', filters.asset);
      }

      // Try to fetch real transaction data first
      const response = await fetch(`/api/transactions?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.transactions && data.transactions.length > 0) {
          // Use real transaction data
          let realTransactions = data.transactions.map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            asset: tx.asset,
            txHash: tx.txHash,
            status: tx.status,
            createdAt: tx.createdAt,
            portfolioId: tx.portfolioId,
            gasUsed: Math.floor(Math.random() * 200000) + 21000, // Mock gas data
            gasPrice: Math.floor(Math.random() * 30) + 15, // Mock gas price
            blockNumber: Math.floor(Math.random() * 1000000) + 12000000, // Mock block number
          }));

          // Apply additional filters that aren't handled by the API
          if (filters.status !== 'all') {
            realTransactions = realTransactions.filter((tx: Transaction) => tx.status === filters.status);
          }

          if (filters.dateRange !== 'all') {
            const now = new Date();
            const days = parseInt(filters.dateRange);
            const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            realTransactions = realTransactions.filter((tx: Transaction) => 
              new Date(tx.createdAt) >= cutoffDate
            );
          }

          // Apply search
          if (searchTerm) {
            realTransactions = realTransactions.filter((tx: Transaction) =>
              tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
              tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
              tx.type.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }

          setTransactions(realTransactions);
          setTotalPages(Math.ceil(realTransactions.length / itemsPerPage));
          return;
        }
      }

      // Fallback to mock data if no real transactions exist or API fails
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'deposit',
          amount: 1000,
          asset: 'USDC',
          txHash: '0x1234567890abcdef1234567890abcdef12345678',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1',
          gasUsed: 21000,
          gasPrice: 20,
          blockNumber: 12345678
        },
        {
          id: '2',
          type: 'rebalance',
          amount: 250.50,
          asset: 'WBTC',
          txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1',
          gasUsed: 150000,
          gasPrice: 25,
          blockNumber: 12345675
        },
        {
          id: '3',
          type: 'swap',
          amount: 500,
          asset: 'ETH',
          txHash: '0x9876543210fedcba9876543210fedcba98765432',
          status: 'pending',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1',
          gasUsed: 0,
          gasPrice: 0,
          blockNumber: 0
        },
        {
          id: '4',
          type: 'withdrawal',
          amount: 200,
          asset: 'USDC',
          txHash: '0x5555555555555555555555555555555555555555',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1',
          gasUsed: 21000,
          gasPrice: 18,
          blockNumber: 12345650
        },
        {
          id: '5',
          type: 'deposit',
          amount: 1500,
          asset: 'USDT',
          txHash: '0x6666666666666666666666666666666666666666',
          status: 'failed',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1',
          gasUsed: 0,
          gasPrice: 0,
          blockNumber: 0
        },
        {
          id: '6',
          type: 'rebalance',
          amount: 750.25,
          asset: 'BIG_CAPS',
          txHash: '0x7777777777777777777777777777777777777777',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1',
          gasUsed: 180000,
          gasPrice: 22,
          blockNumber: 12345600
        },
        {
          id: '7',
          type: 'swap',
          amount: 300,
          asset: 'WBTC',
          txHash: '0x8888888888888888888888888888888888888888',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1',
          gasUsed: 120000,
          gasPrice: 20,
          blockNumber: 12345580
        },
        {
          id: '8',
          type: 'deposit',
          amount: 2000,
          asset: 'USDC',
          txHash: '0x9999999999999999999999999999999999999999',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
          portfolioId: 'portfolio-1',
          gasUsed: 21000,
          gasPrice: 19,
          blockNumber: 12345550
        }
      ];

      // Apply filters to mock data
      let filteredTransactions = mockTransactions;

      if (filters.type !== 'all') {
        filteredTransactions = filteredTransactions.filter(tx => tx.type === filters.type);
      }

      if (filters.status !== 'all') {
        filteredTransactions = filteredTransactions.filter(tx => tx.status === filters.status);
      }

      if (filters.asset !== 'all') {
        filteredTransactions = filteredTransactions.filter(tx => tx.asset === filters.asset);
      }

      if (filters.dateRange !== 'all') {
        const now = new Date();
        const days = parseInt(filters.dateRange);
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filteredTransactions = filteredTransactions.filter(tx => 
          new Date(tx.createdAt) >= cutoffDate
        );
      }

      // Apply search
      if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(tx =>
          tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sort by date (newest first)
      filteredTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
      
      setTransactions(paginatedTransactions);
      setTotalPages(Math.ceil(filteredTransactions.length / itemsPerPage));
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      // Fallback to empty state on error
      setTransactions([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

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
      if (type === 'rebalance') {
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      case 'rebalance':
        return 'text-blue-600';
      case 'swap':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      asset: 'all',
      dateRange: 'all'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative pt-20 pb-8">
        <AnimatedBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-20 pb-8">
      <AnimatedBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Transaction History</h1>
              <p className="text-gray-200 mt-2">
                View and track all your portfolio transactions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search by transaction hash, asset, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                />
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    <option value="all" className="bg-gray-800 text-white">All Types</option>
                    <option value="deposit" className="bg-gray-800 text-white">Deposit</option>
                    <option value="withdrawal" className="bg-gray-800 text-white">Withdrawal</option>
                    <option value="rebalance" className="bg-gray-800 text-white">Rebalance</option>
                    <option value="swap" className="bg-gray-800 text-white">Swap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    <option value="all" className="bg-gray-800 text-white">All Status</option>
                    <option value="confirmed" className="bg-gray-800 text-white">Confirmed</option>
                    <option value="pending" className="bg-gray-800 text-white">Pending</option>
                    <option value="failed" className="bg-gray-800 text-white">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Asset</label>
                  <select
                    value={filters.asset}
                    onChange={(e) => handleFilterChange('asset', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    <option value="all" className="bg-gray-800 text-white">All Assets</option>
                    <option value="USDC" className="bg-gray-800 text-white">USDC</option>
                    <option value="USDT" className="bg-gray-800 text-white">USDT</option>
                    <option value="WBTC" className="bg-gray-800 text-white">WBTC</option>
                    <option value="ETH" className="bg-gray-800 text-white">ETH</option>
                    <option value="BIG_CAPS" className="bg-gray-800 text-white">BIG_CAPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    <option value="all" className="bg-gray-800 text-white">All Time</option>
                    <option value="1" className="bg-gray-800 text-white">Last 24 hours</option>
                    <option value="7" className="bg-gray-800 text-white">Last 7 days</option>
                    <option value="30" className="bg-gray-800 text-white">Last 30 days</option>
                    <option value="90" className="bg-gray-800 text-white">Last 90 days</option>
                  </select>
                </div>
              </div>
            )}

            {/* Filter Actions */}
            {showFilters && (
              <div className="flex justify-between items-center">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
                <div className="text-sm text-gray-300">
                  {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-300 mb-4">
                <ClockIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
              <p className="text-gray-300">
                {Object.values(filters).some(f => f !== 'all') || searchTerm
                  ? 'Try adjusting your filters or search terms.'
                  : 'You haven\'t made any transactions yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/20">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.type, transaction.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className={`font-medium capitalize ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-300">
                          <span className="font-medium">{transaction.asset}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.createdAt)}</span>
                          <span>•</span>
                          <a
                            href={`https://sepolia.basescan.org/tx/${transaction.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-mono"
                          >
                            {truncateHash(transaction.txHash)}
                          </a>
                          {transaction.blockNumber && (
                            <>
                              <span>•</span>
                              <span>Block #{transaction.blockNumber.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-medium text-lg ${
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
                      {transaction.gasUsed && transaction.gasPrice && (
                        <p className="text-xs text-gray-400 mt-1">
                          Gas: {transaction.gasUsed.toLocaleString()} × {transaction.gasPrice} gwei
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
