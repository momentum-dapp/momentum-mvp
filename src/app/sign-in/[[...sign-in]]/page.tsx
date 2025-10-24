'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { WalletIcon } from '@heroicons/react/24/outline';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  // Use ref to track if we've already processed this connection
  const processedAddressRef = useRef<string | null>(null);
  
  useEffect(() => {
    async function handleConnection() {
      // Only process if connected, have address, not already setting up, and haven't processed this address yet
      if (isConnected && address && !isSettingUp && processedAddressRef.current !== address) {
        try {
          setIsSettingUp(true);
          processedAddressRef.current = address; // Mark as processed
          
          console.log('Setting up session for address:', address);
          
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

            // Small delay to ensure session is set
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirect to intended page or dashboard
            const redirect = searchParams.get('redirect') || '/dashboard';
            console.log('Redirecting to:', redirect);
            router.push(redirect);
            router.refresh(); // Force refresh to update auth state
          } else {
            console.error('Failed to create session');
            setIsSettingUp(false);
            processedAddressRef.current = null; // Reset on failure
          }
        } catch (error) {
          console.error('Error creating session:', error);
          setIsSettingUp(false);
          processedAddressRef.current = null; // Reset on error
        }
      }
    }

    handleConnection();
  }, [isConnected, address, router, searchParams, isSettingUp]);

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  // Show loading state while authenticating
  if (isSettingUp || (isConnected && address)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-md w-full px-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-gray-700/50">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
                <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Wallet Connected!</h2>
                <p className="text-gray-400">
                  Taking you to your dashboard...
                </p>
              </div>
              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Redirecting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              disabled={isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Connecting...
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
                  <p className="text-sm font-medium text-white">Your Wallet, Your Keys</p>
                  <p className="text-xs text-gray-400">Connect your existing MetaMask or Web3 wallet</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">One-Click Sign In</p>
                  <p className="text-xs text-gray-400">No passwords, no sign-ups required</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Powered by Base</p>
                  <p className="text-xs text-gray-400">Low fees, fast transactions</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center pt-4">
              By connecting, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
