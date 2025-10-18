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
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
    // Simulate fetching wallet balance
    const fetchWalletBalance = async () => {
      try {
        // This would be a real API call to get wallet balance
        // For now, we'll simulate it
        const balance = portfolio.totalValue * (0.95 + Math.random() * 0.1); // Simulate some variation
        setWalletBalance(balance);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    fetchWalletBalance();
  }, [portfolio.totalValue]);

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
    asset: asset as keyof typeof assetNames,
    percentage: isNaN(percentage) ? 0 : percentage,
    value: isNaN(portfolio.totalValue) || isNaN(percentage) ? 0 : (portfolio.totalValue * percentage) / 100,
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
              {walletBalance !== null ? formatCurrency(walletBalance) : formatCurrency(0)}
            </p>
            <p className="text-indigo-100 text-sm">Total Assets</p>
          </div>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {strategyNames[portfolio.strategy]}
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
                <p className="text-lg font-semibold text-green-600">+2.4%</p>
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
            <div key={asset} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${assetColors[asset]} mr-3`} />
                <div>
                  <p className="font-medium text-gray-900">{assetNames[asset]}</p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">+12.5%</p>
            <p className="text-sm text-gray-500">7 Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">+28.3%</p>
            <p className="text-sm text-gray-500">30 Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">+45.7%</p>
            <p className="text-sm text-gray-500">90 Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">0.85</p>
            <p className="text-sm text-gray-500">Sharpe Ratio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
