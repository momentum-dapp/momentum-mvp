'use client';

import { useState } from 'react';
import { 
  ChartPieIcon, 
  ArrowPathIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  WalletIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { 
  getStrategyPerformance, 
  calculateMockedWalletBalance,
  calculateAssetValue,
  STRATEGY_NAMES,
  ASSET_NAMES,
  ASSET_COLORS 
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

interface PortfolioOverviewProps {
  portfolio: Portfolio;
  onPortfolioUpdate: (portfolio: Portfolio) => void;
}

export default function PortfolioOverview({ portfolio, onPortfolioUpdate }: PortfolioOverviewProps) {
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [lastUpdate] = useState<Date>(new Date());

  // Get mocked performance data from centralized constants
  const mockedPerformance = getStrategyPerformance(portfolio.strategy);

  // Calculate mocked wallet balance using centralized function
  const walletBalance = calculateMockedWalletBalance(portfolio.totalValue, portfolio.strategy);

  const handleRebalance = async () => {
    setIsRebalancing(true);
    try {
      // Trigger rebalancing logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      // Update portfolio with new allocations
      onPortfolioUpdate({
        ...portfolio,
        lastRebalanced: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Rebalancing failed:', error);
    } finally {
      setIsRebalancing(false);
    }
  };

  const allocationData = Object.entries(portfolio.allocations).map(([asset, percentage]) => ({
    asset: asset as keyof typeof ASSET_NAMES,
    percentage: isNaN(percentage) ? 0 : percentage,
    value: calculateAssetValue(portfolio.totalValue, percentage),
  }));

  return (
    <div className="space-y-6">
      {/* Wallet Balance Overview */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <WalletIcon className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-lg font-semibold">Wallet Balance</h2>
              <p className="text-indigo-100 text-sm">
                Last updated {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              {formatCurrency(walletBalance)}
            </p>
            <p className="text-indigo-100 text-sm flex items-center justify-end">
              <span className="mr-2">Total Assets</span>
              <span className="text-xs bg-green-400/30 text-green-100 px-2 py-1 rounded-full">
                +{mockedPerformance.performance24h.toFixed(1)}% today
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {STRATEGY_NAMES[portfolio.strategy]}
            </h2>
            <p className="text-sm text-gray-500">
              Last rebalanced {new Date(portfolio.lastRebalanced).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleRebalance}
            disabled={isRebalancing}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRebalancing ? 'animate-spin' : ''}`} />
            {isRebalancing ? 'Rebalancing...' : 'Rebalance'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <ChartPieIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(portfolio.totalValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">24h Change</p>
                <p className="text-lg font-semibold text-green-600">
                  +{mockedPerformance.performance24h.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <CalendarIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Strategy</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {portfolio.strategy} Risk
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Allocation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h3>
        
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
            <div key={asset} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${ASSET_COLORS[asset]} mr-3`} />
                <div>
                  <p className="font-medium text-gray-900">{ASSET_NAMES[asset]}</p>
                  <p className="text-sm text-gray-500">{formatPercentage(percentage)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{formatCurrency(value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Demo Data
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              +{mockedPerformance.performance7d.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 font-medium">7 Days</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              +{mockedPerformance.performance30d.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 font-medium">30 Days</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              +{mockedPerformance.performance90d.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 font-medium">90 Days</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {mockedPerformance.sharpeRatio.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 font-medium">Sharpe Ratio</p>
          </div>
        </div>

        {/* Additional Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Total Return</p>
              <p className="text-xl font-bold text-green-600">
                +{mockedPerformance.totalReturn.toFixed(1)}%
              </p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="text-xl font-bold text-indigo-600">
                {mockedPerformance.winRate}%
              </p>
            </div>
            <ChartPieIcon className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Risk Level</p>
              <p className="text-xl font-bold text-gray-900 capitalize">
                {portfolio.strategy}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
