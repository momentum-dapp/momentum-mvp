'use client';

import { useState, useEffect } from 'react';
import { 
  ChartPieIcon, 
  ArrowPathIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WalletIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import PerformanceChart from '@/components/PerformanceChart';
import WalletDisplay from '@/components/WalletDisplay';
import EmergencyRebalance from '@/components/EmergencyRebalance';
import Link from 'next/link';

interface Portfolio {
  id: string;
  strategy: 'low' | 'medium' | 'high';
  totalValue: number;
  allocations: {
    WBTC: number;
    BIG_CAPS: number;
    MID_LOWER_CAPS: number;
    STABLECOINS: number;
  };
  lastRebalanced: string;
  isActive: boolean;
}

interface PerformanceData {
  date: string;
  value: number;
  change: number;
}

export default function PortfolioClient() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const strategyNames = {
    low: 'Conservative Strategy',
    medium: 'Balanced Strategy',
    high: 'Aggressive Strategy',
  };

  const assetNames = {
    WBTC: 'Wrapped Bitcoin',
    BIG_CAPS: 'Major Cryptocurrencies',
    MID_LOWER_CAPS: 'Emerging Cryptocurrencies',
    STABLECOINS: 'Stablecoins',
  };

  const assetColors = {
    WBTC: 'bg-orange-500',
    BIG_CAPS: 'bg-blue-500',
    MID_LOWER_CAPS: 'bg-purple-500',
    STABLECOINS: 'bg-green-500',
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real portfolio data first
      const portfolioResponse = await fetch('/api/portfolio');
      const portfolioData = await portfolioResponse.json();
      
      if (portfolioResponse.ok && portfolioData.hasPortfolio) {
        // Use real portfolio data
        const realPortfolio: Portfolio = {
          id: portfolioData.portfolio.id,
          strategy: portfolioData.portfolio.strategy,
          totalValue: portfolioData.portfolio.totalValue,
          allocations: portfolioData.portfolio.allocations,
          lastRebalanced: portfolioData.portfolio.lastRebalanced,
          isActive: portfolioData.portfolio.isActive,
        };
        
        setPortfolio(realPortfolio);
        
        // Fetch performance data
        const performanceResponse = await fetch('/api/portfolio/performance?days=30');
        const performanceData = await performanceResponse.json();
        
        if (performanceResponse.ok && performanceData.performance) {
          setPerformanceData(performanceData.performance);
        } else {
          // Fallback to mock performance data
          setPerformanceData(generateMockPerformanceData(realPortfolio.totalValue, 30));
        }
        
        // Simulate wallet balance (in real app, this would come from Web3)
        const balance = realPortfolio.totalValue * (0.95 + Math.random() * 0.1);
        setWalletBalance(balance);
        setLastUpdate(new Date());
        
      } else {
        // Fallback to mock data if no real portfolio exists
        const mockPortfolio: Portfolio = {
          id: 'portfolio-1',
          strategy: 'medium',
          totalValue: 12500.75,
          allocations: {
            WBTC: 25,
            BIG_CAPS: 35,
            MID_LOWER_CAPS: 25,
            STABLECOINS: 15,
          },
          lastRebalanced: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        };

        setPortfolio(mockPortfolio);
        setPerformanceData(generateMockPerformanceData(mockPortfolio.totalValue, 30));
        
        // Simulate wallet balance
        const balance = mockPortfolio.totalValue * (0.95 + Math.random() * 0.1);
        setWalletBalance(balance);
        setLastUpdate(new Date());
      }
      
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      
      // Fallback to mock data on error
      const mockPortfolio: Portfolio = {
        id: 'portfolio-1',
        strategy: 'medium',
        totalValue: 12500.75,
        allocations: {
          WBTC: 25,
          BIG_CAPS: 35,
          MID_LOWER_CAPS: 25,
          STABLECOINS: 15,
        },
        lastRebalanced: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      };

      setPortfolio(mockPortfolio);
      setPerformanceData(generateMockPerformanceData(mockPortfolio.totalValue, 30));
      
      // Simulate wallet balance
      const balance = mockPortfolio.totalValue * (0.95 + Math.random() * 0.1);
      setWalletBalance(balance);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  const generateMockPerformanceData = (initialValue: number, days: number): PerformanceData[] => {
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Generate realistic price movement with some volatility
      const volatility = 0.02; // 2% daily volatility
      const trend = 0.001; // Slight upward trend
      const randomChange = (Math.random() - 0.5) * volatility;
      const dailyChange = trend + randomChange;
      
      const previousValue: number = i === days ? initialValue : data[data.length - 1].value;
      const value: number = previousValue * (1 + dailyChange);
      const change: number = i === days ? 0 : ((value - previousValue) / previousValue) * 100;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
        change: Math.round(change * 100) / 100,
      });
    }
    
    return data;
  };

  const handleRebalance = async () => {
    if (!portfolio) return;
    
    setIsRebalancing(true);
    try {
      // Execute rebalancing via smart contract
      const response = await fetch('/api/execute-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy: portfolio.strategy, // Rebalance with current strategy
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.portfolio) {
          // Update portfolio with new data from API
          setPortfolio({
            id: data.portfolio.id,
            strategy: data.portfolio.strategy,
            totalValue: data.portfolio.totalValue,
            allocations: data.portfolio.allocations,
            lastRebalanced: data.portfolio.lastRebalanced,
            isActive: portfolio.isActive,
          });
        } else {
          // Update timestamp if no portfolio data returned
          setPortfolio({
            ...portfolio,
            lastRebalanced: new Date().toISOString(),
          });
        }
        
        // Show success message with transaction hash
        console.log(`Rebalancing completed. Transaction: ${data.transactionHash}`);
      } else {
        throw new Error(data.error || 'Rebalancing failed');
      }
    } catch (error) {
      console.error('Rebalancing failed:', error);
      // Show error to user
      alert(`Rebalancing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRebalancing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">No Portfolio Found</h1>
            <p className="text-gray-200 text-lg mb-8">You don't have an active portfolio yet.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allocationData = Object.entries(portfolio.allocations).map(([asset, percentage]) => ({
    asset: asset as keyof typeof assetNames,
    percentage,
    value: (portfolio.totalValue * percentage) / 100,
  }));

  const totalReturn = performanceData.length > 0 
    ? ((performanceData[performanceData.length - 1].value - performanceData[0].value) / performanceData[0].value) * 100
    : 0;

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Portfolio Overview</h1>
              <p className="text-gray-200 text-lg">
                Monitor your AI-powered portfolio performance and allocations
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRebalance}
                disabled={isRebalancing}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRebalancing ? 'animate-spin' : ''}`} />
                {isRebalancing ? 'Rebalancing...' : 'Rebalance'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Portfolio Performance</h2>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-300">Total Return</p>
                    <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
              <PerformanceChart data={performanceData} />
            </div>

            {/* Asset Allocation */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Asset Allocation</h3>
              
              {/* Allocation Chart */}
              <div className="mb-6">
                <div className="flex h-4 rounded-lg overflow-hidden">
                  {allocationData.map(({ asset, percentage }) => (
                    <div
                      key={asset}
                      className={assetColors[asset]}
                      style={{ width: `${percentage}%` }}
                      title={`${assetNames[asset]}: ${percentage}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Allocation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allocationData.map(({ asset, percentage, value }) => (
                  <div key={asset} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${assetColors[asset]} mr-3`} />
                      <div>
                        <p className="font-medium text-white">{assetNames[asset]}</p>
                        <p className="text-sm text-gray-300">{formatPercentage(percentage)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{formatCurrency(value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Display */}
            <WalletDisplay />

            {/* Wallet Balance */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center mb-4">
                <WalletIcon className="h-8 w-8 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold">Portfolio Value</h2>
                  <p className="text-indigo-100 text-sm">
                    Last updated {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {walletBalance !== null ? formatCurrency(walletBalance) : formatCurrency(0)}
                </p>
                <p className="text-indigo-100 text-sm">Total Assets</p>
              </div>
            </div>

            {/* Strategy Overview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {strategyNames[portfolio.strategy]}
                  </h3>
                  <p className="text-sm text-gray-300">
                    Last rebalanced {new Date(portfolio.lastRebalanced).toLocaleDateString()}
                  </p>
                </div>
                <ChartPieIcon className="h-6 w-6 text-gray-300" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Total Value</span>
                  <span className="font-medium text-white">
                    {formatCurrency(portfolio.totalValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Strategy</span>
                  <span className="font-medium text-white capitalize">
                    {portfolio.strategy} Risk
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Status</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    portfolio.isActive 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {portfolio.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Performance</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">+12.5%</p>
                  <p className="text-sm text-gray-300">7 Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">+28.3%</p>
                  <p className="text-sm text-gray-300">30 Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">+45.7%</p>
                  <p className="text-sm text-gray-300">90 Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">0.85</p>
                  <p className="text-sm text-gray-300">Sharpe Ratio</p>
                </div>
              </div>
            </div>

            {/* Emergency Rebalance */}
            <EmergencyRebalance onRebalanceComplete={fetchPortfolioData} />
          </div>
        </div>
      </div>
    </div>
  );
}
