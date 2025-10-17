'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  PlusIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import PortfolioOverview from '@/components/PortfolioOverview';
import TransactionHistory from '@/components/TransactionHistory';
import AIChat from '@/components/AIChat';
import WalletConnection from '@/components/WalletConnection';
import RecentActivity from '@/components/RecentActivity';
import PerformanceChart from '@/components/PerformanceChart';

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

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch wallet status
      const walletResponse = await fetch('/api/wallet');
      const walletData = await walletResponse.json();
      setHasWallet(walletData.hasWallet);

      // Fetch portfolio if wallet exists
      if (walletData.hasWallet) {
        const portfolioResponse = await fetch('/api/portfolio');
        const portfolioData = await portfolioResponse.json();
        
        if (portfolioData.hasPortfolio) {
          setPortfolio(portfolioData.portfolio);
        } else {
          setPortfolio(null);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'transactions', name: 'Transactions', icon: CurrencyDollarIcon },
    { id: 'ai-advisor', name: 'AI Advisor', icon: SparklesIcon },
    { id: 'chat', name: 'AI Assistant', icon: ChatBubbleLeftRightIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">Momentum</h1>
              {portfolio && (
                <div className="ml-8 flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    Portfolio Value
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${portfolio.totalValue.toLocaleString()}
                  </div>
                  <div className="flex items-center text-green-600">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+2.4%</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {portfolio && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasWallet ? (
          // Wallet setup flow
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Set Up Your Wallet
                </h2>
                <p className="text-gray-600 mb-6">
                  Create a secure smart wallet to start managing your portfolio with AI-powered strategies.
                </p>
                <WalletConnection onWalletCreated={() => {
                  setHasWallet(true);
                  fetchDashboardData();
                }} />
              </div>
            </div>
          </div>
        ) : !portfolio && activeTab !== 'ai-advisor' && activeTab !== 'chat' ? (
          // Portfolio creation flow
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-blue-100 rounded-lg shadow-sm p-10">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Create Your Portfolio
                </h2>
                <p className="text-gray-600 mb-6">
                  Let our AI advisor help you choose the perfect investment strategy based on your risk tolerance.
                </p>
                <Link
                  href="/ai-advisor"
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-block"
                >
                  Get AI Portfolio Recommendation
                </Link>
              </div>
            </div>
          </div>
        ) : activeTab === 'ai-advisor' ? (
          // AI Advisor interface
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <Link
                href="/ai-advisor"
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Go to AI Advisor
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AI Portfolio Advisor
              </h2>
              <p className="text-gray-600 mb-6">
                Get personalized investment recommendations and execute strategies automatically.
              </p>
              <Link
                href="/ai-advisor"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start AI Consultation
              </Link>
            </div>
          </div>
        ) : activeTab === 'chat' ? (
          // AI Chat interface
          <div className="max-w-4xl mx-auto">
            {!portfolio && (
              <div className="mb-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Portfolio Setup
                </button>
              </div>
            )}
            <AIChat 
              onPortfolioCreated={(newPortfolio) => {
                setPortfolio(newPortfolio);
                setActiveTab('overview');
              }}
            />
          </div>
        ) : portfolio ? (
          // Main dashboard
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64">
              <nav className="bg-white rounded-lg shadow-sm p-4">
                <ul className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab.id
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {tab.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            {/* Main content */}
            <div className="flex-1">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <PortfolioOverview 
                    portfolio={portfolio} 
                    onPortfolioUpdate={setPortfolio}
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentActivity />
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Get AI Recommendation
                        </button>
                        <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Rebalance Portfolio
                        </button>
                        <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <ChartBarIcon className="h-4 w-4 mr-2" />
                          View Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Chart */}
                  <PerformanceChart />
                </div>
              )}
              {activeTab === 'transactions' && <TransactionHistory />}
              {activeTab === 'chat' && (
                <AIChat 
                  onPortfolioCreated={(newPortfolio) => {
                    setPortfolio(newPortfolio);
                    setActiveTab('overview');
                  }}
                />
              )}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
                  <p className="text-gray-600">Settings panel coming soon...</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}