'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  SparklesIcon,
} from '@heroicons/react/24/outline';
import AIChat from '@/components/AIChat';

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

export default function GenerateClient() {
  const { address, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [showChat, setShowChat] = useState(false);
  const [strategySuggestion, setStrategySuggestion] = useState('14.25');

  useEffect(() => {
    if (isConnected && address) {
      checkPortfolio();
    }
  }, [isConnected, address]);

  const checkPortfolio = async () => {
    try {
      setLoading(true);
      
      // Fetch portfolio if wallet is connected
      if (isConnected && address) {
        const portfolioResponse = await fetch('/api/portfolio');
        const portfolioData = await portfolioResponse.json();
        
        if (portfolioData.hasPortfolio) {
          setPortfolio(portfolioData.portfolio);
        } else {
          setPortfolio(null);
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindStrategy = async () => {
    // This could trigger AI analysis based on selected risk
    setShowChat(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If showing chat interface
  if (showChat) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <button
              onClick={() => setShowChat(false)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Strategy Selection
            </button>
          </div>
          <AIChat 
            onPortfolioCreated={(newPortfolio) => {
              setPortfolio(newPortfolio);
              setShowChat(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isConnected || !address ? (
          // Wallet not connected (shouldn't happen due to middleware, but just in case)
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Wallet Connection Required
                </h2>
                <p className="text-gray-600 mb-6">
                  Please connect your wallet to access portfolio generation.
                </p>
                <Link 
                  href="/sign-in"
                  className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Connect Wallet
                </Link>
              </div>
            </div>
          </div>
        ) : portfolio ? (
          // User already has portfolio - redirect to portfolio page
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Portfolio Already Exists
                </h2>
                <p className="text-gray-600 mb-6">
                  You already have an active portfolio. View your portfolio to see your investments.
                </p>
                <Link 
                  href="/portfolio"
                  className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  View Portfolio
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Portfolio creation flow - New UI based on screenshot
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Welcome to MomentumFI!
              </h1>
              <p className="text-gray-600 text-base md:text-lg max-w-2xl">
                I&apos;m your DeFi portfolio rebalancing assistant.
                Manage your crypto assets, automate rebalancing, and keep your portfolio aligned with your
                investment goals.
              </p>
            </div>

            {/* Strategy Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 space-y-8">
              {/* Strategy Display Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 text-base md:text-lg">
                  Find the best Performing Strategy for Rebalance{' '}
                  <span className="font-semibold text-gray-900">{strategySuggestion}</span>
                </p>
              </div>

              {/* Find Strategies Portfolio Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Find Strategies Portfolio
                </h2>

                {/* Risk Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Risk
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRisk('low')}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                        selectedRisk === 'low'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      Low
                    </button>
                    <button
                      onClick={() => setSelectedRisk('medium')}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                        selectedRisk === 'medium'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setSelectedRisk('high')}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                        selectedRisk === 'high'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      High
                    </button>
                  </div>
                </div>

                {/* Find Strategy Button */}
                <button
                  onClick={handleFindStrategy}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-md"
                >
                  Find Rebalance Strategy
                </button>
              </div>
            </div>

            {/* Start New Chat Button */}
            <div className="flex justify-center pt-8">
              <button
                onClick={() => setShowChat(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-md"
              >
                Start new chat
              </button>
            </div>

            {/* Built on Base Network */}
            <div className="text-center pt-4">
              <p className="text-gray-600 text-sm">
                Built on Base Network
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
