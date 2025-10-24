'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ChartPieIcon, 
  ArrowPathIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WalletIcon,
  ClockIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowsUpDownIcon,
  ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import PerformanceChart from '@/components/PerformanceChart';
import EmergencyRebalance from '@/components/EmergencyRebalance';
import AIAdvisor from '@/components/AIAdvisor';
import Web3Actions from '@/components/Web3Actions';
import TransactionHistory from '@/components/TransactionHistory';
import Link from 'next/link';
import { 
  getStrategyPerformance, 
  calculateMockedWalletBalance,
  getMockPortfolioAllocations,
  calculateAssetValue,
  STRATEGY_NAMES,
  ASSET_NAMES,
  ASSET_COLORS,
  MOCK_PORTFOLIO_BASE_VALUE,
  CHART_TARGET_GROWTH,
  CHART_VOLATILITY,
  CHART_MIN_VALUE_RATIO
} from '@/constants/portfolio';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-advisor' | 'actions' | 'history'>('overview');

  const fetchPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch real portfolio data first
      const portfolioResponse = await fetch('/api/portfolio');
      const portfolioData = await portfolioResponse.json();
      
      if (portfolioResponse.ok && portfolioData.hasPortfolio) {
        // Use real portfolio data, but with mocked totalValue for demo
        const realPortfolio: Portfolio = {
          id: portfolioData.portfolio.id,
          strategy: portfolioData.portfolio.strategy,
          totalValue: portfolioData.portfolio.totalValue > 0 ? portfolioData.portfolio.totalValue : MOCK_PORTFOLIO_BASE_VALUE,
          allocations: portfolioData.portfolio.allocations,
          lastRebalanced: portfolioData.portfolio.lastRebalanced,
          isActive: portfolioData.portfolio.isActive,
        };
        
        setPortfolio(realPortfolio);
        
        // Use mock performance data for demo
        setPerformanceData(generateMockPerformanceData(realPortfolio.totalValue, 30));
        
        // Use centralized wallet balance calculation (in real app, this would come from Web3)
        setWalletBalance(realPortfolio.totalValue);
        setLastUpdate(new Date());
        
      } else {
        // Fallback to mock data if no real portfolio exists
        const mockStrategy = 'medium';
        const mockPortfolio: Portfolio = {
          id: 'portfolio-1',
          strategy: mockStrategy,
          totalValue: MOCK_PORTFOLIO_BASE_VALUE,
          allocations: getMockPortfolioAllocations(mockStrategy),
          lastRebalanced: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        };

        setPortfolio(mockPortfolio);
        setPerformanceData(generateMockPerformanceData(mockPortfolio.totalValue, 30));
        
        // Use centralized wallet balance calculation
        setWalletBalance(mockPortfolio.totalValue);
        setLastUpdate(new Date());
      }
      
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      
      // Fallback to mock data on error
      const mockStrategy = 'medium';
      const mockPortfolio: Portfolio = {
        id: 'portfolio-1',
        strategy: mockStrategy,
        totalValue: MOCK_PORTFOLIO_BASE_VALUE,
        allocations: getMockPortfolioAllocations(mockStrategy),
        lastRebalanced: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      };

      setPortfolio(mockPortfolio);
      setPerformanceData(generateMockPerformanceData(mockPortfolio.totalValue, 30));
      
      // Use centralized wallet balance calculation
      setWalletBalance(mockPortfolio.totalValue);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const generateMockPerformanceData = (initialValue: number, days: number): PerformanceData[] => {
    const data = [];
    const now = new Date();
    
    // Use proper initial value or default to base value for demo
    const baseValue = initialValue > 0 ? initialValue : MOCK_PORTFOLIO_BASE_VALUE;
    
    // Get target growth from centralized constants
    const timeframe = days === 7 ? '7d' : days === 90 ? '90d' : '30d';
    const targetGrowth = CHART_TARGET_GROWTH[timeframe];
    const dailyTrend = targetGrowth / (days + 1);
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Generate realistic price movement with some volatility - FOR DEMO
      const randomChange = (Math.random() - 0.5) * CHART_VOLATILITY;
      const dailyChange = dailyTrend + randomChange;
      
      const previousValue: number = i === days ? baseValue : data[data.length - 1].value;
      const value: number = previousValue * (1 + dailyChange);
      const change: number = i === days ? 0 : previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: isNaN(value) || !isFinite(value) ? baseValue : Math.max(Math.round(value * 100) / 100, baseValue * CHART_MIN_VALUE_RATIO),
        change: isNaN(change) || !isFinite(change) ? 0 : Math.round(change * 100) / 100,
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
            <p className="text-gray-200 text-lg mb-8">You don&apos;t have an active portfolio yet.</p>
            <Link
              href="/generate"
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
    asset: asset as keyof typeof ASSET_NAMES,
    percentage: isNaN(percentage) ? 0 : percentage,
    value: calculateAssetValue(portfolio.totalValue, percentage),
  }));

  // Get mocked performance data from centralized constants
  const mockedPerformance = getStrategyPerformance(portfolio.strategy);

  const totalReturn = performanceData.length > 0 && performanceData[0].value > 0
    ? ((performanceData[performanceData.length - 1].value - performanceData[0].value) / performanceData[0].value) * 100
    : mockedPerformance.performance30d; // Fallback to mocked 30-day performance

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Portfolio Management</h1>
              <p className="text-gray-200 text-lg">
                Monitor and manage your AI-powered portfolio
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

          {/* Tab Navigation */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-1">
            <nav className="flex space-x-1">
              {[
                { id: 'overview', name: 'Overview', icon: ChartPieIcon },
                { id: 'actions', name: 'Fund Actions', icon: ArrowsUpDownIcon },
                { id: 'history', name: 'Transactions', icon: HistoryIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
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
                        className={ASSET_COLORS[asset]}
                        style={{ width: `${percentage}%` }}
                        title={`${ASSET_NAMES[asset]}: ${percentage}%`}
                      />
                    ))}
                  </div>
                </div>

                {/* Allocation Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allocationData.map(({ asset, percentage, value }) => (
                    <div key={asset} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${ASSET_COLORS[asset]} mr-3`} />
                        <div>
                          <p className="font-medium text-white">{ASSET_NAMES[asset]}</p>
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
                    {formatCurrency(calculateMockedWalletBalance(walletBalance !== null ? walletBalance : portfolio.totalValue, portfolio.strategy))}
                  </p>
                  <p className="text-indigo-100 text-sm flex items-center justify-end">
                    <span className="mr-2">Total Assets</span>
                    <span className="text-xs bg-green-400/30 text-green-100 px-2 py-1 rounded-full">
                      +{mockedPerformance.performance24h.toFixed(1)}% today
                    </span>
                  </p>
                </div>
              </div>

              {/* Strategy Overview */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {STRATEGY_NAMES[portfolio.strategy]}
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Performance</h3>
                  <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                    Demo Data
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      +{mockedPerformance.performance7d.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-300">7 Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      +{mockedPerformance.performance30d.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-300">30 Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      +{mockedPerformance.performance90d.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-300">90 Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {mockedPerformance.sharpeRatio.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-300">Sharpe Ratio</p>
                  </div>
                </div>
              </div>

              {/* Emergency Rebalance */}
              <EmergencyRebalance onRebalanceComplete={fetchPortfolioData} />
            </div>
          </div>
        )}

        {/* Actions Tab (Withdraw) */}
        {activeTab === 'actions' && portfolio && (
          <div className="pt-4">
            <div className="max-w-2xl mx-auto">
              <Web3Actions 
                portfolio={portfolio}
                onTransactionComplete={() => {
                  // Refresh portfolio data after transaction
                  fetchPortfolioData();
                }}
              />
            </div>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="pt-4">
            <div className="max-w-4xl mx-auto">
              <TransactionHistory />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
