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
        ) : (
          // Show chat interface
          <div className="space-y-6">
            {portfolio && (
              // User already has portfolio - show info banner
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
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
            )}
            
            {/* Always show AI chat section */}
            <AIChat 
              onPortfolioCreated={(newPortfolio) => {
                setPortfolio(newPortfolio);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
