'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import AIAdvisor from '@/components/AIAdvisor';

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
}

export default function AdvisorClient() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      
      if (data.hasPortfolio && data.portfolio) {
        setPortfolio({
          id: data.portfolio.id,
          strategy: data.portfolio.strategy,
          totalValue: data.portfolio.totalValue,
          allocations: data.portfolio.allocations,
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStrategySelected = () => {
    // Refresh portfolio data after strategy change
    fetchPortfolio();
  };

  const handleRefresh = () => {
    fetchPortfolio(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header matching dashboard style */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link
                href="/generate"
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Portfolio Advisor</h1>
                <div className="flex items-center space-x-2 text-indigo-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">
                    {portfolio ? 'Portfolio Optimization' : 'Strategy Consultation'}
                  </span>
                </div>
              </div>
            </div>
            
            {portfolio && (
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${portfolio.totalValue.toLocaleString()}
                  </div>
                  <div className="flex items-center text-green-300">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Current Portfolio</span>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Advisor Component */}
        <AIAdvisor 
          currentPortfolio={portfolio}
          onStrategySelected={handleStrategySelected}
        />
      </div>
    </div>
  );
}
