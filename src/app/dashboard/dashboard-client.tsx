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
  ArrowTrendingDownIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import PortfolioOverview from '@/components/PortfolioOverview';
import TransactionHistory from '@/components/TransactionHistory';
import AIChat from '@/components/AIChat';
import RecentActivity from '@/components/RecentActivity';
import PerformanceChart from '@/components/PerformanceChart';
import WalletDisplay from '@/components/WalletDisplay';

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
    { id: 'deposit', name: 'Deposit', icon: PlusIcon },
    { id: 'withdraw', name: 'Withdraw', icon: ArrowTrendingDownIcon },
    { id: 'ai-advisor', name: 'AI Advisor', icon: SparklesIcon },
    { id: 'chat', name: 'AI Assistant', icon: ChatBubbleLeftRightIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Security & Wallet Status Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Secure Custody Wallet</h1>
                <div className="flex items-center space-x-2 text-indigo-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">Protected & Insured</span>
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
                    <span className="text-sm font-medium">+2.4% (24h)</span>
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

        {!hasWallet ? (
          // Wallet creation in progress
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Setting Up Your Wallet
                </h2>
                <p className="text-gray-600 mb-6">
                  We&apos;re automatically creating your secure custody wallet. This will only take a moment...
                </p>
                <button
                  onClick={() => fetchDashboardData()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Check Status
                </button>
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
          // AI Advisor interface - Direct to chat
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4">
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            <AIChat 
              onPortfolioCreated={(newPortfolio) => {
                setPortfolio(newPortfolio);
                setActiveTab('overview');
              }}
            />
          </div>
        ) : activeTab === 'chat' ? (
          // AI Chat interface
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          // Main dashboard with improved UX
          <div className="space-y-6">
            {/* Quick Actions Bar - Mobile Optimized */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3 lg:justify-start">
                <button 
                  onClick={() => setActiveTab('deposit')}
                  className="flex items-center justify-center px-3 py-2 sm:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline sm:inline">Deposit</span>
                  <span className="xs:hidden sm:hidden">+</span>
                </button>
                <button 
                  onClick={() => setActiveTab('withdraw')}
                  className="flex items-center justify-center px-3 py-2 sm:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline sm:inline">Withdraw</span>
                  <span className="xs:hidden sm:hidden">−</span>
                </button>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="flex items-center justify-center px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <CurrencyDollarIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline sm:inline">Transactions</span>
                  <span className="xs:hidden sm:hidden">₿</span>
                </button>
                <button 
                  onClick={() => setActiveTab('ai-advisor')}
                  className="flex items-center justify-center px-3 py-2 sm:px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  <SparklesIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline sm:inline">AI Advisor</span>
                  <span className="xs:hidden sm:hidden">AI</span>
                </button>
                <button className="flex items-center justify-center px-3 py-2 sm:px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                  <ArrowPathIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline sm:inline">Rebalance</span>
                  <span className="xs:hidden sm:hidden">⟲</span>
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center justify-center px-3 py-2 sm:px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline sm:inline">Settings</span>
                  <span className="xs:hidden sm:hidden">⚙</span>
                </button>
              </div>
            </div>


            {/* Main Content Area */}
            <div className="min-h-[600px]">
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Mobile-First Portfolio Overview */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Main Portfolio Overview */}
                    <PortfolioOverview 
                      portfolio={portfolio} 
                      onPortfolioUpdate={setPortfolio}
                    />
                    
                    {/* Mobile: Stacked Layout, Desktop: Side-by-side */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Recent Activity - Priority on mobile */}
                        <RecentActivity />
                        {/* Performance Chart - Secondary on mobile */}
                        <div className="block lg:hidden">
                          <PerformanceChart />
                        </div>
                      </div>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {/* Wallet Display - Always visible */}
                        <WalletDisplay />
                        
                        {/* Portfolio Health - Compact on mobile */}
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Portfolio Health</h3>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-gray-600">Risk Level</span>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                                <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{portfolio.strategy}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-gray-600">Diversification</span>
                              <span className="text-xs sm:text-sm font-medium text-green-600">Excellent</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-gray-600">Rebalance Status</span>
                              <span className="text-xs sm:text-sm font-medium text-green-600">Up to date</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Performance Chart - Desktop sidebar */}
                        <div className="hidden lg:block">
                          <PerformanceChart />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'transactions' && (
                <div>
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Dashboard
                    </button>
                  </div>
                  <TransactionHistory />
                </div>
              )}
              
              {activeTab === 'deposit' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Dashboard
                    </button>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Deposit Funds</h2>
                    <WalletDisplay />
                  </div>
                </div>
              )}
              
              {activeTab === 'withdraw' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Dashboard
                    </button>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Withdraw Funds</h2>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-800 mb-1">Withdrawal Notice</h4>
                          <p className="text-sm text-yellow-700">Withdrawals may take 1-3 business days to process and will be subject to network fees.</p>
                        </div>
                      </div>
                    </div>
                    {/* Withdrawal form would go here */}
                    <p className="text-gray-600">Withdrawal interface coming soon...</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'chat' && (
                <AIChat 
                  onPortfolioCreated={(newPortfolio) => {
                    setPortfolio(newPortfolio);
                    setActiveTab('overview');
                  }}
                />
              )}
              
              {activeTab === 'settings' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Dashboard
                    </button>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Security & Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Wallet Security</h3>
                        <p className="text-sm text-gray-600 mb-4">Your funds are protected by institutional-grade security.</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Multi-signature protection
                          </div>
                          <div className="flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Cold storage backup
                          </div>
                          <div className="flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Insurance coverage
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Account Settings</h3>
                        <p className="text-sm text-gray-600">Manage your account preferences and notifications.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}