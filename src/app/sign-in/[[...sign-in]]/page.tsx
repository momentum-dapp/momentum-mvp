'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { WalletIcon } from '@heroicons/react/24/outline';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  
  useEffect(() => {
    async function handleConnection() {
      if (isConnected && address) {
        try {
          // Create session
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress: address }),
          });

          if (response.ok) {
            // Create or update user
            await fetch('/api/auth/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ walletAddress: address }),
            });

            // Redirect to intended page or dashboard
            const redirect = searchParams.get('redirect') || '/dashboard';
            router.push(redirect);
          }
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    }

    handleConnection();
  }, [isConnected, address, router, searchParams]);

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome To{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              MomentumFI
            </span>
          </h1>
          <p className="text-gray-300">Connect your wallet to access your AI-powered portfolio</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-gray-700/50">
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
                <WalletIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-sm text-gray-400">
                Sign in securely using your Web3 wallet
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={isPending || isConnected}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Connected
                </>
              ) : (
                <>
                  <WalletIcon className="w-5 h-5" />
                  Connect Wallet
                </>
              )}
            </button>

            <div className="space-y-3 pt-4 border-t border-gray-700/50">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Secure & Non-Custodial</p>
                  <p className="text-xs text-gray-400">You always control your funds</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">No Password Required</p>
                  <p className="text-xs text-gray-400">Sign in with your wallet signature</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Base Network</p>
                  <p className="text-xs text-gray-400">Optimized for low fees and fast transactions</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center pt-2">
              By connecting your wallet, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
