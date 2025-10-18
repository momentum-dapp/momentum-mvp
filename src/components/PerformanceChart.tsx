'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface PerformanceData {
  date: string;
  value: number;
  change: number;
}

interface PerformanceChartProps {
  data?: PerformanceData[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Generate mock performance data based on timeframe
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const mockData: PerformanceData[] = [];
      const baseValue = 10000;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate realistic portfolio performance with some volatility
        const volatility = 0.02; // 2% daily volatility
        const trend = timeframe === '7d' ? 0.001 : timeframe === '30d' ? 0.0005 : 0.0002; // Slight upward trend
        const randomChange = (Math.random() - 0.5) * volatility;
        const dailyChange = trend + randomChange;
        
        const value = i === days 
          ? baseValue 
          : mockData[mockData.length - 1].value * (1 + dailyChange);
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          value,
          change: dailyChange * 100
        });
      }
      
      setPerformanceData(mockData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    if (data) {
      setPerformanceData(data);
      setLoading(false);
    } else {
      fetchPerformanceData();
    }
  }, [data, fetchPerformanceData]);

  const getTotalReturn = () => {
    if (performanceData.length < 2) return 0;
    const firstValue = performanceData[0].value;
    const lastValue = performanceData[performanceData.length - 1].value;
    if (!firstValue || firstValue === 0 || isNaN(firstValue) || isNaN(lastValue)) return 0;
    const result = ((lastValue - firstValue) / firstValue) * 100;
    return isNaN(result) || !isFinite(result) ? 0 : result;
  };

  const getMaxValue = () => {
    if (performanceData.length === 0) return 0;
    const values = performanceData.map(d => d.value).filter(v => !isNaN(v) && isFinite(v));
    return values.length > 0 ? Math.max(...values) : 0;
  };

  const getMinValue = () => {
    if (performanceData.length === 0) return 0;
    const values = performanceData.map(d => d.value).filter(v => !isNaN(v) && isFinite(v));
    return values.length > 0 ? Math.min(...values) : 0;
  };

  const totalReturn = getTotalReturn();
  const maxValue = getMaxValue();
  const minValue = getMinValue();
  const range = maxValue - minValue || 1; // Prevent division by zero

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Portfolio Performance</h2>
            <p className="text-sm text-gray-500">Value over time</p>
          </div>
          
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeframe === period
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Performance Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(performanceData[performanceData.length - 1]?.value || 0)}
            </p>
            <p className="text-sm text-gray-500">Current Value</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold flex items-center justify-center ${
              totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalReturn >= 0 ? (
                <ArrowTrendingUpIcon className="h-5 w-5 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-5 w-5 mr-1" />
              )}
              {formatPercentage(Math.abs(totalReturn))}
            </p>
            <p className="text-sm text-gray-500">Total Return</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(maxValue)}
            </p>
            <p className="text-sm text-gray-500">All Time High</p>
          </div>
        </div>

        {/* Simple Chart */}
        <div className="relative h-64 bg-gray-50 rounded-lg p-4">
          <div className="absolute inset-4">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {performanceData.length > 1 && (
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-indigo-600"
                  points={performanceData.map((point, index) => {
                    const x = (index / (performanceData.length - 1)) * 100;
                    const y = 100 - ((point.value - minValue) / range) * 100;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}
            </svg>
          </div>
          
          {/* Chart Grid Lines */}
          <div className="absolute inset-4 flex flex-col justify-between">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div key={percent} className="flex items-center">
                <div className="w-full border-t border-gray-200"></div>
                <div className="ml-2 text-xs text-gray-500">
                  {formatCurrency(minValue + (range * (100 - percent) / 100))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Points */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Start Value:</span>
            <span className="font-medium">{formatCurrency(performanceData[0]?.value || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">End Value:</span>
            <span className="font-medium">{formatCurrency(performanceData[performanceData.length - 1]?.value || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Highest:</span>
            <span className="font-medium text-green-600">{formatCurrency(maxValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Lowest:</span>
            <span className="font-medium text-red-600">{formatCurrency(minValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
